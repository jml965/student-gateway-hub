import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("JWT_SECRET environment variable is required in production");
    }
    return "baansy-dev-secret-do-not-use-in-production";
  }
  return secret;
}

const JWT_EXPIRES_IN = "30d";
const JWT_EXPIRES_MS = 30 * 24 * 60 * 60 * 1000;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: number; role: string }): { token: string; expiresAt: Date } {
  const secret = getJwtSecret();
  const token = jwt.sign(payload, secret, { expiresIn: JWT_EXPIRES_IN });
  const expiresAt = new Date(Date.now() + JWT_EXPIRES_MS);
  return { token, expiresAt };
}

export function verifyToken(token: string): { userId: number; role: string } | null {
  try {
    const secret = getJwtSecret();
    return jwt.verify(token, secret) as { userId: number; role: string };
  } catch {
    return null;
  }
}

export function generateResetToken(): string {
  return randomBytes(48).toString("hex");
}
