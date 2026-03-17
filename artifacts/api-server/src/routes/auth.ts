import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authMiddleware, signToken } from "../lib/auth.js";

const router = Router();

router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "Name, email, and password are required" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }
    const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: "Email already registered" });
      return;
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [user] = await db.insert(usersTable).values({
      name,
      email,
      password: hashedPassword,
      role: "customer",
    }).returning();
    const token = signToken({ userId: user.id, role: user.role });
    res.status(201).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
    if (!user) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }
    const token = signToken({ userId: user.id, role: user.role });
    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
