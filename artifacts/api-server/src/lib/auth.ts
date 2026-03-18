import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";

const JWT_SECRET = process.env.SESSION_SECRET || "raj-hotel-secret-2024";

export interface JwtPayload {
  userId: number;
  role: string;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const token = authHeader.slice(7);
  try {
    const payload = verifyToken(token);
    (req as any).user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid token" });
  }
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Admin access required" });
    return;
  }
  next();
}

export function customerMiddleware(req: Request, res: Response, next: NextFunction): void {
  const user = (req as any).user as JwtPayload | undefined;
  if (!user || user.role !== "customer") {
    res.status(403).json({ error: "This action is only available to customers" });
    return;
  }
  next();
}
