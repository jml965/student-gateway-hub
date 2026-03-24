import { pgTable, text, serial, timestamp, pgEnum, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const universityStatusEnum = pgEnum("university_status", ["active", "inactive", "pending", "rejected"]);
export const paymentModeEnum = pgEnum("payment_mode", ["direct", "platform"]);

export const universitiesTable = pgTable("universities", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  logoUrl: text("logo_url"),
  website: text("website"),
  descriptionAr: text("description_ar"),
  descriptionEn: text("description_en"),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  paymentMode: paymentModeEnum("payment_mode").notNull().default("platform"),
  bankIban: text("bank_iban"),
  bankName: text("bank_name"),
  bankBeneficiary: text("bank_beneficiary"),
  bankBranch: text("bank_branch"),
  bankInstructionsAr: text("bank_instructions_ar"),
  bankInstructionsEn: text("bank_instructions_en"),
  status: universityStatusEnum("status").notNull().default("active"),
  approvedBy: integer("approved_by"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUniversitySchema = createInsertSchema(universitiesTable).omit({
  id: true,
  createdAt: true,
  approvedAt: true,
  approvedBy: true,
});
export type InsertUniversity = z.infer<typeof insertUniversitySchema>;
export type University = typeof universitiesTable.$inferSelect;
