import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { applicationsTable } from "./applications";

export const documentsTable = pgTable("documents", {
  id: serial("id").primaryKey(),
  applicationId: integer("application_id").notNull().references(() => applicationsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  fileUrl: text("file_url").notNull(),
  verified: boolean("verified").notNull().default(false),
  uploadedAt: timestamp("uploaded_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Document = typeof documentsTable.$inferSelect;
