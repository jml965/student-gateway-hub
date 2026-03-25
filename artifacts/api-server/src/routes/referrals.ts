import { Router } from "express";
import { db, usersTable, referralsTable, referralPaymentsTable } from "@workspace/db";
import { applicationsTable, specializationsTable, universitiesTable } from "@workspace/db";
import { eq, and, desc, sql, count, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../lib/middleware";
import { randomBytes } from "crypto";

const router = Router();

function generateReferralCode(name: string): string {
  const prefix = name.replace(/\s+/g, "").toUpperCase().slice(0, 4).replace(/[^A-Z]/g, "");
  const random = randomBytes(3).toString("hex").toUpperCase();
  return (prefix || "REF") + random;
}

// ─── Referrer: get or create own referral code + stats ──────────────────────
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const [user] = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, referralCode: usersTable.referralCode })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1);

  if (!user) { res.status(404).json({ error: "not_found" }); return; }

  let code = user.referralCode;
  if (!code) {
    code = generateReferralCode(user.name);
    await db.update(usersTable).set({ referralCode: code }).where(eq(usersTable.id, userId));
  }

  // Alias tables for joining student user
  const studentUser = usersTable;

  const referrals = await db
    .select({
      id: referralsTable.id,
      commissionRate: referralsTable.commissionRate,
      commissionAmount: referralsTable.commissionAmount,
      paymentStatus: referralsTable.paymentStatus,
      paidAmount: referralsTable.paidAmount,
      notes: referralsTable.notes,
      paidAt: referralsTable.paidAt,
      createdAt: referralsTable.createdAt,
      studentId: studentUser.id,
      studentName: studentUser.name,
      studentEmail: studentUser.email,
    })
    .from(referralsTable)
    .leftJoin(studentUser, eq(referralsTable.referredStudentId, studentUser.id))
    .where(eq(referralsTable.referrerId, userId))
    .orderBy(desc(referralsTable.createdAt));

  // For each referred student, get their latest application with university + major
  const studentIds = referrals.map(r => r.studentId).filter(Boolean) as number[];

  type AppInfo = {
    studentId: number;
    appStatus: string;
    universityId: number;
    universityNameAr: string;
    universityNameEn: string;
    universityCountry: string;
    majorNameAr: string;
    majorNameEn: string;
    tuitionFee: string | null;
    currency: string;
    appCreatedAt: Date;
  };

  let appsByStudent: Map<number, AppInfo[]> = new Map();
  if (studentIds.length > 0) {
    const apps = await db
      .select({
        studentId: applicationsTable.studentId,
        appStatus: applicationsTable.status,
        universityId: universitiesTable.id,
        universityNameAr: universitiesTable.nameAr,
        universityNameEn: universitiesTable.nameEn,
        universityCountry: universitiesTable.country,
        majorNameAr: specializationsTable.nameAr,
        majorNameEn: specializationsTable.nameEn,
        tuitionFee: specializationsTable.tuitionFee,
        currency: specializationsTable.currency,
        appCreatedAt: applicationsTable.createdAt,
      })
      .from(applicationsTable)
      .innerJoin(specializationsTable, eq(applicationsTable.specializationId, specializationsTable.id))
      .innerJoin(universitiesTable, eq(specializationsTable.universityId, universitiesTable.id))
      .where(inArray(applicationsTable.studentId, studentIds))
      .orderBy(desc(applicationsTable.createdAt));

    for (const app of apps) {
      if (!appsByStudent.has(app.studentId)) appsByStudent.set(app.studentId, []);
      appsByStudent.get(app.studentId)!.push(app as AppInfo);
    }
  }

  // Enrich referrals with stage + applications
  const enriched = referrals.map(r => {
    const apps = r.studentId ? (appsByStudent.get(r.studentId) ?? []) : [];
    const acceptedApps = apps.filter(a => a.appStatus === "accepted");
    const activeApps = apps.filter(a => !["withdrawn", "rejected"].includes(a.appStatus));

    let stage: "potential" | "applied" | "enrolled" = "potential";
    if (acceptedApps.length > 0) stage = "enrolled";
    else if (activeApps.length > 0) stage = "applied";

    return {
      ...r,
      stage,
      applications: apps.map(a => ({
        status: a.appStatus,
        universityId: a.universityId,
        universityNameAr: a.universityNameAr,
        universityNameEn: a.universityNameEn,
        universityCountry: a.universityCountry,
        majorNameAr: a.majorNameAr,
        majorNameEn: a.majorNameEn,
        tuitionFee: a.tuitionFee,
        currency: a.currency,
        appliedAt: a.appCreatedAt,
      })),
    };
  });

  const totalCommission = enriched.reduce((sum, r) => sum + parseFloat(r.commissionAmount || "0"), 0);
  const totalPaid = enriched.reduce((sum, r) => sum + parseFloat(r.paidAmount || "0"), 0);
  const totalUnpaid = totalCommission - totalPaid;

  // Build per-university statement
  const universityMap: Record<number, {
    universityId: number; universityNameAr: string; universityNameEn: string; universityCountry: string;
    students: Array<{ studentName: string | null; studentEmail: string | null; majorNameAr: string; majorNameEn: string; tuitionFee: string | null; currency: string; commissionAmount: string | null; paidAmount: string; paymentStatus: string; }>;
    totalCommission: number; totalPaid: number;
  }> = {};

  for (const ref of enriched) {
    const enrolledApps = ref.applications.filter(a => a.status === "accepted");
    for (const app of enrolledApps) {
      if (!universityMap[app.universityId]) {
        universityMap[app.universityId] = {
          universityId: app.universityId,
          universityNameAr: app.universityNameAr,
          universityNameEn: app.universityNameEn,
          universityCountry: app.universityCountry,
          students: [],
          totalCommission: 0,
          totalPaid: 0,
        };
      }
      const comm = parseFloat(ref.commissionAmount || "0");
      const paid = parseFloat(ref.paidAmount || "0");
      universityMap[app.universityId].students.push({
        studentName: ref.studentName,
        studentEmail: ref.studentEmail,
        majorNameAr: app.majorNameAr,
        majorNameEn: app.majorNameEn,
        tuitionFee: app.tuitionFee,
        currency: app.currency,
        commissionAmount: ref.commissionAmount,
        paidAmount: ref.paidAmount,
        paymentStatus: ref.paymentStatus,
      });
      universityMap[app.universityId].totalCommission += comm;
      universityMap[app.universityId].totalPaid += paid;
    }
  }

  const universityStatements = Object.values(universityMap).map(u => ({
    ...u,
    totalCommission: u.totalCommission.toFixed(2),
    totalPaid: u.totalPaid.toFixed(2),
    totalUnpaid: (u.totalCommission - u.totalPaid).toFixed(2),
  }));

  const frontendUrl =
    process.env.FRONTEND_URL ??
    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : "http://localhost:3000");

  res.json({
    referralCode: code,
    referralLink: `${frontendUrl}/signup?ref=${code}`,
    referrals: enriched,
    universityStatements,
    summary: {
      totalReferrals: enriched.length,
      totalPotential: enriched.filter(r => r.stage === "potential").length,
      totalApplied: enriched.filter(r => r.stage === "applied").length,
      totalEnrolled: enriched.filter(r => r.stage === "enrolled").length,
      totalCommission: totalCommission.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      totalUnpaid: totalUnpaid.toFixed(2),
    },
  });
});

