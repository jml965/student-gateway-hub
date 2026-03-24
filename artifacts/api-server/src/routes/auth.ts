import { Router } from "express";
import { db, usersTable, passwordResetsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword, comparePassword, signToken, generateResetToken } from "../lib/auth";
import { requireAuth, type AuthRequest } from "../lib/middleware";

const router = Router();

router.post("/register", async (req, res) => {
  const { name, email, password, phone, country, referralCode } = req.body;

  if (!name || !email || !password) {
    res.status(422).json({ error: "validation_error", message: "Name, email and password are required" });
    return;
  }

  if (password.length < 8) {
    res.status(422).json({ error: "validation_error", message: "Password must be at least 8 characters" });
    return;
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (existing) {
    res.status(409).json({ error: "email_taken", message: "This email is already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db.insert(usersTable).values({
    name,
    email: email.toLowerCase(),
    passwordHash,
    phone: phone || null,
    country: country || null,
    role: "student",
    status: "active",
  }).returning();

  const token = signToken({ userId: user.id, role: user.role });

  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      country: user.country,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    },
  });
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(422).json({ error: "validation_error", message: "Email and password are required" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);
  if (!user) {
    res.status(401).json({ error: "invalid_credentials", message: "Invalid email or password" });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "invalid_credentials", message: "Invalid email or password" });
    return;
  }

  if (user.status !== "active") {
    res.status(401).json({ error: "account_suspended", message: "Your account has been suspended" });
    return;
  }

  const token = signToken({ userId: user.id, role: user.role });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      country: user.country,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
    },
  });
});

router.post("/logout", requireAuth, (_req, res) => {
  res.json({ success: true, message: "Logged out successfully" });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);
  if (!user) {
    res.status(401).json({ error: "unauthorized", message: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    country: user.country,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
  });
});

router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.json({ success: true, message: "If that email exists, a reset link has been sent" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email.toLowerCase())).limit(1);

  if (user) {
    const token = generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await db.insert(passwordResetsTable).values({ userId: user.id, token, expiresAt });
    req.log.info({ email, token }, "Password reset token generated");
  }

  res.json({ success: true, message: "If that email exists, a reset link has been sent" });
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password || password.length < 8) {
    res.status(400).json({ error: "invalid_request", message: "Valid token and password (min 8 chars) required" });
    return;
  }

  const [reset] = await db.select().from(passwordResetsTable)
    .where(and(
      eq(passwordResetsTable.token, token),
      eq(passwordResetsTable.used, false),
      gt(passwordResetsTable.expiresAt, new Date()),
    )).limit(1);

  if (!reset) {
    res.status(400).json({ error: "invalid_token", message: "Reset token is invalid or has expired" });
    return;
  }

  const passwordHash = await hashPassword(password);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, reset.userId));
  await db.update(passwordResetsTable).set({ used: true }).where(eq(passwordResetsTable.id, reset.id));

  res.json({ success: true, message: "Password reset successfully" });
});

export default router;
