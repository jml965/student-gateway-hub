import { Router } from "express";
import { callOpenAI } from "../lib/openai";
import {
  db,
  universitiesTable,
  specializationsTable,
  usersTable,
  applicationsTable,
  applicationEventsTable,
  chatSessionsTable,
  chatMessagesTable,
  notificationsTable,
} from "@workspace/db";
import { eq, and, sql, inArray, ne } from "drizzle-orm";
import { hashPassword } from "../lib/auth";
import { sessionStore } from "../lib/session-store";
import { signToken } from "../lib/auth";
import { requireAuth, type AuthRequest } from "../lib/middleware";

const router = Router();

function requireUniversityUser(req: AuthRequest, res: any, next: any) {
  if (req.user?.role !== "university") {
    res.status(403).json({ error: "forbidden", message: "University account required" });
    return;
  }
  next();
}

// ─── Public: self-registration ────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  const {
    contactName, email, password, phone,
    nameAr, nameEn, country, city, website,
    descriptionAr, descriptionEn, address,
  } = req.body as Record<string, string>;

  if (!contactName || !email || !password || !nameAr || !nameEn || !country || !city) {
    res.status(422).json({ error: "validation_error", message: "Missing required fields" });
    return;
  }
  if (password.length < 8) {
    res.status(422).json({ error: "validation_error", message: "Password must be at least 8 characters" });
    return;
  }

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "email_taken", message: "This email is already registered" });
    return;
  }

  // Create the university record (pending approval)
  const [uni] = await db.insert(universitiesTable).values({
    nameAr,
    nameEn,
    country,
    city,
    website: website || null,
    descriptionAr: descriptionAr || null,
    descriptionEn: descriptionEn || null,
    email: email.toLowerCase(),
    phone: phone || null,
    address: address || null,
    status: "pending",
    paymentMode: "platform",
  }).returning();

  // Create the university user account (pending until admin approves)
  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    name: contactName,
    email: email.toLowerCase(),
    passwordHash,
    phone: phone || null,
    country,
    role: "university",
    status: "pending",
    universityId: uni.id,
  }).returning();

  res.status(201).json({
    message: "Registration submitted. Please wait for admin approval.",
    universityId: uni.id,
    userId: user.id,
  });
});

// ─── Protected: university portal ─────────────────────────────────────────────
router.use(requireAuth, requireUniversityUser);

// GET own profile (includes approval status)
router.get("/profile", async (req: AuthRequest, res) => {
  const uniId = req.user!.universityId;
  if (!uniId) { res.status(404).json({ error: "no_university_linked" }); return; }

  const [uni] = await db.select().from(universitiesTable).where(eq(universitiesTable.id, uniId)).limit(1);
  if (!uni) { res.status(404).json({ error: "not_found" }); return; }

  const specs = await db.select().from(specializationsTable).where(eq(specializationsTable.universityId, uniId));

  res.json({ ...uni, specializations: specs });
});

// PUT update profile (only allowed when active or pending — editing pending info before approval)
router.put("/profile", async (req: AuthRequest, res) => {
  const uniId = req.user!.universityId;
  if (!uniId) { res.status(404).json({ error: "no_university_linked" }); return; }

  const {
    nameAr, nameEn, city, website,
    descriptionAr, descriptionEn, phone, address, logoUrl,
  } = req.body as Record<string, string>;

  const updates: Partial<typeof universitiesTable.$inferInsert> = {};
  if (nameAr) updates.nameAr = nameAr;
  if (nameEn) updates.nameEn = nameEn;
  if (city) updates.city = city;
  if (website !== undefined) updates.website = website || null;
  if (descriptionAr !== undefined) updates.descriptionAr = descriptionAr || null;
  if (descriptionEn !== undefined) updates.descriptionEn = descriptionEn || null;
  if (phone !== undefined) updates.phone = phone || null;
  if (address !== undefined) updates.address = address || null;
  if (logoUrl !== undefined) updates.logoUrl = logoUrl || null;

  const [uni] = await db
    .update(universitiesTable)
    .set(updates)
    .where(eq(universitiesTable.id, uniId))
    .returning();

  res.json(uni);
});

// GET specializations
router.get("/specializations", async (req: AuthRequest, res) => {
  const uniId = req.user!.universityId;
  if (!uniId) { res.status(404).json({ error: "no_university_linked" }); return; }
  const specs = await db.select().from(specializationsTable).where(eq(specializationsTable.universityId, uniId));
  res.json(specs);
});

