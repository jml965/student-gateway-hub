import { Router } from "express";
import { db, chatSessionsTable, chatMessagesTable, aiSettingsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/middleware";

const router = Router();

router.use(requireAuth);

router.get("/sessions", async (req: AuthRequest, res) => {
  const sessions = await db.select().from(chatSessionsTable)
    .where(eq(chatSessionsTable.userId, req.user!.id))
    .orderBy(asc(chatSessionsTable.createdAt));
  res.json(sessions);
});

router.post("/sessions", async (req: AuthRequest, res) => {
  const [session] = await db.insert(chatSessionsTable)
    .values({ userId: req.user!.id, title: null })
    .returning();
  res.status(201).json(session);
});

router.get("/sessions/:sessionId/messages", async (req: AuthRequest, res) => {
  const sessionId = parseInt(req.params.sessionId);
  const [session] = await db.select().from(chatSessionsTable)
    .where(eq(chatSessionsTable.id, sessionId)).limit(1);

  if (!session || session.userId !== req.user!.id) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }

  const messages = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(asc(chatMessagesTable.createdAt));
  res.json(messages);
});

router.post("/sessions/:sessionId/send", async (req: AuthRequest, res) => {
  const sessionId = parseInt(req.params.sessionId);
  const { content } = req.body;

  if (!content?.trim()) {
    res.status(422).json({ error: "validation_error", message: "Message content is required" });
    return;
  }

  const [session] = await db.select().from(chatSessionsTable)
    .where(eq(chatSessionsTable.id, sessionId)).limit(1);

  if (!session || session.userId !== req.user!.id) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }

  await db.insert(chatMessagesTable).values({
    sessionId,
    role: "user",
    content: content.trim(),
  });

  const [settings] = await db.select().from(aiSettingsTable).limit(1);
  const aiSettings = settings || {
    model: "gpt-4o-mini",
    systemPrompt: "أنت مساعد Baansy الذكي. تساعد الطلاب في التسجيل الجامعي. ردودك قصيرة وبشرية وواضحة.",
    temperature: 0.7,
    maxTokens: 500,
    typingSpeedMs: 20,
  };

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const errMsg = "مفتاح OpenAI API غير مضبوط. يرجى إضافته من لوحة التحكم.";
    await db.insert(chatMessagesTable).values({ sessionId, role: "assistant", content: errMsg });
    res.json({ content: errMsg });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const prevMessages = await db.select().from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(asc(chatMessagesTable.createdAt));

  const messages = [
    { role: "system", content: aiSettings.systemPrompt },
    ...prevMessages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiSettings.model,
        messages,
        temperature: aiSettings.temperature,
        max_tokens: aiSettings.maxTokens,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const error = await response.text();
      req.log.error({ error }, "OpenAI API error");
      const errMsg = "خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.";
      res.write(`data: ${JSON.stringify({ content: errMsg, done: true })}\n\n`);
      res.end();
      return;
    }

    let fullContent = "";
    const decoder = new TextDecoder();

    for await (const chunk of response.body as any) {
      const text = decoder.decode(chunk, { stream: true });
      const lines = text.split("\n").filter((l) => l.startsWith("data: "));

      for (const line of lines) {
        const data = line.slice(6);
        if (data === "[DONE]") {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          continue;
        }
        try {
          const parsed = JSON.parse(data);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            res.write(`data: ${JSON.stringify({ content: delta, done: false })}\n\n`);
          }
        } catch {
          // skip malformed chunks
        }
      }
    }

    if (fullContent) {
      await db.insert(chatMessagesTable).values({ sessionId, role: "assistant", content: fullContent });

      if (!session.title && prevMessages.length <= 2) {
        const title = content.trim().slice(0, 50);
        await db.update(chatSessionsTable).set({ title }).where(eq(chatSessionsTable.id, sessionId));
      }
    }

    res.end();
  } catch (err) {
    req.log.error({ err }, "Streaming error");
    res.write(`data: ${JSON.stringify({ content: "حدث خطأ. حاول مرة أخرى.", done: true })}\n\n`);
    res.end();
  }
});

export default router;
