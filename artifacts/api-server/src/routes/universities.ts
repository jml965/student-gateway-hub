import { Router } from "express";
import { db, universitiesTable, specializationsTable } from "@workspace/db";
import { eq, and, ilike, gte, lte, or, SQL } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { q, country, degree, minFee, maxFee, specQ, status = "active", page = "1", limit = "20" } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * pageSize;

  const conditions: SQL[] = [];
  if (status) conditions.push(eq(universitiesTable.status, status as "active" | "inactive"));
  if (country) conditions.push(eq(universitiesTable.country, country));
  if (q) {
    conditions.push(or(
      ilike(universitiesTable.nameEn, `%${q}%`),
      ilike(universitiesTable.nameAr, `%${q}%`),
      ilike(universitiesTable.city, `%${q}%`),
    )!);
  }

  const universities = await db
    .select()
    .from(universitiesTable)
    .where(conditions.length ? and(...conditions) : undefined)
    .limit(pageSize)
    .offset(offset)
    .orderBy(universitiesTable.nameEn);

  const specConditions: SQL[] = [
    eq(specializationsTable.status, "active"),
  ];
  if (degree) specConditions.push(eq(specializationsTable.degree, degree as "bachelor" | "master" | "phd" | "diploma"));
  if (minFee) specConditions.push(gte(specializationsTable.tuitionFee, minFee));
  if (maxFee) specConditions.push(lte(specializationsTable.tuitionFee, maxFee));
  if (specQ) {
    specConditions.push(or(
      ilike(specializationsTable.nameEn, `%${specQ}%`),
      ilike(specializationsTable.nameAr, `%${specQ}%`),
    )!);
  }

  const uniIds = universities.map((u) => u.id);

  let specializations: typeof specializationsTable.$inferSelect[] = [];
  if (uniIds.length) {
    specializations = await db
      .select()
      .from(specializationsTable)
      .where(and(...specConditions));
    specializations = specializations.filter((s) => uniIds.includes(s.universityId));
  }

  const specsByUni = new Map<number, typeof specializationsTable.$inferSelect[]>();
  for (const s of specializations) {
    const list = specsByUni.get(s.universityId) ?? [];
    list.push(s);
    specsByUni.set(s.universityId, list);
  }

  const hasSpecFilter = !!(degree || minFee || maxFee || specQ);
  const results = universities
    .map((u) => ({ ...u, specializations: specsByUni.get(u.id) ?? [] }))
    .filter((u) => !hasSpecFilter || u.specializations.length > 0);

  res.json({ data: results, page: pageNum, pageSize, hasMore: results.length === pageSize });
});

router.get("/countries", async (_req, res) => {
  const rows = await db
    .selectDistinct({ country: universitiesTable.country })
    .from(universitiesTable)
    .orderBy(universitiesTable.country);
  res.json(rows.map((r) => r.country));
});

router.get("/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) { res.status(400).json({ error: "invalid_id" }); return; }

  const [uni] = await db.select().from(universitiesTable).where(eq(universitiesTable.id, id)).limit(1);
  if (!uni) { res.status(404).json({ error: "not_found" }); return; }

  const specs = await db
    .select()
    .from(specializationsTable)
    .where(eq(specializationsTable.universityId, id))
    .orderBy(specializationsTable.degree, specializationsTable.nameEn);

  res.json({ ...uni, specializations: specs });
});

export default router;
