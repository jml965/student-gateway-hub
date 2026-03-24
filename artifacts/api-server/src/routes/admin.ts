import { Router } from "express";
import {
  db,
  usersTable,
  chatSessionsTable,
  chatMessagesTable,
  applicationsTable,
  aiSettingsTable,
} from "@workspace/db";
import { count, eq } from "drizzle-orm";
import { requireAuth, requireAdmin, type AuthRequest } from "../lib/middleware";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/stats", async (_req, res) => {
  const [[users], [sessions], [messages], [applications]] = await Promise.all([
    db.select({ count: count() }).from(usersTable),
    db.select({ count: count() }).from(chatSessionsTable),
    db.select({ count: count() }).from(chatMessagesTable),
    db.select({ count: count() }).from(applicationsTable),
  ]);

  res.json({
    totalUsers: users.count,
    totalSessions: sessions.count,
    totalMessages: messages.count,
    totalApplications: applications.count,
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
    [settings] = await db
      .update(aiSettingsTable)
      .set(updates)
      .where(eq(aiSettingsTable.id, existing.id))
      .returning();
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

router.get("/users", async (_req, res) => {
  const users = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      status: usersTable.status,
      country: usersTable.country,
      createdAt: usersTable.createdAt,
    })
    .from(usersTable)
    .limit(100);
  res.json(users);
});

export default router;
