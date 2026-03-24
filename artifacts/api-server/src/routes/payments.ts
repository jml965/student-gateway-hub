import { Router } from "express";
import { db, applicationsTable, paymentsTable, universitiesTable, specializationsTable, notificationsTable, applicationEventsTable, usersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/middleware";
import { getUncachableStripeClient, getStripePublishableKey } from "../lib/stripe";

const router = Router();

const BASE_URL = process.env.REPLIT_DOMAINS
  ? `https://${process.env.REPLIT_DOMAINS.split(",")[0]}`
  : "http://localhost:3000";

// ─── PUBLIC: Stripe webhook (must be before requireAuth, uses raw body) ───
router.post("/stripe/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event: any;
  try {
    const stripe = await getUncachableStripeClient();
    event = stripe.webhooks.constructEvent(req.body, sig, secret ?? "");
  } catch {
    res.status(400).send("Webhook signature verification failed");
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as any;
    const { applicationId, studentId } = session.metadata ?? {};
    if (applicationId && session.payment_status === "paid") {
      const appId = parseInt(applicationId);
      const stuId = parseInt(studentId);

      await db.update(paymentsTable)
        .set({ status: "confirmed", stripePaymentIntentId: session.payment_intent, confirmedAt: new Date() })
        .where(eq(paymentsTable.stripeSessionId, session.id));

      const [app] = await db.select({ status: applicationsTable.status })
        .from(applicationsTable).where(eq(applicationsTable.id, appId)).limit(1);

      if (app) {
        await db.update(applicationsTable)
          .set({ status: "accepted" })
          .where(eq(applicationsTable.id, appId));

        await db.insert(applicationEventsTable).values({
          applicationId: appId,
          fromStatus: app.status as any,
          toStatus: "accepted",
          notes: "Payment confirmed via Stripe",
          createdBy: stuId,
        });

        await db.insert(notificationsTable).values({
          userId: stuId,
          titleAr: "تم تأكيد الدفع!",
          titleEn: "Payment Confirmed!",
          bodyAr: "تم استلام دفعتك بنجاح وتم قبولك نهائياً.",
          bodyEn: "Your payment was received and your application is now accepted.",
          type: "application_update",
          refId: appId,
        });
      }
    }
  }

  res.json({ received: true });
});

// ─── Protected routes ───
router.use(requireAuth);

router.get("/info/:applicationId", async (req: AuthRequest, res) => {
  const appId = parseInt(req.params.applicationId);
  if (isNaN(appId)) { res.status(400).json({ error: "invalid_id" }); return; }

  const userId = req.user!.id;

  const [app] = await db
    .select({
      id: applicationsTable.id,
      status: applicationsTable.status,
      studentId: applicationsTable.studentId,
      tuitionFee: specializationsTable.tuitionFee,
      currency: specializationsTable.currency,
      specNameEn: specializationsTable.nameEn,
      specNameAr: specializationsTable.nameAr,
      uniNameEn: universitiesTable.nameEn,
      uniNameAr: universitiesTable.nameAr,
      universityId: universitiesTable.id,
      paymentMode: universitiesTable.paymentMode,
      bankIban: universitiesTable.bankIban,
      bankName: universitiesTable.bankName,
      bankBeneficiary: universitiesTable.bankBeneficiary,
      bankBranch: universitiesTable.bankBranch,
      bankInstructionsAr: universitiesTable.bankInstructionsAr,
      bankInstructionsEn: universitiesTable.bankInstructionsEn,
    })
    .from(applicationsTable)
    .innerJoin(specializationsTable, eq(applicationsTable.specializationId, specializationsTable.id))
    .innerJoin(universitiesTable, eq(specializationsTable.universityId, universitiesTable.id))
    .where(eq(applicationsTable.id, appId))
    .limit(1);

  if (!app) { res.status(404).json({ error: "not_found" }); return; }
  if (app.studentId !== userId && req.user!.role !== "admin") {
    res.status(403).json({ error: "forbidden" }); return;
  }

  const [payment] = await db
    .select()
    .from(paymentsTable)
    .where(eq(paymentsTable.applicationId, appId))
    .limit(1);

  let publishableKey: string | null = null;
  if (app.paymentMode === "platform") {
    try { publishableKey = await getStripePublishableKey(); } catch { /* no key */ }
  }

  res.json({ app, payment: payment ?? null, publishableKey });
});

