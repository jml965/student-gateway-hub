import { Router } from "express";
import {
  db,
  usersTable,
  chatSessionsTable,
  chatMessagesTable,
  applicationsTable,
  aiSettingsTable,
  documentsTable,
  universitiesTable,
  specializationsTable,
} from "@workspace/db";
import { count, eq, ilike, and, desc, SQL, inArray } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../lib/middleware";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", async (_req, res) => {
  const [[users], [sessions], [messages], [applications], [documents], [universities]] = await Promise.all([
    db.select({ count: count() }).from(usersTable),
    db.select({ count: count() }).from(chatSessionsTable),
    db.select({ count: count() }).from(chatMessagesTable),
    db.select({ count: count() }).from(applicationsTable),
    db.select({ count: count() }).from(documentsTable),
    db.select({ count: count() }).from(universitiesTable),
  ]);

  res.json({
    totalUsers: users.count,
    totalSessions: sessions.count,
    totalMessages: messages.count,
    totalApplications: applications.count,
    totalDocuments: documents.count,
    totalUniversities: universities.count,
  });
});

router.get("/ai-settings", async (_req, res) => {
  let [settings] = await db.select().from(aiSettingsTable).limit(1);
  if (!settings) {
    [settings] = await db.insert(aiSettingsTable).values({}).returning();
  }
  res.json({
    model: settings.model,
    systemPrompt: settings.systemPrompt,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    typingSpeedMs: settings.typingSpeedMs,
    hasApiKey: !!process.env.OPENAI_API_KEY,
  });
});

router.put("/ai-settings", async (req: AuthRequest, res) => {
  const { model, systemPrompt, temperature, maxTokens, typingSpeedMs } = req.body;
  const [existing] = await db.select({ id: aiSettingsTable.id }).from(aiSettingsTable).limit(1);

  type AiUpdate = Partial<typeof aiSettingsTable.$inferInsert>;
  const updates: AiUpdate = {};
  if (model !== undefined) updates.model = String(model);
  if (systemPrompt !== undefined) updates.systemPrompt = String(systemPrompt);
  if (temperature !== undefined) updates.temperature = Number(temperature);
  if (maxTokens !== undefined) updates.maxTokens = Number(maxTokens);
  if (typingSpeedMs !== undefined) updates.typingSpeedMs = Number(typingSpeedMs);

  let settings;
  if (existing) {
    [settings] = await db.update(aiSettingsTable).set(updates).where(eq(aiSettingsTable.id, existing.id)).returning();
  } else {
    [settings] = await db.insert(aiSettingsTable).values({}).returning();
  }

  res.json({
    model: settings.model,
    systemPrompt: settings.systemPrompt,
    temperature: settings.temperature,
    maxTokens: settings.maxTokens,
    typingSpeedMs: settings.typingSpeedMs,
    hasApiKey: !!process.env.OPENAI_API_KEY,
  });
});

