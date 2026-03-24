import { Router } from "express";
import { db, applicationsTable, applicationEventsTable, specializationsTable, universitiesTable, documentsTable, notificationsTable } from "@workspace/db";
import { eq, and, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/middleware";

const router = Router();
router.use(requireAuth);

router.get("/", async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  const apps = await db
    .select({
      id: applicationsTable.id,
      status: applicationsTable.status,
      notes: applicationsTable.notes,
      submittedAt: applicationsTable.submittedAt,
      createdAt: applicationsTable.createdAt,
      updatedAt: applicationsTable.updatedAt,
      specializationId: applicationsTable.specializationId,
      specNameEn: specializationsTable.nameEn,
      specNameAr: specializationsTable.nameAr,
      degree: specializationsTable.degree,
      tuitionFee: specializationsTable.tuitionFee,
      currency: specializationsTable.currency,
      uniNameEn: universitiesTable.nameEn,
      uniNameAr: universitiesTable.nameAr,
      uniCountry: universitiesTable.country,
      uniCity: universitiesTable.city,
      uniLogoUrl: universitiesTable.logoUrl,
    })
    .from(applicationsTable)
    .innerJoin(specializationsTable, eq(applicationsTable.specializationId, specializationsTable.id))
    .innerJoin(universitiesTable, eq(specializationsTable.universityId, universitiesTable.id))
    .where(eq(applicationsTable.studentId, userId))
    .orderBy(desc(applicationsTable.createdAt));

  res.json(apps);
});

router.post("/", async (req: AuthRequest, res) => {
  const { specializationId } = req.body as { specializationId?: number };
  if (!specializationId || isNaN(Number(specializationId))) {
    res.status(400).json({ error: "validation_error", message: "specializationId is required" });
    return;
  }

  const userId = req.user!.id;

  const [spec] = await db
    .select()
    .from(specializationsTable)
    .where(eq(specializationsTable.id, Number(specializationId)))
    .limit(1);

  if (!spec) {
    res.status(404).json({ error: "not_found", message: "Specialization not found" });
    return;
  }

  const existing = await db
    .select({ id: applicationsTable.id })
    .from(applicationsTable)
    .where(and(
      eq(applicationsTable.studentId, userId),
      eq(applicationsTable.specializationId, Number(specializationId)),
    ))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "duplicate", message: "You already have an application for this specialization" });
    return;
  }

  const [app] = await db.insert(applicationsTable).values({
    studentId: userId,
    specializationId: Number(specializationId),
    status: "draft",
  }).returning();

  await db.insert(applicationEventsTable).values({
    applicationId: app.id,
    fromStatus: null,
    toStatus: "draft",
    notes: null,
    createdBy: userId,
  });

  res.status(201).json(app);
});

router.get("/:id", async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid_id" }); return; }

  const userId = req.user!.id;

  const [app] = await db
    .select({
      id: applicationsTable.id,
      status: applicationsTable.status,
      notes: applicationsTable.notes,
      submittedAt: applicationsTable.submittedAt,
      createdAt: applicationsTable.createdAt,
      updatedAt: applicationsTable.updatedAt,
      specializationId: applicationsTable.specializationId,
      specNameEn: specializationsTable.nameEn,
      specNameAr: specializationsTable.nameAr,
      degree: specializationsTable.degree,
      tuitionFee: specializationsTable.tuitionFee,
      currency: specializationsTable.currency,
      requirementsJson: specializationsTable.requirementsJson,
      uniNameEn: universitiesTable.nameEn,
      uniNameAr: universitiesTable.nameAr,
      uniCountry: universitiesTable.country,
      uniCity: universitiesTable.city,
      uniLogoUrl: universitiesTable.logoUrl,
      universityId: universitiesTable.id,
    })
    .from(applicationsTable)
    .innerJoin(specializationsTable, eq(applicationsTable.specializationId, specializationsTable.id))
    .innerJoin(universitiesTable, eq(specializationsTable.universityId, universitiesTable.id))
    .where(and(eq(applicationsTable.id, id), eq(applicationsTable.studentId, userId)))
    .limit(1);

  if (!app) { res.status(404).json({ error: "not_found" }); return; }

  const events = await db
    .select()
    .from(applicationEventsTable)
    .where(eq(applicationEventsTable.applicationId, id))
    .orderBy(applicationEventsTable.createdAt);

  res.json({ ...app, events });
});

router.post("/:id/submit", async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid_id" }); return; }

  const userId = req.user!.id;

  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(and(eq(applicationsTable.id, id), eq(applicationsTable.studentId, userId)))
    .limit(1);

  if (!app) { res.status(404).json({ error: "not_found" }); return; }
  if (app.status !== "draft") {
    res.status(400).json({ error: "invalid_status", message: "Only draft applications can be submitted" });
    return;
  }

  // Load spec requirements + student docs to validate completeness
  const [spec] = await db
    .select({ requirementsJson: specializationsTable.requirementsJson })
    .from(specializationsTable)
    .where(eq(specializationsTable.id, app.specializationId))
    .limit(1);

  const docs = await db
    .select({ id: documentsTable.id, type: documentsTable.type })
    .from(documentsTable)
    .where(eq(documentsTable.userId, userId));

  if (docs.length === 0) {
    res.status(400).json({ error: "no_documents", message: "Please upload at least one document before submitting" });
    return;
  }

  // If specialization lists required document types, verify each is present
  const reqs = spec?.requirementsJson as Record<string, unknown> | null;
  const requiredDocTypes = Array.isArray(reqs?.requiredDocuments) ? reqs!.requiredDocuments as string[] : null;
  if (requiredDocTypes && requiredDocTypes.length > 0) {
    const uploadedTypes = new Set(docs.map(d => d.type));
    const missing = requiredDocTypes.filter(t => !uploadedTypes.has(t));
    if (missing.length > 0) {
      res.status(400).json({
        error: "missing_documents",
        message: `Missing required document types: ${missing.join(", ")}`,
        missing,
      });
      return;
    }
  }

  const [updated] = await db
    .update(applicationsTable)
    .set({ status: "submitted", submittedAt: new Date() })
    .where(eq(applicationsTable.id, id))
    .returning();

  await db.insert(applicationEventsTable).values({
    applicationId: id,
    fromStatus: "draft",
    toStatus: "submitted",
    notes: null,
    createdBy: userId,
  });

  await db.insert(notificationsTable).values({
    userId,
    type: "application_submitted",
    title: "Application Submitted",
    message: "Your application has been submitted and is awaiting review.",
  });

  res.json(updated);
});

router.delete("/:id", async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid_id" }); return; }

  const userId = req.user!.id;

  const [app] = await db
    .select()
    .from(applicationsTable)
    .where(and(eq(applicationsTable.id, id), eq(applicationsTable.studentId, userId)))
    .limit(1);

  if (!app) { res.status(404).json({ error: "not_found" }); return; }
  if (["accepted", "withdrawn"].includes(app.status)) {
    res.status(400).json({ error: "cannot_withdraw", message: "This application cannot be withdrawn" });
    return;
  }

  const prev = app.status;
  const [updated] = await db
    .update(applicationsTable)
    .set({ status: "withdrawn" })
    .where(eq(applicationsTable.id, id))
    .returning();

  await db.insert(applicationEventsTable).values({
    applicationId: id,
    fromStatus: prev,
    toStatus: "withdrawn",
    notes: "Withdrawn by student",
    createdBy: userId,
  });

  res.json(updated);
});

export default router;
