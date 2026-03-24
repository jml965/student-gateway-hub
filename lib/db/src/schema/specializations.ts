import { pgTable, text, serial, timestamp, integer, numeric, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { universitiesTable } from "./universities";

export const degreeEnum = pgEnum("degree", ["bachelor", "master", "phd", "diploma"]);
export const specializationStatusEnum = pgEnum("specialization_status", ["active", "inactive"]);

export const specializationsTable = pgTable("specializations", {
  id: serial("id").primaryKey(),
  universityId: integer("university_id").notNull().references(() => universitiesTable.id, { onDelete: "cascade" }),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  degree: degreeEnum("degree").notNull().default("bachelor"),
  durationYears: integer("duration_years").notNull().default(4),
  tuitionFee: numeric("tuition_fee", { precision: 12, scale: 2 }),
  currency: text("currency").notNull().default("USD"),
  status: specializationStatusEnum("status").notNull().default("active"),
  requirementsJson: jsonb("requirements_json"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertSpecializationSchema = createInsertSchema(specializationsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertSpecialization = z.infer<typeof insertSpecializationSchema>;
export type Specialization = typeof specializationsTable.$inferSelect;
