import { pgTable, serial, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export interface UserMemoryFacts {
  // ── معلومات أساسية ──────────────────────────────────
  name?: string;
  country?: string;
  targetCountries?: string[];
  interests?: string[];
  degree?: string;
  budget?: string;
  language?: string;

  // ── تحليل الشخصية ───────────────────────────────────
  personalityType?: "analytical" | "emotional" | "social" | "pragmatic";
  // analytical  = يحتاج أرقام وإحصاءات وحقائق
  // emotional   = يتأثر بالقصص والتجارب الشخصية
  // social      = يتأثر بآراء الآخرين والسمعة
  // pragmatic   = يركز على الفائدة العملية والمستقبل الوظيفي
  decisionStyle?: string;
  communicationStyle?: "formal" | "casual" | "detailed" | "brief";
  responseToSales?: "receptive" | "skeptical" | "neutral";

  // ── الدوافع والمخاوف ─────────────────────────────────
  motivations?: string[];        // ما الذي يدفعه للدراسة
  concerns?: string[];           // مخاوفه وتردده
  keyMotivator?: string;         // أقوى دافع لديه
  mainObjection?: string;        // أكبر عائق أمامه
  dreamOutcome?: string;         // ما يحلم به بعد التخرج

  // ── مسار التحويل ─────────────────────────────────────
  stage?: "cold" | "exploring" | "interested" | "comparing" | "decided" | "applied" | "enrolled";
  interestedUniversities?: string[];
  interestedSpecializations?: string[];
  lastTopic?: string;

  // ── استراتيجية الإقناع ───────────────────────────────
  persuasionApproach?: string;   // كيف يُقنَع بالتسجيل
  whatWorked?: string[];         // نقاط أثارت اهتمامه
  whatDidntWork?: string[];      // نقاط لم تنفع معه
  bestTimeToClose?: string;      // متى يكون مستعداً للتسجيل

  notes?: string;
}

export const userMemoryTable = pgTable("user_memory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique().references(() => usersTable.id, { onDelete: "cascade" }),
  facts: jsonb("facts").notNull().$type<UserMemoryFacts>().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export type UserMemory = typeof userMemoryTable.$inferSelect;