// ─── Admin: list all referrers with balances ─────────────────────────────────
router.get("/admin/referrers", requireAuth, requireAdmin, async (req, res) => {
  const { q, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit)));

  const referrers = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      referralCode: usersTable.referralCode,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(sql`${usersTable.referralCode} IS NOT NULL`)
    .orderBy(desc(usersTable.createdAt))
    .limit(pageSize)
    .offset((pageNum - 1) * pageSize);

  const referrerIds = referrers.map((r) => r.id);

  if (referrerIds.length === 0) {
    res.json({ data: [], page: pageNum, pageSize, hasMore: false });
    return;
  }

  const stats = await db
    .select({
      referrerId: referralsTable.referrerId,
      totalReferrals: count(referralsTable.id),
      totalCommission: sql<string>`COALESCE(SUM(commission_amount::numeric), 0)::text`,
      totalPaid: sql<string>`COALESCE(SUM(paid_amount::numeric), 0)::text`,
    })
    .from(referralsTable)
    .where(inArray(referralsTable.referrerId, referrerIds))
    .groupBy(referralsTable.referrerId);

  const statsMap = new Map(stats.map((s) => [s.referrerId, s]));

  const data = referrers.map((r) => {
    const s = statsMap.get(r.id);
    const totalCommission = parseFloat(s?.totalCommission ?? "0");
    const totalPaid = parseFloat(s?.totalPaid ?? "0");
    return {
      ...r,
      totalReferrals: s?.totalReferrals ?? 0,
      totalCommission: totalCommission.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      totalUnpaid: (totalCommission - totalPaid).toFixed(2),
    };
  });

  res.json({ data, page: pageNum, pageSize, hasMore: data.length === pageSize });
});