router.post("/bank/initiate", async (req: AuthRequest, res) => {
  const { applicationId } = req.body as { applicationId?: number };
  if (!applicationId) { res.status(400).json({ error: "applicationId required" }); return; }

  const userId = req.user!.id;

  const [app] = await db
    .select({
      id: applicationsTable.id,
      status: applicationsTable.status,
      studentId: applicationsTable.studentId,
      tuitionFee: specializationsTable.tuitionFee,
      currency: specializationsTable.currency,
      universityId: universitiesTable.id,
      paymentMode: universitiesTable.paymentMode,
    })
    .from(applicationsTable)
    .innerJoin(specializationsTable, eq(applicationsTable.specializationId, specializationsTable.id))
    .innerJoin(universitiesTable, eq(specializationsTable.universityId, universitiesTable.id))
    .where(eq(applicationsTable.id, applicationId))
    .limit(1);

  if (!app) { res.status(404).json({ error: "not_found" }); return; }
  if (app.studentId !== userId) { res.status(403).json({ error: "forbidden" }); return; }
  if (app.paymentMode !== "direct") { res.status(400).json({ error: "bank_payment_not_supported" }); return; }
  if (!["preliminary_accepted", "payment_pending"].includes(app.status)) {
    res.status(400).json({ error: "payment_not_available", message: "Application must be in preliminary_accepted or payment_pending status" });
    return;
  }

  const existing = await db
    .select({ id: paymentsTable.id, status: paymentsTable.status })
    .from(paymentsTable)
    .where(and(eq(paymentsTable.applicationId, applicationId), eq(paymentsTable.studentId, userId)))
    .limit(1);

  if (existing.length > 0 && existing[0].status !== "failed") {
    res.json({ payment: existing[0], message: "already_exists" });
    return;
  }

  const [payment] = await db.insert(paymentsTable).values({
    applicationId,
    studentId: userId,
    universityId: app.universityId,
    amount: app.tuitionFee ?? "0",
    currency: app.currency,
    channel: "bank",
    status: "pending",
  }).returning();

  await db.update(applicationsTable)
    .set({ status: "payment_pending" })
    .where(eq(applicationsTable.id, applicationId));

  await db.insert(applicationEventsTable).values({
    applicationId,
    fromStatus: app.status as any,
    toStatus: "payment_pending",
    notes: "Student initiated bank transfer payment",
    createdBy: userId,
  });

  res.json({ payment });
});

router.post("/stripe/create-session", async (req: AuthRequest, res) => {
  const { applicationId } = req.body as { applicationId?: number };
  if (!applicationId) { res.status(400).json({ error: "applicationId required" }); return; }

  const userId = req.user!.id;

  const [app] = await db
    .select({
      id: applicationsTable.id,
      status: applicationsTable.status,
      studentId: applicationsTable.studentId,
      tuitionFee: specializationsTable.tuitionFee,
      currency: specializationsTable.currency,
      specNameEn: specializationsTable.nameEn,
      universityId: universitiesTable.id,
      uniNameEn: universitiesTable.nameEn,
      paymentMode: universitiesTable.paymentMode,
    })
    .from(applicationsTable)
    .innerJoin(specializationsTable, eq(applicationsTable.specializationId, specializationsTable.id))
    .innerJoin(universitiesTable, eq(specializationsTable.universityId, universitiesTable.id))
    .where(eq(applicationsTable.id, applicationId))
    .limit(1);

  if (!app) { res.status(404).json({ error: "not_found" }); return; }
  if (app.studentId !== userId) { res.status(403).json({ error: "forbidden" }); return; }
  if (app.paymentMode !== "platform") { res.status(400).json({ error: "stripe_not_supported" }); return; }
  if (!["preliminary_accepted", "payment_pending"].includes(app.status)) {
    res.status(400).json({ error: "payment_not_available" });
    return;
  }

  const amountCents = Math.round(parseFloat(app.tuitionFee ?? "1000") * 100);
  const currency = (app.currency ?? "USD").toLowerCase();

  try {
    const stripe = await getUncachableStripeClient();
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency,
          product_data: { name: `${app.specNameEn} — ${app.uniNameEn}` },
          unit_amount: amountCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${BASE_URL}/payment?success=1&appId=${applicationId}`,
      cancel_url: `${BASE_URL}/payment?cancel=1&appId=${applicationId}`,
      metadata: { applicationId: String(applicationId), studentId: String(userId) },
    });

    const [payment] = await db.insert(paymentsTable).values({
      applicationId,
      studentId: userId,
      universityId: app.universityId,
      amount: app.tuitionFee ?? "0",
      currency: app.currency,
      channel: "stripe",
      status: "pending",
      stripeSessionId: session.id,
    }).returning();

    await db.update(applicationsTable)
      .set({ status: "payment_pending" })
      .where(eq(applicationsTable.id, applicationId));

    await db.insert(applicationEventsTable).values({
      applicationId,
      fromStatus: app.status as any,
      toStatus: "payment_pending",
      notes: "Stripe payment session created",
      createdBy: userId,
    });

    res.json({ sessionUrl: session.url, sessionId: session.id, payment });
  } catch (err: any) {
    console.error("[stripe] create-session error:", err?.message);
    res.status(500).json({ error: "stripe_error", message: err?.message ?? "Failed to create payment session" });
  }
});

// Upload bank transfer receipt (URL of uploaded proof)
router.post("/bank/upload-receipt", async (req: AuthRequest, res) => {
  const { paymentId, receiptUrl } = req.body as { paymentId?: number; receiptUrl?: string };
  if (!paymentId || !receiptUrl) {
    res.status(400).json({ error: "paymentId and receiptUrl required" });
    return;
  }

  const userId = req.user!.id;

  const [payment] = await db
    .select({ id: paymentsTable.id, studentId: paymentsTable.studentId, status: paymentsTable.status, channel: paymentsTable.channel })
    .from(paymentsTable)
    .where(eq(paymentsTable.id, paymentId))
    .limit(1);

  if (!payment) { res.status(404).json({ error: "not_found" }); return; }
  if (payment.studentId !== userId) { res.status(403).json({ error: "forbidden" }); return; }
  if (payment.channel !== "bank") { res.status(400).json({ error: "only_for_bank_payments" }); return; }
  if (payment.status === "confirmed") { res.status(400).json({ error: "already_confirmed" }); return; }

  await db.update(paymentsTable)
    .set({ receiptUrl })
    .where(eq(paymentsTable.id, paymentId));

  res.json({ ok: true, receiptUrl });
});

export default router;