// POST add specialization
router.post("/specializations", async (req: AuthRequest, res) => {
  const uniId = req.user!.universityId;
  if (!uniId) { res.status(404).json({ error: "no_university_linked" }); return; }

  const [uni] = await db
    .select({ status: universitiesTable.status })
    .from(universitiesTable)
    .where(eq(universitiesTable.id, uniId))
    .limit(1);

  if (uni?.status !== "active") {
    res.status(403).json({ error: "not_approved", message: "University must be approved before adding specializations" });
    return;
  }

  const { nameAr, nameEn, degree, durationYears, tuitionFee, currency, requirementsJson } = req.body;
  if (!nameAr || !nameEn || !degree) {
    res.status(422).json({ error: "validation_error", message: "nameAr, nameEn and degree are required" });
    return;
  }

  const [spec] = await db.insert(specializationsTable).values({
    universityId: uniId,
    nameAr,
    nameEn,
    degree,
    durationYears: durationYears ? Number(durationYears) : 4,
    tuitionFee: tuitionFee ? String(tuitionFee) : null,
    currency: currency || "USD",
    requirementsJson: requirementsJson || null,
    status: "active",
  }).returning();

  res.status(201).json(spec);
});

// PUT update specialization
router.put("/specializations/:id", async (req: AuthRequest, res) => {
  const uniId = req.user!.universityId;
  if (!uniId) { res.status(404).json({ error: "no_university_linked" }); return; }
  const specId = parseInt(req.params.id);
  if (isNaN(specId)) { res.status(400).json({ error: "invalid_id" }); return; }

  const { nameAr, nameEn, degree, durationYears, tuitionFee, currency, requirementsJson, status } = req.body;

  type SpecUpdate = Partial<typeof specializationsTable.$inferInsert>;
  const updates: SpecUpdate = {};
  if (nameAr) updates.nameAr = nameAr;
  if (nameEn) updates.nameEn = nameEn;
  if (degree) updates.degree = degree;
  if (durationYears !== undefined) updates.durationYears = Number(durationYears);
  if (tuitionFee !== undefined) updates.tuitionFee = tuitionFee ? String(tuitionFee) : null;
  if (currency) updates.currency = currency;
  if (requirementsJson !== undefined) updates.requirementsJson = requirementsJson;
  if (status) updates.status = status;

  const [spec] = await db
    .update(specializationsTable)
    .set(updates)
    .where(and(eq(specializationsTable.id, specId), eq(specializationsTable.universityId, uniId)))
    .returning();

  if (!spec) { res.status(404).json({ error: "not_found" }); return; }
  res.json(spec);
});

// DELETE specialization
router.delete("/specializations/:id", async (req: AuthRequest, res) => {
  const uniId = req.user!.universityId;
  if (!uniId) { res.status(404).json({ error: "no_university_linked" }); return; }
  const specId = parseInt(req.params.id);
  if (isNaN(specId)) { res.status(400).json({ error: "invalid_id" }); return; }

  const [spec] = await db
    .delete(specializationsTable)
    .where(and(eq(specializationsTable.id, specId), eq(specializationsTable.universityId, uniId)))
    .returning();

  if (!spec) { res.status(404).json({ error: "not_found" }); return; }
  res.json({ success: true });
});