// ─── Admin: get one referrer's full statement ─────────────────────────────────
router.get("/admin/referrers/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid_id" }); return; }

  const [referrer] = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, referralCode: usersTable.referralCode, createdAt: usersTable.createdAt })
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);

  if (!referrer) { res.status(404).json({ error: "not_found" }); return; }

  const referrals = await db
    .select({
      id: referralsTable.id,
      commissionRate: referralsTable.commissionRate,
      commissionAmount: referralsTable.commissionAmount,
      paymentStatus: referralsTable.paymentStatus,
      paidAmount: referralsTable.paidAmount,
      notes: referralsTable.notes,
      paidAt: referralsTable.paidAt,
      createdAt: referralsTable.createdAt,
      studentId: usersTable.id,
      studentName: usersTable.name,
      studentEmail: usersTable.email,
    })
    .from(referralsTable)
    .leftJoin(usersTable, eq(referralsTable.referredStudentId, usersTable.id))
    .where(eq(referralsTable.referrerId, id))
    .orderBy(desc(referralsTable.createdAt));

  const payments = await db
    .select()
    .from(referralPaymentsTable)
    .where(eq(referralPaymentsTable.referrerId, id))
    .orderBy(desc(referralPaymentsTable.paidAt));

  const totalCommission = referrals.reduce((s, r) => s + parseFloat(r.commissionAmount || "0"), 0);
  const totalPaid = referrals.reduce((s, r) => s + parseFloat(r.paidAmount || "0"), 0);

  res.json({
    referrer,
    referrals,
    payments,
    summary: {
      totalReferrals: referrals.length,
      totalCommission: totalCommission.toFixed(2),
      totalPaid: totalPaid.toFixed(2),
      totalUnpaid: (totalCommission - totalPaid).toFixed(2),
    },
  });
});

// ─── Admin: record a commission payment ──────────────────────────────────────
router.post("/admin/referrers/:id/payments", requireAuth, requireAdmin, async (req: AuthRequest, res) => {
  const referrerId = parseInt(req.params.id);
  if (isNaN(referrerId)) { res.status(400).json({ error: "invalid_id" }); return; }

  const { referralId, amount, paymentMethod = "bank", notes } = req.body as {
    referralId: number;
    amount: number;
    paymentMethod?: string;
    notes?: string;
  };

  if (!referralId || !amount || amount <= 0) {
    res.status(400).json({ error: "invalid_request", message: "referralId and positive amount are required" });
    return;
  }

  const [referral] = await db
    .select()
    .from(referralsTable)
    .where(and(eq(referralsTable.id, referralId), eq(referralsTable.referrerId, referrerId)))
    .limit(1);

  if (!referral) { res.status(404).json({ error: "referral_not_found" }); return; }

  const [payment] = await db
    .insert(referralPaymentsTable)
    .values({
      referralId,
      referrerId,
      amount: String(amount),
      paymentMethod,
      notes: notes ?? null,
      recordedBy: req.user!.id,
    })
    .returning();

  const newPaid = parseFloat(referral.paidAmount || "0") + amount;
  const totalCommission = parseFloat(referral.commissionAmount || "0");
  const newStatus = newPaid >= totalCommission ? "paid" : newPaid > 0 ? "partial" : "unpaid";

  const [updated] = await db
    .update(referralsTable)
    .set({
      paidAmount: String(newPaid),
      paymentStatus: newStatus as "paid" | "partial" | "unpaid",
      paidAt: newStatus === "paid" ? new Date() : referral.paidAt,
    })
    .where(eq(referralsTable.id, referralId))
    .returning();

  res.json({ success: true, payment, referral: updated });
});

// ─── Admin: update a referral commission settings ────────────────────────────
router.patch("/admin/referrals/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid_id" }); return; }

  const { commissionRate, commissionAmount, notes } = req.body as {
    commissionRate?: number;
    commissionAmount?: number;
    notes?: string;
  };

  const updates: Record<string, unknown> = {};
  if (commissionRate !== undefined) updates.commissionRate = String(commissionRate);
  if (commissionAmount !== undefined) updates.commissionAmount = String(commissionAmount);
  if (notes !== undefined) updates.notes = notes;

  const [updated] = await db
    .update(referralsTable)
    .set(updates)
    .where(eq(referralsTable.id, id))
    .returning();

  if (!updated) { res.status(404).json({ error: "not_found" }); return; }
  res.json({ success: true, referral: updated });
});

export default router;
