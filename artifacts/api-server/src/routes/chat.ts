import { Router } from "express";
import { db, chatSessionsTable, chatMessagesTable, aiSettingsTable } from "@workspace/db";
import { eq, asc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/middleware";
import { VISA_DATA } from "../lib/visa-data";

const router = Router();

router.use(requireAuth);

router.get("/sessions", async (req: AuthRequest, res) => {
  const sessions = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.userId, req.user!.id))
    .orderBy(asc(chatSessionsTable.createdAt));
  res.json(sessions);
});

router.post("/sessions", async (req: AuthRequest, res) => {
  const [session] = await db
    .insert(chatSessionsTable)
    .values({ userId: req.user!.id, title: null })
    .returning();
  res.status(201).json(session);
});

router.get("/sessions/:sessionId/messages", async (req: AuthRequest, res) => {
  const sessionId = parseInt(req.params.sessionId, 10);
  if (isNaN(sessionId)) {
    res.status(400).json({ error: "invalid_request", message: "Invalid session ID" });
    return;
  }

  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.id, sessionId))
    .limit(1);

  if (!session || session.userId !== req.user!.id) {
    res.status(404).json({ error: "not_found", message: "Session not found" });
    return;
  }

  const messages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(asc(chatMessagesTable.createdAt));

  res.json(messages);
});

function buildSystemPrompt(basePrompt: string): string {
  const visaSummary = VISA_DATA.map(v => {
    const docs = v.documentsAr.join("، ");
    return `- ${v.nameAr} (${v.code}): معالجة ${v.processingDays} يوم، رسوم ${v.feesUSD}$، الوثائق: ${docs}. ${v.notesAr}`;
  }).join("\n");

  return `${basePrompt}

## خدمات بنصي المتاحة للطلاب

أنت مساعد منصة Baansy للتسجيل الجامعي الذكي. تساعد الطلاب الدوليين في:
1. اختيار الجامعة والتخصص المناسب
2. فهم متطلبات التأشيرة
3. الحصول على خدمات الطلاب المتكاملة

### خدمات الطالب المتاحة:

**السكن الطلابي (housing)**: نوفر سكناً قريباً من الجامعات عبر شركائنا. شقق مفروشة وغرف طلابية في أكثر من 50 مدينة. أسعار تبدأ من 150$ شهرياً.

**التأمين الصحي (insurance)**: تأمين طبي شامل للطلاب الدوليين. خطط من 30$ إلى 150$ شهرياً تشمل: طوارئ، عيادات خارجية، أسنان. متوفر في 40+ دولة.

**حجز السفر (travel)**: أرخص أسعار الطيران عبر شركائنا. توفير تأشيرات السفر المتعددة. خصومات طلابية حصرية تصل 30%.

**استقبال المطار (airport_pickup)**: خدمة استقبال شخصي في المطار ونقل آمن إلى مقر إقامتك. متوفرة في 80+ مطار عالمي. رسوم تبدأ من 30$.

**البطاقة الطلابية الدولية ISIC (student_card)**: أكثر من 150,000 خصم حول العالم في المطاعم والمتاحف والمواصلات. السعر: 20$/سنة.

**شرائح الإنترنت الدولية (internet)**: شرائح SIM دولية أو esim تعمل في 150+ دولة بدون تغيير رقمك. من 15$/شهر.

**بطاقة Visa/Mastercard مسبقة الدفع (prepaid_card)**: بطاقة بنكية دولية مسبقة الدفع للطلاب. يمكن تعبئتها من IBAN أو من رصيد حسابك. مثالية للنفقات الدراسية في الخارج.

---
## متطلبات التأشيرة للدراسة في الخارج (30 دولة رئيسية)

${visaSummary}

---
## تعليمات مهمة حول بطاقات الخدمة

عندما يسأل الطالب عن خدمة معينة أو تحتاج إلى عرض تفاصيل خدمة، اكتب رمز البطاقة في نهاية ردك هكذا:
[CARD:housing] — للسكن الطلابي
[CARD:insurance] — للتأمين الصحي
[CARD:travel] — لحجز السفر
[CARD:airport_pickup] — لاستقبال المطار
[CARD:student_card] — للبطاقة الطلابية الدولية ISIC
[CARD:internet] — لشرائح الإنترنت الدولية
[CARD:prepaid_card] — لبطاقة Visa/Mastercard مسبقة الدفع

مثال: إذا سأل الطالب "أريد سكناً قريباً من جامعتي" فاشرح له الخدمة ثم ضع [CARD:housing] في نهاية ردك.

إذا سأل عن التأشيرة لدولة معينة، اشرح متطلباتها من القائمة أعلاه بشكل واضح.

قاعدة مهمة: ضع رمز البطاقة مرة واحدة فقط في نهاية الرد عند الحاجة. لا تضعه في وسط الجملة.
`;
}

router.post("/sessions/:sessionId/send", async (req: AuthRequest, res) => {
  const sessionId = parseInt(req.params.sessionId, 10);
  const { content } = req.body;

  if (isNaN(sessionId) || !content?.trim()) {
    res.status(422).json({ error: "validation_error", message: "Valid session ID and message content required" });
    return;
  }

  const [session] = await db
    .select()
    .from(chatSessionsTable)
    .where(eq(chatSessionsTable.id, sessionId))
    .limit(1);

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
  const aiSettings = settings ?? {
    model: "gpt-4o-mini",
    systemPrompt:
      "أنت مساعد Baansy الذكي. تساعد الطلاب في التسجيل الجامعي. ردودك قصيرة وبشرية وواضحة.",
    temperature: 0.7,
    maxTokens: 800,
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

  const prevMessages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(asc(chatMessagesTable.createdAt));

  const enrichedSystemPrompt = buildSystemPrompt(aiSettings.systemPrompt);

  const messages = [
    { role: "system" as const, content: enrichedSystemPrompt },
    ...prevMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: aiSettings.model,
        messages,
        temperature: aiSettings.temperature,
        max_tokens: aiSettings.maxTokens ?? 800,
        stream: true,
      }),
    });

    if (!response.ok || !response.body) {
      const errorText = await response.text();
      req.log.error({ status: response.status }, "OpenAI API error");
      const errMsg =
        response.status === 429
          ? "تجاوزت حد الاستخدام. حاول مرة أخرى لاحقاً."
          : "خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.";
      void errorText;
      res.write(`data: ${JSON.stringify({ content: errMsg, done: true })}\n\n`);
      res.end();
      return;
    }

    let fullContent = "";
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let remainder = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const lines = (remainder + chunk).split("\n");
      remainder = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const data = line.slice(6).trim();
        if (data === "[DONE]") {
          res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
          continue;
        }
        try {
          const parsed = JSON.parse(data) as {
            choices?: Array<{ delta?: { content?: string } }>;
          };
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            fullContent += delta;
            res.write(`data: ${JSON.stringify({ content: delta, done: false })}\n\n`);
          }
        } catch {
          // skip malformed SSE chunks
        }
      }
    }

    if (fullContent) {
      await db.insert(chatMessagesTable).values({
        sessionId,
        role: "assistant",
        content: fullContent,
      });

      if (!session.title && prevMessages.length <= 2) {
        const title = content.trim().slice(0, 50);
        await db
          .update(chatSessionsTable)
          .set({ title })
          .where(eq(chatSessionsTable.id, sessionId));
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
