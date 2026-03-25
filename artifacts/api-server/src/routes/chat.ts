import { Router } from "express";
import { callOpenAIStream, callOpenAI, CHAT_FALLBACK_MODELS, CLASSIFY_FALLBACK_MODELS } from "../lib/openai";
import {
  db,
  chatSessionsTable,
  chatMessagesTable,
  aiSettingsTable,
  userMemoryTable,
  usersTable,
  applicationsTable,
} from "@workspace/db";
import { eq, asc, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/middleware";
import { VISA_DATA } from "../lib/visa-data";
import type { UserMemoryFacts } from "@workspace/db";

const router = Router();

// ── الذاكرة القصيرة: آخر 20 رسالة من الجلسة الحالية ──────────────────────────
const SHORT_TERM_WINDOW = 20;

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

// ── بناء System Prompt مع بيانات الخدمات + ذاكرة المستخدم ────────────────────
function buildSystemPrompt(
  basePrompt: string,
  memory: UserMemoryFacts,
  studentProfile: { name?: string; country?: string; status?: string; hasApplication: boolean },
): string {
  const visaSummary = VISA_DATA.map((v) => {
    const docs = v.documentsAr.join("، ");
    return `- ${v.nameAr} (${v.code}): معالجة ${v.processingDays} يوم، رسوم ${v.feesUSD}$، الوثائق: ${docs}. ${v.notesAr}`;
  }).join("\n");

  // ── ملف الطالب من قاعدة البيانات ──
  const profileSection = `
## ملف الطالب الحالي
- الاسم: ${studentProfile.name || "غير معروف"}
- البلد: ${studentProfile.country || "غير محدد"}
- حالة الحساب: ${studentProfile.status === "active" ? "نشط" : studentProfile.status || "غير محدد"}
- لديه طلب تسجيل: ${studentProfile.hasApplication ? "نعم" : "لا"}
`;

  // ── الذاكرة بعيدة المدى: ما نعرفه من محادثات سابقة ──
  let memorySection = "";
  const facts: string[] = [];
  if (memory.name) facts.push(`اسمه المفضل: ${memory.name}`);
  if (memory.country) facts.push(`بلده الأصلي: ${memory.country}`);
  if (memory.targetCountries?.length) facts.push(`يريد الدراسة في: ${memory.targetCountries.join(", ")}`);
  if (memory.interests?.length) facts.push(`اهتماماته: ${memory.interests.join(", ")}`);
  if (memory.degree) facts.push(`المرحلة: ${memory.degree}`);
  if (memory.budget) facts.push(`الميزانية: ${memory.budget}`);
  if (memory.stage) facts.push(`مرحلته: ${memory.stage}`);
  if (memory.dreamOutcome) facts.push(`حلمه: ${memory.dreamOutcome}`);
  if (memory.motivations?.length) facts.push(`دوافعه: ${memory.motivations.join("، ")}`);
  if (memory.concerns?.length) facts.push(`مخاوفه: ${memory.concerns.join("، ")}`);
  if (memory.mainObjection) facts.push(`عائقه الرئيسي: ${memory.mainObjection}`);
  if (memory.interestedUniversities?.length) facts.push(`جامعات اهتم بها: ${memory.interestedUniversities.join(", ")}`);

  if (facts.length > 0) {
    memorySection = `
## ما تعرفه عن هذا الطالب (من محادثات سابقة)
${facts.map((f) => `- ${f}`).join("\n")}
`;
  }

  // ── تحليل الشخصية واستراتيجية الإقناع ──
  let persuasionSection = "";
  if (memory.personalityType || memory.persuasionApproach) {
    const styleMap: Record<string, string> = {
      analytical: "يحتاج أرقاماً وإحصاءات وحقائق — قدّم له معدلات التوظيف والتصنيفات الأكاديمية",
      emotional: "يتأثر بالقصص والمشاعر — شاركه قصص نجاح خريجين وأثر الدراسة على حياتهم",
      social: "يتأثر بآراء الآخرين — اذكر سمعة الجامعة وعدد المتقدمين وتقييمات الطلاب",
      pragmatic: "يركز على الفائدة العملية — ركّز على فرص العمل، الراتب المتوقع، والمسار الوظيفي",
    };
    persuasionSection = `
## استراتيجية الإقناع لهذا الطالب
- نوع الشخصية: ${memory.personalityType ? styleMap[memory.personalityType] || memory.personalityType : "غير محدد"}
${memory.persuasionApproach ? `- أسلوب الإقناع الموصى به: ${memory.persuasionApproach}` : ""}
${memory.keyMotivator ? `- أقوى دافع لديه: ${memory.keyMotivator}` : ""}
${memory.whatWorked?.length ? `- ما أثار اهتمامه: ${memory.whatWorked.join("، ")}` : ""}
${memory.whatDidntWork?.length ? `- ما لم ينفع معه: ${memory.whatDidntWork.join("، ")}` : ""}
`;
  }

  return `${basePrompt}

${profileSection}
${memorySection}
${persuasionSection}

## مهمتك الأساسية
أنت مستشار تسجيل جامعي ذكي. هدفك هو:
1. **فهم الطالب** — استمع جيداً وطرح أسئلة ذكية لفهم أهدافه ومخاوفه
2. **بناء الثقة** — كن صادقاً وإنسانياً، لا تبدو كمبيعات
3. **تخصيص التوصيات** — بناءً على ما تعرفه عنه، اقترح جامعات وتخصصات مناسبة له تحديداً
4. **معالجة المخاوف** — إذا أبدى قلقاً، تعامل معه بجدية لا تتجاهله
5. **قيادة نحو التسجيل** — عندما يكون مستعداً، وجّهه نحو إنهاء التسجيل بسلاسة
${studentProfile.hasApplication ? "" : "\n⚡ هذا الطالب لم يتقدم بعد — كن استباقياً في توجيهه نحو التسجيل عند المناسب."}

## خدمات بنصي المتاحة للطلاب

**السكن الطلابي (housing)**: سكن قريب من الجامعات — شقق مفروشة من 150$/شهر في 50+ مدينة
**التأمين الصحي (insurance)**: تأمين طبي شامل من 30$ حتى 150$/شهر — 40+ دولة
**حجز السفر (travel)**: أرخص أسعار الطيران مع خصومات طلابية تصل 30%
**استقبال المطار (airport_pickup)**: استقبال شخصي في 80+ مطار من 30$
**البطاقة الطلابية ISIC (student_card)**: 150,000+ خصم حول العالم — 20$/سنة
**شرائح الإنترنت (internet)**: SIM دولية تعمل في 150+ دولة من 15$/شهر
**بطاقة Visa/Mastercard مسبقة الدفع (prepaid_card)**: بطاقة بنكية دولية مسبقة الدفع للطلاب

## متطلبات التأشيرة (30 دولة)
${visaSummary}

## تعليمات البطاقات التفاعلية
عندما تتحدث عن خدمة ضع رمزها في نهاية ردك مرة واحدة فقط:
[CARD:housing] [CARD:insurance] [CARD:travel] [CARD:airport_pickup] [CARD:student_card] [CARD:internet] [CARD:prepaid_card]

## قواعد الرد
- ردودك قصيرة وبشرية — لا تكرر السؤال ولا تطيل
- تجاوب بلغة المستخدم دائماً
- لا تذكر جامعات منافسة بالاسم
- لا تكن مبالغاً في الحماس — كن طبيعياً وصادقاً
`;
}

// ── استخراج وتحديث الذاكرة بعيدة المدى (في الخلفية) ─────────────────────────
async function extractAndUpdateMemory(
  apiKey: string,
  userId: number,
  recentMessages: { role: string; content: string }[],
  currentFacts: UserMemoryFacts,
): Promise<void> {
  try {
    const currentFactsStr = JSON.stringify(currentFacts, null, 2);
    const conversationStr = recentMessages
      .slice(-6)
      .map((m) => `${m.role === "user" ? "الطالب" : "المساعد"}: ${m.content}`)
      .join("\n");

    const prompt = `أنت محلل نفسي ومتخصص في تحليل سلوك العملاء. حلّل هذه المحادثة وأخرج معلومات عن الطالب.

الحقائق الحالية المعروفة:
${currentFactsStr}

المحادثة الأخيرة:
${conversationStr}

أخرج JSON يحدّث أو يضيف فقط ما استجدّ. أرجع فقط JSON صالح بدون ماركداون:
{
  "name": "اسمه إن ذُكر",
  "country": "بلده الأصلي",
  "targetCountries": ["دول يريد الدراسة فيها"],
  "interests": ["مجالات اهتمامه"],
  "degree": "bachelor/master/phd/diploma",
  "budget": "نطاق الميزانية إن ذُكر",
  "stage": "cold/exploring/interested/comparing/decided/applied",
  "dreamOutcome": "ما يحلم بتحقيقه بعد التخرج",
  "motivations": ["ما يدفعه للدراسة"],
  "concerns": ["مخاوفه وترددات"],
  "mainObjection": "أكبر عائق أمامه",
  "keyMotivator": "أقوى شيء يحفزه",
  "personalityType": "analytical/emotional/social/pragmatic",
  "communicationStyle": "formal/casual/detailed/brief",
  "responseToSales": "receptive/skeptical/neutral",
  "persuasionApproach": "كيف تقنعه بالتسجيل بجملة واحدة",
  "whatWorked": ["نقاط أثارت اهتمامه في هذه المحادثة"],
  "interestedUniversities": ["جامعات ذكرها أو سأل عنها"],
  "interestedSpecializations": ["تخصصات اهتم بها"]
}
اترك الحقل فارغاً إذا لم تجد معلومة واضحة. لا تخترع معلومات.`;

    const { data } = await callOpenAI(apiKey, "gpt-4o-mini", CLASSIFY_FALLBACK_MODELS, {
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
      temperature: 0.1,
    });

    const text = (data.choices as any[])?.[0]?.message?.content?.trim() || "{}";
    const extracted: Partial<UserMemoryFacts> = JSON.parse(text);

    // ── دمج مع الحقائق الموجودة (لا نحذف شيئاً، نضيف ونحدّث) ──
    const merged: UserMemoryFacts = { ...currentFacts };
    for (const [k, v] of Object.entries(extracted)) {
      if (v === null || v === undefined || v === "") continue;
      if (Array.isArray(v) && v.length === 0) continue;
      const key = k as keyof UserMemoryFacts;
      if (Array.isArray(v) && Array.isArray(merged[key])) {
        const existing = merged[key] as string[];
        const merged2 = [...new Set([...existing, ...v])];
        (merged as Record<string, unknown>)[key] = merged2;
      } else {
        (merged as Record<string, unknown>)[key] = v;
      }
    }

    const [existing] = await db
      .select({ id: userMemoryTable.id })
      .from(userMemoryTable)
      .where(eq(userMemoryTable.userId, userId))
      .limit(1);

    if (existing) {
      await db
        .update(userMemoryTable)
        .set({ facts: merged })
        .where(eq(userMemoryTable.userId, userId));
    } else {
      await db.insert(userMemoryTable).values({ userId, facts: merged });
    }
  } catch {
    // الذاكرة ليست حرجة — تجاهل الأخطاء
  }
}

// ── نقطة إرسال الرسالة الرئيسية ──────────────────────────────────────────────
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

  await db.insert(chatMessagesTable).values({ sessionId, role: "user", content: content.trim() });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const errMsg = "مفتاح OpenAI API غير مضبوط. يرجى إضافته من لوحة التحكم.";
    await db.insert(chatMessagesTable).values({ sessionId, role: "assistant", content: errMsg });
    res.json({ content: errMsg });
    return;
  }

  // ── تحميل الإعدادات + ملف الطالب + الذاكرة بالتوازي ──
  const [settingsRes, userRes, memoryRes, applicationsRes] = await Promise.all([
    db.select().from(aiSettingsTable).limit(1),
    db.select({
      name: usersTable.name,
      country: usersTable.country,
      status: usersTable.status,
    }).from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1),
    db.select().from(userMemoryTable).where(eq(userMemoryTable.userId, req.user!.id)).limit(1),
    db.select({ id: applicationsTable.id }).from(applicationsTable).where(eq(applicationsTable.studentId, req.user!.id)).limit(1),
  ]);

  const aiSettings = settingsRes[0] ?? {
    model: "gpt-4o",
    systemPrompt: "أنت مساعد Baansy الذكي للتسجيل الجامعي. ردودك قصيرة وبشرية وواضحة.",
    temperature: 0.7,
    maxTokens: 800,
    typingSpeedMs: 20,
  };

  const userProfile = userRes[0] ?? {};
  const memoryFacts: UserMemoryFacts = (memoryRes[0]?.facts as UserMemoryFacts) ?? {};
  const studentProfile = {
    name: userProfile.name ?? undefined,
    country: userProfile.country ?? undefined,
    status: userProfile.status ?? undefined,
    hasApplication: applicationsRes.length > 0,
  };

  // ── الذاكرة القصيرة: آخر 20 رسالة من الجلسة الحالية ──
  const allMessages = await db
    .select()
    .from(chatMessagesTable)
    .where(eq(chatMessagesTable.sessionId, sessionId))
    .orderBy(desc(chatMessagesTable.createdAt))
    .limit(SHORT_TERM_WINDOW);
  const prevMessages = allMessages.reverse();

  // ── بناء الرسائل للـ API ──
  const systemPrompt = buildSystemPrompt(aiSettings.systemPrompt, memoryFacts, studentProfile);
  const apiMessages = [
    { role: "system" as const, content: systemPrompt },
    ...prevMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
  ];

  // ── محاولة الستريمينج مع الفولباك قبل إرسال هيدرات SSE ──
  let streamResponse: Response;
  let modelUsed: string;
  try {
    const result = await callOpenAIStream(apiKey, aiSettings.model, CHAT_FALLBACK_MODELS, {
      messages: apiMessages,
      temperature: aiSettings.temperature,
      max_tokens: aiSettings.maxTokens ?? 800,
    });
    streamResponse = result.response;
    modelUsed = result.modelUsed;
  } catch (err: unknown) {
    req.log.error({ err }, "OpenAI all models failed");
    const isRateLimit = err instanceof Error && err.message === "rate_limit";
    const errMsg = isRateLimit
      ? "خدمة الذكاء الاصطناعي مشغولة حالياً. يرجى المحاولة بعد لحظات."
      : "خطأ في الاتصال بالذكاء الاصطناعي. يرجى المحاولة مرة أخرى.";
    await db.insert(chatMessagesTable).values({ sessionId, role: "assistant", content: errMsg });
    res.json({ content: errMsg });
    return;
  }

  // ── إرسال هيدرات SSE بعد التأكد من نجاح النموذج ──
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  if (modelUsed !== aiSettings.model) {
    res.write(`data: ${JSON.stringify({ _modelFallback: modelUsed })}\n\n`);
  }

  try {
    let fullContent = "";
    const reader = streamResponse.body!.getReader();
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
          // skip malformed chunks
        }
      }
    }

    if (fullContent) {
      await db.insert(chatMessagesTable).values({ sessionId, role: "assistant", content: fullContent });

      if (!session.title && prevMessages.length <= 2) {
        await db
          .update(chatSessionsTable)
          .set({ title: content.trim().slice(0, 50) })
          .where(eq(chatSessionsTable.id, sessionId));
      }

      // ── تحديث الذاكرة بعيدة المدى في الخلفية (لا يوقف الستريمينج) ──
      const recentForMemory = [
        ...prevMessages.slice(-4).map((m) => ({ role: m.role, content: m.content })),
        { role: "assistant", content: fullContent },
      ];
      extractAndUpdateMemory(apiKey, req.user!.id, recentForMemory, memoryFacts).catch(() => {});
    }

    res.end();
  } catch (err) {
    req.log.error({ err }, "Streaming error");
    res.write(`data: ${JSON.stringify({ content: "حدث خطأ. حاول مرة أخرى.", done: true })}\n\n`);
    res.end();
  }
});

export default router;