// ─── Analytics Dashboard ───────────────────────────────────────────────────────
router.get("/analytics", async (req: AuthRequest, res) => {
  const uniId = req.user!.universityId;
  if (!uniId) { res.status(404).json({ error: "no_university_linked" }); return; }

  const [uni] = await db
    .select({ nameAr: universitiesTable.nameAr, nameEn: universitiesTable.nameEn })
    .from(universitiesTable).where(eq(universitiesTable.id, uniId)).limit(1);
  if (!uni) { res.status(404).json({ error: "not_found" }); return; }

  const specs = await db
    .select({ id: specializationsTable.id })
    .from(specializationsTable)
    .where(and(eq(specializationsTable.universityId, uniId)));
  const specIds = specs.map(s => s.id);

  if (specIds.length === 0) {
    return res.json({
      totalApplications: 0, byStatus: {}, bySpecialization: [],
      byCountry: [], incompleteApplications: 0, acceptedRate: 0,
      studentsElsewhere: 0, chatMentions: 0, conversionFunnel: {},
      weeklyTrend: [], topCountries: [],
    });
  }

  const allApps = await db
    .select({
      id: applicationsTable.id,
      status: applicationsTable.status,
      studentId: applicationsTable.studentId,
      specializationId: applicationsTable.specializationId,
      submittedAt: applicationsTable.submittedAt,
      createdAt: applicationsTable.createdAt,
    })
    .from(applicationsTable)
    .where(inArray(applicationsTable.specializationId, specIds));

  const totalApplications = allApps.length;
  const byStatus: Record<string, number> = {};
  const bySpec: Record<number, number> = {};
  const studentIds = new Set(allApps.map(a => a.studentId));

  for (const app of allApps) {
    byStatus[app.status] = (byStatus[app.status] || 0) + 1;
    bySpec[app.specializationId] = (bySpec[app.specializationId] || 0) + 1;
  }

  const incompleteApplications = byStatus["draft"] || 0;
  const accepted = byStatus["accepted"] || 0;
  const submitted = (byStatus["submitted"] || 0) + (byStatus["under_review"] || 0) +
    (byStatus["sent_to_university"] || 0) + (byStatus["preliminary_accepted"] || 0) +
    (byStatus["payment_pending"] || 0) + accepted + (byStatus["rejected"] || 0);
  const acceptedRate = submitted > 0 ? Math.round((accepted / submitted) * 100) : 0;

  const bySpecialization = await Promise.all(
    Object.entries(bySpec).map(async ([specId, count]) => {
      const [sp] = await db.select({ nameAr: specializationsTable.nameAr, nameEn: specializationsTable.nameEn, degree: specializationsTable.degree })
        .from(specializationsTable).where(eq(specializationsTable.id, Number(specId))).limit(1);
      return { specId: Number(specId), nameAr: sp?.nameAr, nameEn: sp?.nameEn, degree: sp?.degree, count };
    })
  );

  let byCountry: { country: string; count: number }[] = [];
  if (studentIds.size > 0) {
    const students = await db
      .select({ id: usersTable.id, country: usersTable.country })
      .from(usersTable)
      .where(inArray(usersTable.id, [...studentIds]));
    const countryMap: Record<string, number> = {};
    for (const s of students) {
      const c = s.country || "Unknown";
      countryMap[c] = (countryMap[c] || 0) + 1;
    }
    byCountry = Object.entries(countryMap)
      .map(([country, count]) => ({ country, count }))
      .sort((a, b) => b.count - a.count);
  }

  let studentsElsewhere = 0;
  if (studentIds.size > 0) {
    const otherApps = await db
      .select({ studentId: applicationsTable.studentId })
      .from(applicationsTable)
      .where(and(
        inArray(applicationsTable.studentId, [...studentIds]),
        sql`${applicationsTable.specializationId} NOT IN (${sql.join(specIds.map(id => sql`${id}`), sql`, `)})`
      ));
    studentsElsewhere = new Set(otherApps.map(a => a.studentId)).size;
  }

  const uniNameLower = uni.nameEn.toLowerCase();
  const uniNameArLower = uni.nameAr.toLowerCase();
  const chatMentionsResult = await db
    .select({ count: sql<number>`count(distinct ${chatMessagesTable.sessionId})` })
    .from(chatMessagesTable)
    .where(sql`lower(${chatMessagesTable.content}) LIKE ${'%' + uniNameLower + '%'} OR lower(${chatMessagesTable.content}) LIKE ${'%' + uniNameArLower + '%'}`);
  const chatMentions = Number(chatMentionsResult[0]?.count || 0);

  const chatStudentsResult = await db
    .select({ userId: chatSessionsTable.userId })
    .from(chatSessionsTable)
    .innerJoin(chatMessagesTable, eq(chatMessagesTable.sessionId, chatSessionsTable.id))
    .where(sql`lower(${chatMessagesTable.content}) LIKE ${'%' + uniNameLower + '%'} OR lower(${chatMessagesTable.content}) LIKE ${'%' + uniNameArLower + '%'}`);
  const chatStudentIds = new Set(chatStudentsResult.map(r => r.userId));
  const potentialStudents = chatStudentIds.size;
  const convertedFromChat = [...chatStudentIds].filter(id => studentIds.has(id)).length;

  const conversionFunnel = {
    chatInquiries: potentialStudents,
    applications: totalApplications,
    submitted,
    accepted,
  };

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentApps = allApps.filter(a => new Date(a.createdAt) > sevenDaysAgo);
  const weeklyTrend: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const ds = d.toISOString().split("T")[0];
    weeklyTrend.push({
      date: ds,
      count: recentApps.filter(a => a.createdAt.toISOString().split("T")[0] === ds).length,
    });
  }

  res.json({
    totalApplications,
    byStatus,
    bySpecialization,
    byCountry,
    topCountries: byCountry.slice(0, 5),
    incompleteApplications,
    acceptedRate,
    studentsElsewhere,
    chatMentions,
    potentialStudents,
    convertedFromChat,
    conversionFunnel,
    weeklyTrend,
    uniqueStudents: studentIds.size,
  });
});

