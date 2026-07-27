import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { userProfiles } from "../db/schema";
import { db } from "../db";
import { authMiddleware, type Env } from "../middleware/auth";

const profile = new Hono<Env>();

profile.use("/*", authMiddleware);

profile.get("/", async (c) => {
  const userId = c.get("userId");
  const [profileData] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (!profileData) {
    return c.json({ error: "Profile not found" }, 404);
  }

  return c.json({
    games: profileData.games,
    movies: profileData.movies,
    series: profileData.series,
    anime: profileData.anime,
    kdrama: profileData.kdrama,
    tasteVector: profileData.tasteVector,
  });
});

profile.put("/tastes", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();

  const allowedFields = ["games", "movies", "series", "anime", "kdrama"];
  const updateData: Record<string, unknown> = {};

  for (const field of allowedFields) {
    if (body[field]) {
      updateData[field] = body[field];
    }
  }

  if (Object.keys(updateData).length === 0) {
    return c.json({ error: "No valid fields to update" }, 400);
  }

  updateData.updatedAt = new Date();

  await db
    .update(userProfiles)
    .set(updateData)
    .where(eq(userProfiles.userId, userId));

  return c.json({ message: "Profile updated", updated: Object.keys(updateData) });
});

profile.put("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();

  const [existing] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (!existing) {
    return c.json({ error: "Profile not found" }, 404);
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  const allowedFields = ["games", "movies", "series", "anime", "kdrama"];

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field];
    }
  }

  await db
    .update(userProfiles)
    .set(updateData)
    .where(eq(userProfiles.userId, userId));

  return c.json({ message: "Profile updated" });
});

export default profile;
