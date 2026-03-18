import { Router } from "express";
import { db, ordersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, adminMiddleware, customerMiddleware } from "../lib/auth.js";

const router = Router();

function formatOrder(o: typeof ordersTable.$inferSelect) {
  return {
    ...o,
    price: parseFloat(o.price as unknown as string),
  };
}

router.post("/order-food", authMiddleware, customerMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { itemName, price } = req.body;
    if (!itemName || price === undefined) {
      res.status(400).json({ error: "itemName and price are required" });
      return;
    }
    const [order] = await db.insert(ordersTable).values({
      userId,
      itemName,
      price: price.toString(),
      status: "pending",
    }).returning();
    res.status(201).json(formatOrder(order));
  } catch (err) {
    console.error("OrderFood error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/orders", authMiddleware, async (req, res) => {
  try {
    const user = (req as any).user;
    let orders;
    if (user.role === "admin") {
      orders = await db.select().from(ordersTable).orderBy(ordersTable.createdAt);
    } else {
      orders = await db.select().from(ordersTable).where(eq(ordersTable.userId, user.userId)).orderBy(ordersTable.createdAt);
    }
    res.json(orders.map(formatOrder));
  } catch (err) {
    console.error("GetOrders error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put("/orders/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    if (!["pending", "delivered"].includes(status)) {
      res.status(400).json({ error: "Invalid status" });
      return;
    }
    const [order] = await db
      .update(ordersTable)
      .set({ status })
      .where(eq(ordersTable.id, id))
      .returning();
    if (!order) {
      res.status(404).json({ error: "Order not found" });
      return;
    }
    res.json(formatOrder(order));
  } catch (err) {
    console.error("UpdateOrder error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
