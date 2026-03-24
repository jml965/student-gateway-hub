import { Request, Response, NextFunction } from "express";
import { verifyToken } from "./auth";
import { sessionStore } from "./session-store";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

export interface AuthRequest extends Request {
  user?: { id: number; role: string; email: string; name: string };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized", message: "Authentication required" });
    return;
  }

  const rawToken = authHeader.slice(7);
  const payload = verifyToken(rawToken);
  if (!payload) {
    res.status(401).json({ error: "unauthorized", message: "Invalid or expired token" });
    return;
  }

  // Verify session is active via Redis-backed session store (falls back to PostgreSQL)
  const sessionUserId = await sessionStore.verify(rawToken);
  if (!sessionUserId || sessionUserId !== payload.userId) {
    res.status(401).json({ error: "unauthorized", message: "Session expired or invalidated" });
    return;
  }

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, payload.userId))
    .limit(1);

  if (!user || user.status !== "active") {
    res.status(401).json({ error: "unauthorized", message: "User not found or suspended" });
    return;
  }

  req.user = { id: user.id, role: user.role, email: user.email, name: user.name };
  next();
}

export function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "forbidden", message: "Admin access required" });
    return;
  }
  next();
}
