import { pgTable, text, serial, timestamp, integer, pgEnum, jsonb } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const serviceStatusEnum = pgEnum("service_status", ["requested", "processing", "completed", "cancelled"]);

export const servicesTable = pgTable("services", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider"),
  detailsJson: jsonb("details_json"),
  status: serviceStatusEnum("service_status").notNull().default("requested"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Service = typeof servicesTable.$inferSelect;
