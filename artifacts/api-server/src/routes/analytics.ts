import { Router } from "express";
import { db, bookingsTable, paymentsTable, roomsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../lib/auth.js";

const router = Router();

router.get("/analytics", authMiddleware, adminMiddleware, async (_req, res) => {
  try {
    const [totalBookingsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(bookingsTable);
    const totalBookings = Number(totalBookingsResult.count);

    const [totalRevenueResult] = await db
      .select({ sum: sql<string>`coalesce(sum(amount), 0)` })
      .from(paymentsTable)
      .where(eq(paymentsTable.status, "approved"));
    const totalRevenue = parseFloat(totalRevenueResult.sum || "0");

    const [activeRoomsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(roomsTable)
      .where(eq(roomsTable.isAvailable, true));
    const activeRooms = Number(activeRoomsResult.count);

    const [pendingPaymentsResult] = await db
      .select({ count: sql<number>`count(*)` })
      .from(paymentsTable)
      .where(eq(paymentsTable.status, "pending"));
    const pendingPayments = Number(pendingPaymentsResult.count);

    const monthlyRevenueRows = await db
      .select({
        month: sql<string>`to_char(created_at, 'Mon')`,
        revenue: sql<string>`coalesce(sum(amount), 0)`,
      })
      .from(paymentsTable)
      .where(eq(paymentsTable.status, "approved"))
      .groupBy(sql`to_char(created_at, 'Mon'), date_trunc('month', created_at)`)
      .orderBy(sql`date_trunc('month', created_at)`);

    const bookingTrendRows = await db
      .select({
        month: sql<string>`to_char(created_at, 'Mon')`,
        count: sql<number>`count(*)`,
      })
      .from(bookingsTable)
      .groupBy(sql`to_char(created_at, 'Mon'), date_trunc('month', created_at)`)
      .orderBy(sql`date_trunc('month', created_at)`);

    res.json({
      totalBookings,
      totalRevenue,
      activeRooms,
      pendingPayments,
      monthlyRevenue: monthlyRevenueRows.map((r) => ({
        month: r.month,
        revenue: parseFloat(r.revenue),
      })),
      bookingTrends: bookingTrendRows.map((r) => ({
        month: r.month,
        count: Number(r.count),
      })),
    });
  } catch (err) {
    console.error("Analytics error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
