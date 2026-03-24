import { pgTable, text, serial, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const referralStatusEnum = pgEnum("referral_status", ["pending", "completed", "paid"]);

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  refereeId: integer("referee_id").references(() => usersTable.id, { onDelete: "set null" }),
  code: text("code").notNull().unique(),
  status: referralStatusEnum("status").notNull().default("pending"),
  reward: numeric("reward", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Referral = typeof referralsTable.$inferSelect;
