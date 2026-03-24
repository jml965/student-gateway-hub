import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

export const chatSessionsTable = pgTable("chat_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const chatMessagesTable = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id").notNull().references(() => chatSessionsTable.id, { onDelete: "cascade" }),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ChatSession = typeof chatSessionsTable.$inferSelect;
export type ChatMessage = typeof chatMessagesTable.$inferSelect;
