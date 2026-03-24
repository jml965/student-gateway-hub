import { Router } from "express";
import { db, servicesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/middleware";

const router = Router();

router.use(requireAuth);

router.get("/my", async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const items = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.userId, userId))
    .orderBy(desc(servicesTable.createdAt));
  res.json(items);
});

router.post("/", async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const { type, provider, details } = req.body as {
    type?: string;
    provider?: string;
    details?: Record<string, unknown>;
  };

  if (!type) {
    res.status(400).json({ error: "type is required" });
    return;
  }

  const [item] = await db
    .insert(servicesTable)
    .values({
      userId,
      type,
      provider: provider ?? null,
      detailsJson: details ?? null,
      status: "requested",
    })
    .returning();

  res.status(201).json(item);
});

export default router;
