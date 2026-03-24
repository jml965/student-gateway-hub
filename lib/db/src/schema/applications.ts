import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { specializationsTable } from "./specializations";

export const applicationStatusEnum = pgEnum("application_status", [
  "draft",
  "submitted",
  "documents_pending",
  "under_review",
  "sent_to_university",
  "preliminary_accepted",
  "payment_pending",
  "accepted",
  "rejected",
  "withdrawn",
]);

export const applicationsTable = pgTable("applications", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  specializationId: integer("specialization_id").notNull().references(() => specializationsTable.id),
  status: applicationStatusEnum("status").notNull().default("draft"),
  notes: text("notes"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertApplicationSchema = createInsertSchema(applicationsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertApplication = z.infer<typeof insertApplicationSchema>;
export type Application = typeof applicationsTable.$inferSelect;
