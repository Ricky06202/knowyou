import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { userProfiles, userLibrary } from "../db/schema";
import { db } from "../db";
import { authMiddleware, type Env } from "../middleware/auth";
import { getPopularGames } from "../services/rawg";
import { getTrendingMovies, getTrendingSeries } from "../services/tmdb";
import { getPopularAnime } from "../services/anilist";

const recommendations = new Hono<Env>();

recommendations.use("/*", authMiddleware);

recommendations.get("/", async (c) => {
  const userId = c.get("userId");
  const category = c.req.query("category") || "mixed";
  const page = Number(c.req.query("page") || 1);

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  const libraryTitles = await db
    .select({ title: userLibrary.title, category: userLibrary.category })
    .from(userLibrary)
    .where(eq(userLibrary.userId, userId));

  const excludedTitles = new Set(libraryTitles.map((i) => i.title.toLowerCase()));

  const profileData = profile || {};
  const userGenres = new Set<string>();
  const categories = ["games", "movies", "series", "anime"] as const;
  for (const cat of categories) {
    const catProfile = (profileData as Record<string, any>)[cat];
    if (catProfile?.genres) {
      for (const g of catProfile.genres) userGenres.add(g.toLowerCase());
    }
  }

  function excludeOwned(items: any[]): any[] {
    return items.filter((i) => {
      const title = typeof i.title === "string" ? i.title.toLowerCase() : "";
      return !excludedTitles.has(title);
    });
  }

  function matchGenre(items: any[]): any[] {
    if (userGenres.size === 0) return items;
    return items.filter((item) => {
      const itemGenres = (item.genres || []).map((g: string) => g.toLowerCase());
      return itemGenres.some((g: string) => userGenres.has(g));
    });
  }

  try {
    if (category === "mixed") {
      const [games, movies, series, anime] = await Promise.all([
        getPopularGames({ ordering: "-added", page }).catch(() => ({ results: [], count: 0 })),
        getTrendingMovies(page).catch(() => ({ results: [], total: 0 })),
        getTrendingSeries(page).catch(() => ({ results: [], total: 0 })),
        getPopularAnime(page).catch(() => ({ results: [], total: 0 })),
      ]);

      return c.json({
        games: excludeOwned(matchGenre((games.results || []).map((g: any) => ({
          id: g.id,
          externalId: String(g.id),
          title: g.name,
          image: g.background_image,
          genres: g.genres?.map((gn: any) => gn.name) || [],
          year: g.released ? new Date(g.released).getFullYear() : null,
          rating: g.metacritic || g.rating,
          source: "rawg",
          category: "games",
        })))),
        movies: excludeOwned(matchGenre(movies.results || [])),
        series: excludeOwned(matchGenre(series.results || [])),
        anime: excludeOwned(matchGenre((anime.results || []).map((a: any) => ({
          id: a.id,
          externalId: String(a.id),
          title: a.title?.english || a.title?.romaji || "Unknown",
          image: a.coverImage?.large || a.coverImage?.medium || null,
          genres: a.genres || [],
          year: a.seasonYear || null,
          rating: a.averageScore,
          source: "anilist",
          category: "anime",
        })))),
        page,
        hasMore: true,
      });
    }

    let items: any[] = [];
    let total = 0;

    if (category === "games") {
      const r = await getPopularGames({ ordering: "-added", page }).catch(() => ({ results: [], count: 0 }));
      total = r.count || 0;
      items = excludeOwned(matchGenre((r.results || []).map((g: any) => ({
        id: g.id,
        externalId: String(g.id),
        title: g.name,
        image: g.background_image,
        genres: g.genres?.map((gn: any) => gn.name) || [],
        year: g.released ? new Date(g.released).getFullYear() : null,
        rating: g.metacritic || g.rating,
        source: "rawg",
        category: "games",
      }))));
    } else if (category === "movies") {
      const r = await getTrendingMovies(page).catch(() => ({ results: [], total: 0 }));
      total = r.total || 0;
      items = excludeOwned(matchGenre(r.results || []));
    } else if (category === "series") {
      const r = await getTrendingSeries(page).catch(() => ({ results: [], total: 0 }));
      total = r.total || 0;
      items = excludeOwned(matchGenre(r.results || []));
    } else if (category === "anime") {
      const r = await getPopularAnime(page).catch(() => ({ results: [], total: 0 }));
      total = r.total || 0;
      items = excludeOwned(matchGenre((r.results || []).map((a: any) => ({
        id: a.id,
        externalId: String(a.id),
        title: a.title?.english || a.title?.romaji || "Unknown",
        image: a.coverImage?.large || a.coverImage?.medium || null,
        genres: a.genres || [],
        year: a.seasonYear || null,
        rating: a.averageScore,
        source: "anilist",
        category: "anime",
      }))));
    }

    return c.json({ items, page, total, hasMore: items.length === 20 });
  } catch (err) {
    return c.json({ error: "Failed to fetch recommendations", details: String(err) }, 500);
  }
});

export default recommendations;
