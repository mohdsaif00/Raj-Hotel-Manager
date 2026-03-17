import { Router } from "express";
import { db, roomsTable } from "@workspace/db";
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

router.get("/", async (_req, res) => {
  try {
    const rooms = await db.select().from(roomsTable).orderBy(roomsTable.createdAt);
    res.json(rooms.map(formatRoom));
  } catch (err) {
    console.error("GetRooms error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, id)).limit(1);
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }
    res.json(formatRoom(room));
  } catch (err) {
    console.error("GetRoom error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, description, price, imageUrl, isAvailable } = req.body;
    if (!title || !description || price === undefined) {
      res.status(400).json({ error: "Title, description, and price are required" });
      return;
    }
    const [room] = await db.insert(roomsTable).values({
      title,
      description,
      price: price.toString(),
      imageUrl: imageUrl || null,
      isAvailable: isAvailable !== undefined ? isAvailable : true,
    }).returning();
    res.status(201).json(formatRoom(room));
  } catch (err) {
    console.error("CreateRoom error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { title, description, price, imageUrl, isAvailable } = req.body;
    const updateData: Partial<typeof roomsTable.$inferInsert> = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = price.toString() as any;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
    if (isAvailable !== undefined) updateData.isAvailable = isAvailable;
    const [room] = await db.update(roomsTable).set(updateData).where(eq(roomsTable.id, id)).returning();
    if (!room) {
      res.status(404).json({ error: "Room not found" });
      return;
    }
    res.json(formatRoom(room));
  } catch (err) {
    console.error("UpdateRoom error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(roomsTable).where(eq(roomsTable.id, id));
    res.json({ message: "Room deleted" });
  } catch (err) {
    console.error("DeleteRoom error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
