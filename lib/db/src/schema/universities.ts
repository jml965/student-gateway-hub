import { pgTable, text, serial, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const universityStatusEnum = pgEnum("university_status", ["active", "inactive"]);
export const paymentModeEnum = pgEnum("payment_mode", ["direct", "platform"]);

export const universitiesTable = pgTable("universities", {
  id: serial("id").primaryKey(),
  nameAr: text("name_ar").notNull(),
  nameEn: text("name_en").notNull(),
  country: text("country").notNull(),
  city: text("city").notNull(),
  logoUrl: text("logo_url"),
  website: text("website"),
  paymentMode: paymentModeEnum("payment_mode").notNull().default("platform"),
  status: universityStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUniversitySchema = createInsertSchema(universitiesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUniversity = z.infer<typeof insertUniversitySchema>;
export type University = typeof universitiesTable.$inferSelect;
