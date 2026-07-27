import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import { userLibrary } from "../db/schema";
import { db } from "../db";
import { authMiddleware, type Env } from "../middleware/auth";

const library = new Hono<Env>();

library.use("/*", authMiddleware);

library.get("/", async (c) => {
  const userId = c.get("userId");
  const category = c.req.query("category");
  const status = c.req.query("status");

  const conditions = [eq(userLibrary.userId, userId)];
  if (category) conditions.push(eq(userLibrary.category, category));
  if (status) conditions.push(eq(userLibrary.status, status));

  const items = await db
    .select()
    .from(userLibrary)
    .where(and(...conditions))
    .orderBy(desc(userLibrary.updatedAt));

  return c.json({ items });
});

library.post("/", async (c) => {
  const userId = c.get("userId");
  const body = await c.req.json();
  const { category, externalId, source, title, image, genres, status, progress, hoursPlayed, rating, totalEpisodes, data } = body;

  if (!category || !externalId || !source || !title) {
    return c.json({ error: "category, externalId, source, and title are required" }, 400);
  }

  const existing = await db
    .select()
    .from(userLibrary)
    .where(and(eq(userLibrary.userId, userId), eq(userLibrary.externalId, externalId)))
    .limit(1);

  if (existing.length > 0) {
    return c.json({ error: "Item already in library" }, 409);
  }

  const [item] = await db
    .insert(userLibrary)
    .values({
      userId,
      category,
      externalId,
      source,
      title,
      image: image || null,
      genres: genres || [],
      status: status || "queued",
      progress: progress !== undefined ? progress : null,
      hoursPlayed: hoursPlayed !== undefined ? hoursPlayed : null,
      rating: rating !== undefined ? rating : null,
      totalEpisodes: totalEpisodes !== undefined ? totalEpisodes : null,
      data: data || {},
    })
    .returning();

  return c.json({ item }, 201);
});

library.patch("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");
  const body = await c.req.json();
  const { status, progress, hoursPlayed, rating, totalEpisodes } = body;

  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (status !== undefined) updates.status = status;
  if (progress !== undefined) updates.progress = progress;
  if (hoursPlayed !== undefined) updates.hoursPlayed = hoursPlayed;
  if (rating !== undefined) updates.rating = rating;
  if (totalEpisodes !== undefined) updates.totalEpisodes = totalEpisodes;

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const condition = isUUID
    ? and(eq(userLibrary.id, id), eq(userLibrary.userId, userId))
    : and(eq(userLibrary.externalId, id), eq(userLibrary.userId, userId));

  const [item] = await db
    .update(userLibrary)
    .set(updates)
    .where(condition)
    .returning();

  if (!item) return c.json({ error: "Item not found" }, 404);
  return c.json({ item });
});

library.delete("/:id", async (c) => {
  const userId = c.get("userId");
  const id = c.req.param("id");

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const condition = isUUID
    ? and(eq(userLibrary.id, id), eq(userLibrary.userId, userId))
    : and(eq(userLibrary.externalId, id), eq(userLibrary.userId, userId));

  const [deleted] = await db
    .delete(userLibrary)
    .where(condition)
    .returning();

  if (!deleted) return c.json({ error: "Item not found" }, 404);
  return c.json({ message: "Removed from library" });
});

library.get("/stats", async (c) => {
  const userId = c.get("userId");

  const items = await db
    .select()
    .from(userLibrary)
    .where(eq(userLibrary.userId, userId));

  const stats: Record<string, Record<string, number>> = {};
  for (const item of items) {
    if (!stats[item.category]) stats[item.category] = {};
    stats[item.category][item.status] = (stats[item.category][item.status] || 0) + 1;
  }

  return c.json({ stats, total: items.length });
});

export default library;
