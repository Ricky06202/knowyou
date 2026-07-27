import { Hono } from "hono";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { users, sessions, userProfiles } from "../db/schema";
import { db } from "../db";
import { hashPassword, verifyPassword } from "../utils/bcrypt";
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt";
import { authMiddleware } from "../middleware/auth";

const auth = new Hono();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1).max(255),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

auth.post("/register", async (c) => {
  const body = await c.req.json();
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const { email, password, name } = parsed.data;

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    return c.json({ error: "Email already registered" }, 409);
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(users)
    .values({ email, passwordHash, name })
    .returning({ id: users.id, email: users.email });

  await db.insert(userProfiles).values({ userId: user.id });

  const accessToken = await generateAccessToken(user.id, user.email);
  const refreshToken = await generateRefreshToken(user.id, user.email);

  await db.insert(sessions).values({
    userId: user.id,
    refreshToken,
    userAgent: c.req.header("User-Agent") || null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return c.json({
    user: { id: user.id, email: user.email, name },
    tokens: { accessToken, refreshToken },
  }, 201);
});

auth.post("/login", async (c) => {
  const body = await c.req.json();
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: "Invalid input", details: parsed.error.flatten() }, 400);
  }

  const { email, password } = parsed.data;

  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (!user) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    return c.json({ error: "Invalid email or password" }, 401);
  }

  const accessToken = await generateAccessToken(user.id, user.email);
  const refreshToken = await generateRefreshToken(user.id, user.email);

  await db.insert(sessions).values({
    userId: user.id,
    refreshToken,
    userAgent: c.req.header("User-Agent") || null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  return c.json({
    user: { id: user.id, email: user.email, name: user.name },
    tokens: { accessToken, refreshToken },
  });
});

auth.post("/refresh", async (c) => {
  const { refreshToken } = await c.req.json();

  if (!refreshToken) {
    return c.json({ error: "Refresh token required" }, 400);
  }

  try {
    const payload = await verifyRefreshToken(refreshToken);

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.refreshToken, refreshToken))
      .limit(1);

    if (!session) {
      return c.json({ error: "Invalid refresh token" }, 401);
    }

    if (new Date() > new Date(session.expiresAt)) {
      await db.delete(sessions).where(eq(sessions.id, session.id));
      return c.json({ error: "Refresh token expired" }, 401);
    }

    const newAccessToken = await generateAccessToken(payload.sub, payload.email);

    return c.json({ accessToken: newAccessToken });
  } catch {
    return c.json({ error: "Invalid refresh token" }, 401);
  }
});

auth.post("/logout", authMiddleware, async (c) => {
  const userId = c.get("userId");
  await db.delete(sessions).where(eq(sessions.userId, userId));
  return c.json({ message: "Logged out" });
});

auth.get("/me", authMiddleware, async (c) => {
  const userId = c.get("userId");
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
  });
});

export default auth;
