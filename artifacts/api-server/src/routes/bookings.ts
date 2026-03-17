import { Router } from "express";
import { db, bookingsTable, usersTable, roomsTable } from "@workspace/db";
import { eq, and, or, lte, gte } from "drizzle-orm";
import { authMiddleware, adminMiddleware } from "../lib/auth.js";

const router = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return { id: u.id, name: u.name, email: u.email, role: u.role, createdAt: u.createdAt };
}

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

router.post("/book-room", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { roomId, checkIn, checkOut } = req.body;
    if (!roomId || !checkIn || !checkOut) {
      res.status(400).json({ error: "roomId, checkIn, and checkOut are required" });
      return;
    }
    if (new Date(checkIn) >= new Date(checkOut)) {
      res.status(400).json({ error: "Check-out must be after check-in" });
      return;
    }
    const overlapping = await db
      .select()
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.roomId, roomId),
          or(
            eq(bookingsTable.status, "pending"),
            eq(bookingsTable.status, "confirmed")
          ),
          lte(bookingsTable.checkIn, checkOut),
          gte(bookingsTable.checkOut, checkIn)
        )
      );
    if (overlapping.length > 0) {
      res.status(409).json({ error: "Room is already booked for these dates" });
      return;
    }
    const [booking] = await db.insert(bookingsTable).values({
      userId,
      roomId,
      checkIn,
      checkOut,
      status: "pending",
    }).returning();
    res.status(201).json(booking);
  } catch (err) {
    console.error("BookRoom error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/bookings", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    let rows;
    if (user.role === "admin") {
      rows = await db
        .select()
        .from(bookingsTable)
        .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
        .leftJoin(roomsTable, eq(bookingsTable.roomId, roomsTable.id))
        .orderBy(bookingsTable.createdAt);
    } else {
      rows = await db
        .select()
        .from(bookingsTable)
        .leftJoin(usersTable, eq(bookingsTable.userId, usersTable.id))
        .leftJoin(roomsTable, eq(bookingsTable.roomId, roomsTable.id))
        .where(eq(bookingsTable.userId, user.userId))
        .orderBy(bookingsTable.createdAt);
    }
    const result = rows.map((r) => ({
      ...r.bookings,
      user: r.users ? formatUser(r.users) : null,
      room: r.rooms ? formatRoom(r.rooms) : null,
    }));
    res.json(result);
  } catch (err) {
    console.error("GetBookings error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/bookings/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!["pending", "confirmed", "rejected"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const [booking] = await db
      .update(bookingsTable)
      .set({ status })
      .where(eq(bookingsTable.id, id))
      .returning();
    if (!booking) {
      res.status(404).json({ error: "Booking not found" });
      return;
    }
    res.json(booking);
  } catch (err) {
    console.error("UpdateBooking error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
