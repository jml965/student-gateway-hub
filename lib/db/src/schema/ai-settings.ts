import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";

export const aiSettingsTable = pgTable("ai_settings", {
  id: serial("id").primaryKey(),
  model: text("model").notNull().default("gpt-4.1"),
  systemPrompt: text("system_prompt").notNull().default(
    "أنت مساعد Baansy الذكي. تساعد الطلاب في التسجيل الجامعي واختيار التخصص والجامعة المناسبة. ردودك قصيرة وواضحة وبشرية. لا تكرر السؤال ولا تطيل الإجابة. تجاوب بلغة المستخدم مباشرة."
  ),
  temperature: real("temperature").notNull().default(0.7),
  maxTokens: integer("max_tokens").notNull().default(500),
  typingSpeedMs: integer("typing_speed_ms").notNull().default(20),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type AiSettings = typeof aiSettingsTable.$inferSelect;
