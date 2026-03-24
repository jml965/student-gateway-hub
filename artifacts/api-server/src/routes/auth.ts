import { Router } from "express";
import { db, usersTable, passwordResetsTable, referralsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import { hashPassword, comparePassword, signToken, generateResetToken } from "../lib/auth";
import { sessionStore } from "../lib/session-store";
import { requireAuth, type AuthRequest } from "../lib/middleware";
import { sendPasswordResetEmail } from "../lib/email";

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

  const [existing] = await db
    .select({ id: usersTable.id })
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "email_taken", message: "This email is already registered" });
    return;
  }

  const passwordHash = await hashPassword(password);
  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email: email.toLowerCase(),
      passwordHash,
      phone: phone || null,
      country: country || null,
      role: "student",
      status: "active",
    })
    .returning();

  // Link referral if code provided
  if (referralCode) {
    const [referrer] = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.referralCode, referralCode.trim().toUpperCase()))
      .limit(1);

    if (referrer && referrer.id !== user.id) {
      await db.insert(referralsTable).values({
        referrerId: referrer.id,
        referredStudentId: user.id,
        code: referralCode.trim().toUpperCase(),
        commissionRate: "10",
      });
    }
  }

  const { token, expiresAt } = signToken({ userId: user.id, role: user.role });
  await sessionStore.store(user.id, token, expiresAt);

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

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email.toLowerCase()))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "invalid_credentials", message: "Invalid email or password" });
    return;
  }

  const valid = await comparePassword(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "invalid_credentials", message: "Invalid email or password" });
    return;
  }

  if (user.status === "suspended") {
    res.status(401).json({ error: "account_suspended", message: "Your account has been suspended" });
    return;
  }
  // University users can log in even while pending (to check status in portal)

  const { token, expiresAt } = signToken({ userId: user.id, role: user.role });
  await sessionStore.store(user.id, token, expiresAt);

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
      universityId: user.universityId,
      createdAt: user.createdAt,
    },
  });
});

router.post("/logout", requireAuth, async (req: AuthRequest, res) => {
  const rawToken = req.headers.authorization?.slice(7) ?? "";
  if (rawToken) {
    await sessionStore.invalidate(rawToken, req.user!.id);
  }
  res.json({ success: true, message: "Logged out successfully" });
});

router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id))
    .limit(1);

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
    universityId: user.universityId,
    createdAt: user.createdAt,
  });
});

router.post("/forgot-password", async (req, res) => {
  // Respond immediately to prevent email enumeration timing attacks
  res.json({ success: true, message: "If that email exists, a reset link has been sent" });

  const email = req.body?.email;
  if (!email?.trim()) return;

  const [user] = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(eq(usersTable.email, String(email).toLowerCase()))
    .limit(1);

  if (!user) return;

  const token = generateResetToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await db.insert(passwordResetsTable).values({ userId: user.id, token, expiresAt });

  // Build frontend URL with correct precedence: FRONTEND_URL takes priority
  const frontendUrl =
    process.env.FRONTEND_URL ??
    (process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : "http://localhost:3000");

  const resetUrl = `${frontendUrl}/reset-password?token=${token}`;

  await sendPasswordResetEmail(user.email, resetUrl).catch((err: Error) => {
    req.log.error({ err: err.message, userId: user.id }, "Failed to send password reset email");
  });
});

router.post("/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password || password.length < 8) {
    res.status(400).json({ error: "invalid_request", message: "Valid token and password (min 8 chars) required" });
    return;
  }

  const [reset] = await db
    .select()
    .from(passwordResetsTable)
    .where(
      and(
        eq(passwordResetsTable.token, token),
        eq(passwordResetsTable.used, false),
        gt(passwordResetsTable.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (!reset) {
    res.status(400).json({ error: "invalid_token", message: "Reset token is invalid or has expired" });
    return;
  }

  const passwordHash = await hashPassword(password);

  await Promise.all([
    db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, reset.userId)),
    db.update(passwordResetsTable).set({ used: true }).where(eq(passwordResetsTable.id, reset.id)),
    // Invalidate all active sessions for this user across Redis + DB
    sessionStore.invalidateAll(reset.userId),
  ]);

  res.json({ success: true, message: "Password reset successfully" });
});

export default router;