// CRM: list students with document + application counts
router.get("/students", async (req, res) => {
  const { q, country, status = "", universityId, page = "1", limit = "20" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit)));

  const conditions: SQL[] = [eq(usersTable.role, "student")];
  if (q) conditions.push(ilike(usersTable.name, `%${q}%`));
  if (country) conditions.push(eq(usersTable.country, country));
  if (status) conditions.push(eq(usersTable.status, status as "active" | "suspended"));

  // Filter by university: find student IDs that have applied to a spec in that university
  if (universityId) {
    const uniId = parseInt(universityId);
    if (!isNaN(uniId)) {
      const specs = await db
        .select({ id: specializationsTable.id })
        .from(specializationsTable)
        .where(eq(specializationsTable.universityId, uniId));
      const specIds = specs.map(s => s.id);
      if (specIds.length > 0) {
        const apps = await db
          .select({ studentId: applicationsTable.studentId })
          .from(applicationsTable)
          .where(inArray(applicationsTable.specializationId, specIds));
        const studentIds = [...new Set(apps.map(a => a.studentId))];
        if (studentIds.length > 0) {
          conditions.push(inArray(usersTable.id, studentIds));
        } else {
          res.json({ data: [], page: pageNum, pageSize, hasMore: false });
          return;
        }
      } else {
        res.json({ data: [], page: pageNum, pageSize, hasMore: false });
        return;
      }
    }
  }

  const students = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      phone: usersTable.phone,
      country: usersTable.country,
      status: usersTable.status,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .where(and(...conditions))
    .orderBy(desc(usersTable.createdAt))
    .limit(pageSize)
    .offset((pageNum - 1) * pageSize);

  const studentIds = students.map((s) => s.id);

  const [docCounts, appCounts] = await Promise.all([
    studentIds.length
      ? db.select({ userId: documentsTable.userId, count: count() }).from(documentsTable).groupBy(documentsTable.userId)
      : Promise.resolve([]),
    studentIds.length
      ? db.select({ studentId: applicationsTable.studentId, count: count() }).from(applicationsTable).groupBy(applicationsTable.studentId)
      : Promise.resolve([]),
  ]);

  const docMap = new Map(docCounts.map((d) => [d.userId, d.count]));
  const appMap = new Map(appCounts.map((a) => [a.studentId, a.count]));

  const result = students.map((s) => ({
    ...s,
    documentCount: docMap.get(s.id) ?? 0,
    applicationCount: appMap.get(s.id) ?? 0,
  }));

  res.json({ data: result, page: pageNum, pageSize, hasMore: result.length === pageSize });
});

// CRM: get one student with all docs and applications
router.get("/students/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid_id" }); return; }

  const [student] = await db
    .select()
    .from(usersTable)
    .where(and(eq(usersTable.id, id), eq(usersTable.role, "student")))
    .limit(1);

  if (!student) { res.status(404).json({ error: "not_found" }); return; }

  const [docs, appRows] = await Promise.all([
    db.select().from(documentsTable).where(eq(documentsTable.userId, id)).orderBy(desc(documentsTable.uploadedAt)),
    db.select({
      id: applicationsTable.id,
      specializationId: applicationsTable.specializationId,
      status: applicationsTable.status,
      notes: applicationsTable.notes,
      submittedAt: applicationsTable.submittedAt,
      createdAt: applicationsTable.createdAt,
      specNameEn: specializationsTable.nameEn,
      specNameAr: specializationsTable.nameAr,
      degree: specializationsTable.degree,
      uniNameEn: universitiesTable.nameEn,
      uniNameAr: universitiesTable.nameAr,
    })
      .from(applicationsTable)
      .innerJoin(specializationsTable, eq(applicationsTable.specializationId, specializationsTable.id))
      .innerJoin(universitiesTable, eq(specializationsTable.universityId, universitiesTable.id))
      .where(eq(applicationsTable.studentId, id))
      .orderBy(desc(applicationsTable.createdAt)),
  ]);

  res.json({
    id: student.id,
    name: student.name,
    email: student.email,
    phone: student.phone,
    country: student.country,
    status: student.status,
    createdAt: student.createdAt,
    documents: docs,
    applications: appRows,
  });
});

// CRM: list all documents (admin view)
router.get("/documents", async (req, res) => {
  const { type, verified, page = "1", limit = "50" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit)));

  const conditions: SQL[] = [];
  if (type) conditions.push(eq(documentsTable.type, type as typeof documentsTable.$inferSelect["type"]));
  if (verified !== undefined) conditions.push(eq(documentsTable.verified, verified === "true"));

  const docs = await db
    .select()
    .from(documentsTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(documentsTable.uploadedAt))
    .limit(pageSize)
    .offset((pageNum - 1) * pageSize);

  res.json({ data: docs, page: pageNum, pageSize, hasMore: docs.length === pageSize });
});

