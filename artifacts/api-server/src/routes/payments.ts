import { Router } from "express";
import { db, paymentsTable, bookingsTable, usersTable, roomsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../lib/auth.js";

const router = Router();

function formatRoom(r: typeof roomsTable.$inferSelect) {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    price: parseFloat(r.price as unknown as string),
    imageUrl: r.imageUrl,
    isAvailable: r.isAvailable,
    createdAt: r.createdAt,
  };
}

router.post("/payment", authMiddleware, async (req, res) => {
  try {
    const { bookingId, amount, screenshotUrl } = req.body;
    if (!bookingId || amount === undefined) {
      res.status(400).json({ error: "bookingId and amount are required" });
      return;
    }
    const [payment] = await db.insert(paymentsTable).values({
      bookingId,
      amount: amount.toString(),
      screenshotUrl: screenshotUrl || null,
      status: "pending",
    }).returning();
    res.status(201).json({
      ...payment,
      amount: parseFloat(payment.amount as unknown as string),
    });
  } catch (err) {
    console.error("Payment error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/payments", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    const rows = await db
      .select()
      .from(paymentsTable)
      .leftJoin(bookingsTable, eq(paymentsTable.bookingId, bookingsTable.id))
      .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
      .leftJoin(roomsTable, eq(bookingsTable.roomId, roomsTable.id))
      .orderBy(paymentsTable.createdAt);

    const filtered = user.role === "admin"
      ? rows
      : rows.filter((r) => r.users?.id === user.userId);

    const result = filtered.map((r) => ({
      ...r.payments,
      amount: parseFloat(r.payments.amount as unknown as string),
      booking: r.bookings
        ? {
            ...r.bookings,
            user: r.users
              ? { id: r.users.id, name: r.users.name, email: r.users.email, role: r.users.role, createdAt: r.users.createdAt }
              : null,
            room: r.rooms ? formatRoom(r.rooms) : null,
          }
        : null,
    }));
    res.json(result);
  } catch (err) {
    console.error("GetPayments error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/payments/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!["pending", "approved", "rejected"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const [payment] = await db
      .update(paymentsTable)
      .set({ status })
      .where(eq(paymentsTable.id, id))
      .returning();
    if (!payment) {
      res.status(404).json({ error: "Payment not found" });
      return;
    }
    res.json({
      ...payment,
      amount: parseFloat(payment.amount as unknown as string),
    });
  } catch (err) {
    console.error("UpdatePayment error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
