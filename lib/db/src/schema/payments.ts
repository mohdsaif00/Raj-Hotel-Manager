import { pgTable, serial, integer, numeric, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { bookingsTable } from "./bookings";

export const paymentStatusEnum = pgEnum("payment_status", ["pending", "approved", "rejected"]);

export const paymentsTable = pgTable("payments", {
  id: serial("id").primaryKey(),
  bookingId: integer("booking_id").notNull().references(() => bookingsTable.id),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  screenshotUrl: text("screenshot_url"),
  status: paymentStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertPaymentSchema = createInsertSchema(paymentsTable).omit({
  id: true,
  createdAt: true,
  status: true,
});

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof paymentsTable.$inferSelect;
