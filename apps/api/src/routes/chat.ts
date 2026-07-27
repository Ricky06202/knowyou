import { Hono } from "hono";
import { eq, desc } from "drizzle-orm";
import { chatHistory, recommendations, userProfiles, userLibrary } from "../db/schema";
import { db } from "../db";
import { authMiddleware, type Env } from "../middleware/auth";
import { chatCompletion, buildChatMessages, extractTastes, extractRecommendations, SYSTEM_PROMPT, type Recommendation } from "../services/deepseek";
import { searchGames } from "../services/rawg";
import { searchMovies, searchSeries } from "../services/tmdb";
import { searchAnime } from "../services/anilist";

const chat = new Hono<Env>();

async function enrichRecommendations(recs: Recommendation[]): Promise<Recommendation[]> {
  const enriched = await Promise.all(
    recs.map(async (rec) => {
      try {
        if (rec.category === "games") {
          const results = await searchGames(rec.title, { page: 1 });
          const match = results.results[0];
          if (match) {
            return {
              ...rec,
              externalId: String(match.id),
              image: match.background_image || rec.image,
              genres: match.genres.map((g) => g.name),
              rating: match.metacritic || match.rating || rec.rating,
              year: match.released ? new Date(match.released).getFullYear() : rec.year,
            };
          }
        } else if (rec.category === "movies") {
          const { results } = await searchMovies(rec.title, 1);
          const match = results[0];
          if (match) {
            return {
              ...rec,
              externalId: String(match.id),
              image: match.image || rec.image,
              genres: rec.genres.length > 0 ? rec.genres : [],
              rating: match.rating ? Math.round(match.rating) : rec.rating,
              year: match.year || rec.year,
            };
          }
        } else if (rec.category === "series") {
          const { results } = await searchSeries(rec.title, 1);
          const match = results[0];
          if (match) {
            return {
              ...rec,
              externalId: String(match.id),
              image: match.image || rec.image,
              genres: rec.genres.length > 0 ? rec.genres : [],
              rating: match.rating ? Math.round(match.rating) : rec.rating,
              year: match.year || rec.year,
            };
          }
        } else if (rec.category === "anime") {
          const { results } = await searchAnime(rec.title, 1);
          const match = results[0];
          if (match) {
            return {
              ...rec,
              externalId: String(match.id),
              image: match.coverImage?.large || match.coverImage?.medium || rec.image,
              genres: match.genres?.length > 0 ? match.genres : rec.genres,
              rating: match.averageScore || rec.rating,
              year: match.seasonYear || rec.year,
            };
          }
        } else if (rec.category === "kdrama") {
          const { results } = await searchSeries(rec.title, 1);
          const match = results[0];
          if (match && match.title) {
            return {
              ...rec,
              externalId: String(match.id),
              image: match.image || rec.image,
              genres: rec.genres.length > 0 ? rec.genres : [],
              rating: match.rating || rec.rating,
              year: match.year || rec.year,
            };
          }
        }
      } catch {}
      return rec;
    })
  );
  return enriched;
}

chat.use("/*", authMiddleware);

chat.post("/", async (c) => {
  const userId = c.get("userId");
  const { message } = await c.req.json();

  if (!message || typeof message !== "string") {
    return c.json({ error: "Message is required" }, 400);
  }

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const historyRows = await db
    .select()
    .from(chatHistory)
    .where(eq(chatHistory.userId, userId))
    .orderBy(desc(chatHistory.createdAt))
    .limit(30);

  const chatMessages = historyRows.reverse().map((m) => ({
    role: m.role,
    content: m.content,
  }));

  const libraryItems = await db
    .select({
      title: userLibrary.title,
      category: userLibrary.category,
      status: userLibrary.status,
      rating: userLibrary.rating,
      genres: userLibrary.genres,
      hoursPlayed: userLibrary.hoursPlayed,
      progress: userLibrary.progress,
    })
    .from(userLibrary)
    .where(eq(userLibrary.userId, userId));

  await db.insert(chatHistory).values({
    userId,
    role: "user",
    content: message,
  });

  const userProfile = profile
    ? {
        games: profile.games,
        movies: profile.movies,
        series: profile.series,
        anime: profile.anime,
        kdrama: profile.kdrama,
      }
    : {};

  const messages = buildChatMessages(message, userProfile, chatMessages, libraryItems);

  try {
    const response = await chatCompletion(messages, {
      temperature: 0.8,
      max_tokens: 2048,
    });

    const rawMessage = response.choices[0]?.message?.content || "I couldn't generate a response.";
    const { cleanResponse: withTastes, tastes } = extractTastes(rawMessage);
    const { cleanResponse, recommendations } = extractRecommendations(withTastes);

    const enrichedRecommendations = await enrichRecommendations(recommendations);

    await db.insert(chatHistory).values({
      userId,
      role: "assistant",
      content: cleanResponse,
      metadata: {
        tokens: response.usage,
        tastesExtracted: Object.keys(tastes).length > 0,
        recommendationsCount: enrichedRecommendations.length,
      },
    });

    if (Object.keys(tastes).length > 0 && profile) {
      const updates: Record<string, unknown> = { updatedAt: new Date() };

      const categories = ["games", "movies", "series", "anime", "kdrama"] as const;
      for (const cat of categories) {
        const catTastes = tastes[cat];
        if (!catTastes) continue;

        const current = (profile as Record<string, unknown>)[cat] as Record<string, unknown> || {};
        const merged: Record<string, unknown> = { ...current };

        for (const field of ["genres", "liked", "disliked"] as const) {
          const newValues = catTastes[field];
          if (!newValues || !Array.isArray(newValues)) continue;
          const existing = (merged[field] as string[]) || [];
          const existingSet = new Set(existing);

          for (const val of newValues) {
            if (field === "disliked") {
              existingSet.add(val);
              existingSet.delete(val);
            } else if (field === "liked") {
              existingSet.delete(val);
              existingSet.add(val);
            } else {
              existingSet.add(val);
            }
          }

          if (field === "liked") {
            const disliked = new Set((merged.disliked as string[]) || []);
            for (const v of disliked) existingSet.delete(v);
          }
          if (field === "disliked") {
            const liked = new Set((merged.liked as string[]) || []);
            for (const v of liked) existingSet.delete(v);
          }

          merged[field] = [...existingSet];
        }

        updates[cat] = merged;
      }

      await db
        .update(userProfiles)
        .set(updates)
        .where(eq(userProfiles.userId, userId));
    }

    return c.json({
      message: cleanResponse,
      recommendations: enrichedRecommendations,
      usage: response.usage,
    });
  } catch (err) {
    return c.json({ error: "Failed to get response from AI", details: String(err) }, 500);
  }
});

chat.get("/history", async (c) => {
  const userId = c.get("userId");
  const limit = Number(c.req.query("limit") || 50);

  const history = await db
    .select()
    .from(chatHistory)
    .where(eq(chatHistory.userId, userId))
    .orderBy(desc(chatHistory.createdAt))
    .limit(limit);

  return c.json({ messages: history.reverse() });
});

chat.delete("/history", async (c) => {
  const userId = c.get("userId");
  await db.delete(chatHistory).where(eq(chatHistory.userId, userId));
  return c.json({ message: "Chat history cleared" });
});

export default chat;