// ─── Applications Review List ──────────────────────────────────────────────────
router.get("/applications", async (req: AuthRequest, res) => {
  const uniId = req.user!.universityId;
  if (!uniId) { res.status(404).json({ error: "no_university_linked" }); return; }

  const specs = await db
    .select({ id: specializationsTable.id })
    .from(specializationsTable)
    .where(eq(specializationsTable.universityId, uniId));
  const specIds = specs.map(s => s.id);

  if (specIds.length === 0) return res.json([]);

  const statusFilter = req.query.status as string | undefined;

  const apps = await db
    .select({
      id: applicationsTable.id,
      status: applicationsTable.status,
      notes: applicationsTable.notes,
      submittedAt: applicationsTable.submittedAt,
      createdAt: applicationsTable.createdAt,
      studentId: applicationsTable.studentId,
      specializationId: applicationsTable.specializationId,
      studentName: usersTable.name,
      studentEmail: usersTable.email,
      studentCountry: usersTable.country,
      studentPhone: usersTable.phone,
      specNameAr: specializationsTable.nameAr,
      specNameEn: specializationsTable.nameEn,
      degree: specializationsTable.degree,
      requirementsJson: specializationsTable.requirementsJson,
    })
    .from(applicationsTable)
    .innerJoin(usersTable, eq(applicationsTable.studentId, usersTable.id))
    .innerJoin(specializationsTable, eq(applicationsTable.specializationId, specializationsTable.id))
    .where(
      statusFilter
        ? and(inArray(applicationsTable.specializationId, specIds), eq(applicationsTable.status, statusFilter as any))
        : inArray(applicationsTable.specializationId, specIds)
    )
    .orderBy(sql`${applicationsTable.submittedAt} DESC NULLS LAST`);

  res.json(apps);
});

// ─── AI Analysis of Applications ──────────────────────────────────────────────
router.post("/applications/ai-analyze", async (req: AuthRequest, res) => {
  const uniId = req.user!.universityId;
  if (!uniId) { res.status(404).json({ error: "no_university_linked" }); return; }

  const { applicationIds } = req.body as { applicationIds?: number[] };
  if (!applicationIds || !Array.isArray(applicationIds) || applicationIds.length === 0) {
    res.status(422).json({ error: "validation_error", message: "applicationIds array required" });
    return;
  }

  const specs = await db
    .select({ id: specializationsTable.id })
    .from(specializationsTable)
    .where(eq(specializationsTable.universityId, uniId));
  const specIds = specs.map(s => s.id);

  const apps = await db
    .select({
      id: applicationsTable.id,
      studentId: applicationsTable.studentId,
      specializationId: applicationsTable.specializationId,
      status: applicationsTable.status,
      studentName: usersTable.name,
      studentCountry: usersTable.country,
      specNameEn: specializationsTable.nameEn,
      specNameAr: specializationsTable.nameAr,
      degree: specializationsTable.degree,
      requirementsJson: specializationsTable.requirementsJson,
    })
    .from(applicationsTable)
    .innerJoin(usersTable, eq(applicationsTable.studentId, usersTable.id))
    .innerJoin(specializationsTable, eq(applicationsTable.specializationId, specializationsTable.id))
    .where(and(
      inArray(applicationsTable.id, applicationIds),
      inArray(applicationsTable.specializationId, specIds)
    ));

  const results = await Promise.all(apps.map(async (app) => {
    try {
      const requirements = app.requirementsJson
        ? JSON.stringify(app.requirementsJson, null, 2)
        : "No specific requirements defined";

      const prompt = `You are a university admissions AI. Analyze this student application for the specialization "${app.specNameEn}" (${app.degree} degree).

Specialization Requirements:
${requirements}

Student Profile:
- Name: ${app.studentName}
- Country: ${app.studentCountry || "Not specified"}

Based on available information, classify this application:
- "match": Student clearly meets the requirements
- "close": Student likely meets some requirements but may need additional review
- "no_match": Student clearly does not meet key requirements

Respond ONLY with valid JSON (no markdown):
{
  "classification": "match or close or no_match",
  "score": 0-100,
  "reasoning": "Brief explanation in 1-2 sentences",
  "recommendations": "What the university should check or ask for"
}`;

      const { data: aiData } = await callOpenAI(
        process.env.OPENAI_API_KEY!,
        "gpt-4o",
        ["gpt-4o-mini", "gpt-3.5-turbo"],
        {
          messages: [{ role: "user", content: prompt }],
          max_tokens: 300,
          temperature: 0.3,
        }
      );
      const content = (aiData.choices as any)?.[0]?.message?.content?.trim() || "{}";
      const parsed = JSON.parse(content);

      return {
        applicationId: app.id,
        classification: parsed.classification || "close",
        score: parsed.score || 50,
        reasoning: parsed.reasoning || "",
        recommendations: parsed.recommendations || "",
      };
    } catch {
      return {
        applicationId: app.id,
        classification: "close" as const,
        score: 50,
        reasoning: "Unable to analyze — no requirements defined",
        recommendations: "Manual review recommended",
      };
    }
  }));

  res.json(results);
});

