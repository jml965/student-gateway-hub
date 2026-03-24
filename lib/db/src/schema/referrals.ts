import { pgTable, text, serial, timestamp, integer, numeric, pgEnum } from "drizzle-orm/pg-core";
import { usersTable } from "./users";

export const referralCommissionStatusEnum = pgEnum("referral_commission_status", [
  "unpaid",
  "partial",
  "paid",
]);

export const referralsTable = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  referredStudentId: integer("referred_student_id").references(() => usersTable.id, { onDelete: "set null" }),
  code: text("code").notNull(),
  commissionRate: numeric("commission_rate", { precision: 5, scale: 2 }).notNull().default("10"),
  commissionAmount: numeric("commission_amount", { precision: 12, scale: 2 }),
  paymentStatus: referralCommissionStatusEnum("payment_status").notNull().default("unpaid"),
  paidAmount: numeric("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const referralPaymentsTable = pgTable("referral_payments", {
  id: serial("id").primaryKey(),
  referralId: integer("referral_id").notNull().references(() => referralsTable.id, { onDelete: "cascade" }),
  referrerId: integer("referrer_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  paymentMethod: text("payment_method").notNull().default("bank"),
  notes: text("notes"),
  recordedBy: integer("recorded_by").references(() => usersTable.id),
  paidAt: timestamp("paid_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Referral = typeof referralsTable.$inferSelect;
export type ReferralPayment = typeof referralPaymentsTable.$inferSelect;
