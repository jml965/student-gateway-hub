import { pgTable, text, serial, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";
import { applicationsTable } from "./applications";

export const documentTypeEnum = pgEnum("document_type", [
  "passport",
  "degree",
  "transcript",
  "language_cert",
  "photo",
  "bank_statement",
  "other",
]);

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  applicationId: integer("application_id").references(() => applicationsTable.id, { onDelete: "set null" }),
  type: documentTypeEnum("type").notNull().default("other"),
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSizeBytes: integer("file_size_bytes"),
  mimeType: text("mime_type"),
  verified: boolean("verified").notNull().default(false),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Document = typeof documentsTable.$inferSelect;
export type InsertDocument = typeof documentsTable.$inferInsert;
