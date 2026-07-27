import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { userLibrary, userProfiles } from "../db/schema";
import { db } from "../db";
import { authMiddleware, type Env } from "../middleware/auth";
import { chatCompletion } from "../services/deepseek";
import { searchGames } from "../services/rawg";
import { searchMovies, searchSeries } from "../services/tmdb";
import { searchAnime } from "../services/anilist";

const recommend = new Hono<Env>();

recommend.use("/*", authMiddleware);

async function enrichItem(rec: { title: string; category: string; reason?: string }) {
  try {
    if (rec.category === "games") {
      const r = await searchGames(rec.title, { page: 1 });
      const m = r.results[0];
      if (m) return { title: rec.title, category: "games", externalId: String(m.id), source: "rawg", image: m.background_image || null, genres: m.genres?.map((g: any) => g.name) || [], reason: rec.reason || "", year: m.released ? new Date(m.released).getFullYear() : null, rating: m.metacritic || m.rating || null, description: m.description || "" };
    } else if (rec.category === "movies") {
      const { results } = await searchMovies(rec.title, 1);
      const m = results[0];
      if (m) return { ...m, reason: rec.reason || "" };
    } else if (rec.category === "series") {
      const { results } = await searchSeries(rec.title, 1);
      const m = results[0];
      if (m) return { ...m, reason: rec.reason || "" };
    } else if (rec.category === "anime") {
      const { results } = await searchAnime(rec.title, 1);
      const m = results[0];
      if (m) return { title: rec.title, category: "anime", externalId: String(m.id), source: "anilist", image: m.coverImage?.large || m.coverImage?.medium || null, genres: m.genres || [], reason: rec.reason || "", year: m.seasonYear || null, rating: m.averageScore || null, description: (m.description || "").replace(/<[^>]*>/g, "") };
    }
  } catch {}
  return { title: rec.title, category: rec.category, externalId: "0", source: "unknown", image: null, genres: [], reason: rec.reason || "", year: null, rating: null, description: "" };
}

recommend.get("/", async (c) => {
  const userId = c.get("userId");
  const category = c.req.query("category") || "games";
  const userPrompt = c.req.query("prompt") || "";

  const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  const libraryItems = await db.select().from(userLibrary).where(eq(userLibrary.userId, userId));

  const myItems = libraryItems.filter((i) => i.category === category);
  const liked = myItems.filter((i) => i.status !== "disliked").map((i) => `${i.title}${i.rating ? ` (${i.rating}/5)` : ""}`);
  const disliked = myItems.filter((i) => i.status === "disliked").map((i) => i.title);
  const library = myItems.map((i) => i.title);
  const catProfile = profile ? (profile as Record<string, any>)[category] || {} : {};

  const promptText = userPrompt
    ? `Additional user request: ${userPrompt}`
    : `Recommend diverse ${category} matching their taste.`;

  const prompt = `You recommend ${category}. User's library: ${JSON.stringify(liked)}. Disliked: ${JSON.stringify(disliked)}. Profile: ${JSON.stringify(catProfile)}. ${promptText}

Rules: NO duplicates from library. 10 items. 
Respond JSON: [{"title":"Name","reason":"Why","genre":"Gen","year":2024}]`;

  const response = await chatCompletion(
    [
      { role: "system", content: "You recommend entertainment. Valid JSON only." },
      { role: "user", content: prompt },
    ],
    { temperature: 0.7, max_tokens: 2048 }
  );

  let rawRecs: Array<{ title: string; reason: string; genre: string; year: number }> = [];
  try {
    const content = (response.choices[0]?.message?.content || "[]").replace(/```json\n?|\n?```/g, "").trim();
    rawRecs = JSON.parse(content);
  } catch {}
  if (!Array.isArray(rawRecs)) rawRecs = [];

  const excludeTitles = new Set(library.map((t) => t.toLowerCase()));
  const filtered = rawRecs.filter((r) => r && r.title && !excludeTitles.has(r.title.toLowerCase()));

  const enriched = await Promise.all(filtered.slice(0, 10).map((r) => enrichItem({ ...r, category })));

  return c.json({ recommendations: enriched, category });
});

export default recommend;