// ─── Bulk Action on Applications ──────────────────────────────────────────────
router.post("/applications/bulk-action", async (req: AuthRequest, res) => {
  const uniId = req.user!.universityId;
  if (!uniId) { res.status(404).json({ error: "no_university_linked" }); return; }

  const { applicationIds, action } = req.body as { applicationIds: number[]; action: "approve" | "reject" | "review" };
  if (!applicationIds?.length || !action) {
    res.status(422).json({ error: "validation_error", message: "applicationIds and action required" });
    return;
  }

  const specs = await db
    .select({ id: specializationsTable.id })
    .from(specializationsTable)
    .where(eq(specializationsTable.universityId, uniId));
  const specIds = specs.map(s => s.id);

  const targetApps = await db
    .select({ id: applicationsTable.id, status: applicationsTable.status, studentId: applicationsTable.studentId })
    .from(applicationsTable)
    .where(and(
      inArray(applicationsTable.id, applicationIds),
      inArray(applicationsTable.specializationId, specIds)
    ));

  const newStatus = action === "approve" ? "accepted" : action === "reject" ? "rejected" : "under_review";

  await Promise.all(targetApps.map(async (app) => {
    await db.update(applicationsTable)
      .set({ status: newStatus as any })
      .where(eq(applicationsTable.id, app.id));

    await db.insert(applicationEventsTable).values({
      applicationId: app.id,
      fromStatus: app.status,
      toStatus: newStatus,
      notes: `Bulk ${action} by university`,
      createdBy: req.user!.id,
    });

    const notifMsg = action === "approve"
      ? { title: "Application Accepted", message: "Congratulations! Your application has been accepted by the university." }
      : action === "reject"
      ? { title: "Application Update", message: "Your application has been reviewed. Unfortunately it was not accepted at this time." }
      : { title: "Application Under Review", message: "Your application is now under review by the university." };

    await db.insert(notificationsTable).values({
      userId: app.studentId,
      type: "application_submitted",
      ...notifMsg,
    });
  }));

  res.json({ updated: targetApps.length, action, newStatus });
});

// ─── Single Application Action ─────────────────────────────────────────────────
router.put("/applications/:id/status", async (req: AuthRequest, res) => {
  const uniId = req.user!.universityId;
  if (!uniId) { res.status(404).json({ error: "no_university_linked" }); return; }

  const appId = parseInt(req.params.id);
  const { status, notes } = req.body as { status: string; notes?: string };
  if (!status) { res.status(422).json({ error: "missing_status" }); return; }

  const specs = await db.select({ id: specializationsTable.id })
    .from(specializationsTable).where(eq(specializationsTable.universityId, uniId));
  const specIds = specs.map(s => s.id);

  const [app] = await db.select()
    .from(applicationsTable)
    .where(and(eq(applicationsTable.id, appId), inArray(applicationsTable.specializationId, specIds)))
    .limit(1);

  if (!app) { res.status(404).json({ error: "not_found" }); return; }

  const [updated] = await db.update(applicationsTable)
    .set({ status: status as any, notes: notes || app.notes })
    .where(eq(applicationsTable.id, appId))
    .returning();

  await db.insert(applicationEventsTable).values({
    applicationId: appId,
    fromStatus: app.status,
    toStatus: status,
    notes: notes || null,
    createdBy: req.user!.id,
  });

  if (status === "accepted" || status === "rejected") {
    await db.insert(notificationsTable).values({
      userId: app.studentId,
      type: "application_submitted",
      title: status === "accepted" ? "Application Accepted" : "Application Update",
      message: status === "accepted"
        ? "Congratulations! Your application has been accepted by the university."
        : "Your application has been reviewed. Unfortunately it was not accepted at this time.",
    });
  }

  res.json(updated);
});

export default router;