// Verify or reject a document
router.patch("/documents/:id/verify", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid_id" }); return; }

  const verified = Boolean(req.body.verified);
  const [doc] = await db
    .update(documentsTable)
    .set({ verified })
    .where(eq(documentsTable.id, id))
    .returning();

  if (!doc) { res.status(404).json({ error: "not_found" }); return; }
  res.json(doc);
});

router.get("/users", async (_req, res) => {
  const users = await db
    .select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, role: usersTable.role, status: usersTable.status, country: usersTable.country, createdAt: usersTable.createdAt })
    .from(usersTable)
    .limit(100);
  res.json(users);
});

// ─── University Approval CRM ──────────────────────────────────────────────────
router.get("/universities", async (req, res) => {
  const { status, q, page = "1", limit = "30" } = req.query as Record<string, string>;
  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit)));

  const conditions: SQL[] = [];
  if (status) conditions.push(eq(universitiesTable.status, status as typeof universitiesTable.$inferSelect["status"]));
  if (q) conditions.push(
    ilike(universitiesTable.nameEn, `%${q}%`)
  );

  const unis = await db
    .select()
    .from(universitiesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(universitiesTable.createdAt))
    .limit(pageSize)
    .offset((pageNum - 1) * pageSize);

  const specCounts = await db
    .select({ universityId: specializationsTable.universityId, count: count() })
    .from(specializationsTable)
    .groupBy(specializationsTable.universityId);
  const specMap = new Map(specCounts.map((s) => [s.universityId, s.count]));

  const result = unis.map((u) => ({ ...u, specializationCount: specMap.get(u.id) ?? 0 }));
  res.json({ data: result, page: pageNum, pageSize, hasMore: result.length === pageSize });
});

router.get("/universities/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid_id" }); return; }

  const [uni] = await db.select().from(universitiesTable).where(eq(universitiesTable.id, id)).limit(1);
  if (!uni) { res.status(404).json({ error: "not_found" }); return; }

  const [specs, [uniUser]] = await Promise.all([
    db.select().from(specializationsTable).where(eq(specializationsTable.universityId, id)),
    db.select({ id: usersTable.id, name: usersTable.name, email: usersTable.email, status: usersTable.status })
      .from(usersTable).where(and(eq(usersTable.universityId, id), eq(usersTable.role, "university"))).limit(1),
  ]);

  res.json({ ...uni, specializations: specs, contactUser: uniUser ?? null });
});

// Approve a pending university
router.patch("/universities/:id/approve", async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid_id" }); return; }

  const [uni] = await db
    .update(universitiesTable)
    .set({ status: "active", approvedBy: req.user!.id, approvedAt: new Date() })
    .where(eq(universitiesTable.id, id))
    .returning();

  if (!uni) { res.status(404).json({ error: "not_found" }); return; }

  // Also activate the university user account
  await db
    .update(usersTable)
    .set({ status: "active" })
    .where(and(eq(usersTable.universityId, id), eq(usersTable.role, "university")));

  res.json({ success: true, university: uni });
});

// Reject/suspend a university
router.patch("/universities/:id/reject", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid_id" }); return; }

  const [uni] = await db
    .update(universitiesTable)
    .set({ status: "rejected" })
    .where(eq(universitiesTable.id, id))
    .returning();

  if (!uni) { res.status(404).json({ error: "not_found" }); return; }

  await db
    .update(usersTable)
    .set({ status: "suspended" })
    .where(and(eq(usersTable.universityId, id), eq(usersTable.role, "university")));

  res.json({ success: true, university: uni });
});

// Suspend an active university
router.patch("/universities/:id/suspend", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid_id" }); return; }

  const [uni] = await db
    .update(universitiesTable)
    .set({ status: "inactive" })
    .where(eq(universitiesTable.id, id))
    .returning();

  if (!uni) { res.status(404).json({ error: "not_found" }); return; }
  res.json({ success: true, university: uni });
});

export default router;
