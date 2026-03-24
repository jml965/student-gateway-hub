import { Router } from "express";
import {
  db,
  universitiesTable,
  specializationsTable,
  usersTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
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

export default router;
