import { Router } from "express";
import { db, universitiesTable, specializationsTable } from "@workspace/db";
import { eq, and, ilike, or, SQL, sql, inArray } from "drizzle-orm";

const router = Router();

router.get("/", async (req, res) => {
  const { q, country, degree, minFee, maxFee, specQ, status = "active", page = "1", limit = "20" } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page));
  const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
  const offset = (pageNum - 1) * pageSize;

  // Base conditions on universities
  const uniConditions: SQL[] = [];
  if (status) uniConditions.push(eq(universitiesTable.status, status as "active" | "inactive"));
  if (country) uniConditions.push(eq(universitiesTable.country, country));
  if (q) {
    uniConditions.push(or(
      ilike(universitiesTable.nameEn, `%${q}%`),
      ilike(universitiesTable.nameAr, `%${q}%`),
      ilike(universitiesTable.city, `%${q}%`),
    )!);
  }

  // Spec filter conditions
  const specConditions: SQL[] = [eq(specializationsTable.status, "active")];
  if (degree) specConditions.push(eq(specializationsTable.degree, degree as "bachelor" | "master" | "phd" | "diploma"));
  if (minFee && !isNaN(parseFloat(minFee))) specConditions.push(sql`${specializationsTable.tuitionFee} >= ${parseFloat(minFee)}`);
  if (maxFee && !isNaN(parseFloat(maxFee))) specConditions.push(sql`${specializationsTable.tuitionFee} <= ${parseFloat(maxFee)}`);
  if (specQ) {
    specConditions.push(or(
      ilike(specializationsTable.nameEn, `%${specQ}%`),
      ilike(specializationsTable.nameAr, `%${specQ}%`),
    )!);
  }

  const hasSpecFilter = !!(degree || minFee || maxFee || specQ);

  // When spec filters are active, resolve the matching university IDs first.
  // This ensures pagination is based on the filtered universe, not the full one.
  let filteredUniIds: number[] | null = null;
  if (hasSpecFilter) {
    const matchingSpecs = await db
      .selectDistinct({ universityId: specializationsTable.universityId })
      .from(specializationsTable)
      .where(and(...specConditions));
    filteredUniIds = matchingSpecs.map((s) => s.universityId);
    if (filteredUniIds.length === 0) {
      res.json({ data: [], page: pageNum, pageSize, hasMore: false });
      return;
    }
    uniConditions.push(inArray(universitiesTable.id, filteredUniIds));
  }

  const universities = await db
    .select()
    .from(universitiesTable)
    .where(uniConditions.length ? and(...uniConditions) : undefined)
    .limit(pageSize + 1) // fetch one extra to detect hasMore
    .offset(offset)
    .orderBy(universitiesTable.nameEn);

  const hasMore = universities.length > pageSize;
  const page_universities = universities.slice(0, pageSize);
  const uniIds = page_universities.map((u) => u.id);

  let specializations: typeof specializationsTable.$inferSelect[] = [];
  if (uniIds.length) {
    const specWhere: SQL[] = [
      eq(specializationsTable.status, "active"),
      inArray(specializationsTable.universityId, uniIds),
    ];
    // Apply spec filters again to only show matching specs inside each university card
    if (degree) specWhere.push(eq(specializationsTable.degree, degree as "bachelor" | "master" | "phd" | "diploma"));
    if (minFee && !isNaN(parseFloat(minFee))) specWhere.push(sql`${specializationsTable.tuitionFee} >= ${parseFloat(minFee)}`);
    if (maxFee && !isNaN(parseFloat(maxFee))) specWhere.push(sql`${specializationsTable.tuitionFee} <= ${parseFloat(maxFee)}`);
    if (specQ) {
      specWhere.push(or(
        ilike(specializationsTable.nameEn, `%${specQ}%`),
        ilike(specializationsTable.nameAr, `%${specQ}%`),
      )!);
    }

    specializations = await db
      .select()
      .from(specializationsTable)
      .where(and(...specWhere));
  }

  const specsByUni = new Map<number, typeof specializationsTable.$inferSelect[]>();
  for (const s of specializations) {
    const list = specsByUni.get(s.universityId) ?? [];
    list.push(s);
    specsByUni.set(s.universityId, list);
  }

  const results = page_universities.map((u) => ({ ...u, specializations: specsByUni.get(u.id) ?? [] }));

  res.json({ data: results, page: pageNum, pageSize, hasMore });
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
