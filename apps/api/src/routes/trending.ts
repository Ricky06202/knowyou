import { Hono } from "hono";
import { authMiddleware, type Env } from "../middleware/auth";
import { searchGames, getPopularGames } from "../services/rawg";
import { getTrendingMovies, getTrendingSeries, getPopularMovies as tmdbPopularMovies, getPopularSeries as tmdbPopularSeries, getMoviesByGenre, getSeriesByGenre } from "../services/tmdb";
import { getPopularAnime, getPopularAnimeByGenre } from "../services/anilist";

const trending = new Hono<Env>();

trending.use("/*", authMiddleware);

trending.get("/", async (c) => {
  const category = c.req.query("category") || "mixed";
  const page = Number(c.req.query("page") || 1);
  const perPage = 20;
  const genresFilter = c.req.query("genres")?.split(",").map((g) => g.trim().toLowerCase()).filter(Boolean);

  function filterByGenre(items: any[]): any[] {
    if (!genresFilter || genresFilter.length === 0) return items;
    return items.filter((item) => {
      const itemGenres = (item.genres || []).map((g: string) => g.toLowerCase());
      return genresFilter.some((g) => itemGenres.includes(g));
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
        games: filterByGenre((games.results || []).map((g: any) => ({
          id: g.id,
          externalId: String(g.id),
          title: g.name,
          image: g.background_image,
          genres: g.genres?.map((gn: any) => gn.name) || [],
          year: g.released ? new Date(g.released).getFullYear() : null,
          rating: g.metacritic || g.rating,
          source: "rawg",
          category: "games",
        }))),
        movies: filterByGenre(movies.results || []),
        series: filterByGenre(series.results || []),
        anime: filterByGenre((anime.results || []).map((a: any) => ({
          id: a.id,
          externalId: String(a.id),
          title: a.title?.english || a.title?.romaji || "Unknown",
          image: a.coverImage?.large || a.coverImage?.medium || null,
          genres: a.genres || [],
          year: a.seasonYear || null,
          rating: a.averageScore,
          source: "anilist",
          category: "anime",
        }))),
        page,
        hasMore: (games.results || []).length === perPage || (movies.results || []).length === perPage || (series.results || []).length === perPage || (anime.results || []).length === perPage,
      });
    }

    let items: any[] = [];
    let total = 0;

    if (category === "games") {
      const r = await getPopularGames({ ordering: "-added", page }).catch(() => ({ results: [], count: 0 }));
      total = r.count || 0;
      items = filterByGenre((r.results || []).map((g: any) => ({
        id: g.id,
        externalId: String(g.id),
        title: g.name,
        image: g.background_image,
        genres: g.genres?.map((gn: any) => gn.name) || [],
        year: g.released ? new Date(g.released).getFullYear() : null,
        rating: g.metacritic || g.rating,
        source: "rawg",
        category: "games",
      })));
    } else if (category === "movies") {
      const r = await getTrendingMovies(page).catch(() => ({ results: [], total: 0 }));
      total = r.total || 0;
      items = filterByGenre(r.results || []);
    } else if (category === "series") {
      const r = await getTrendingSeries(page).catch(() => ({ results: [], total: 0 }));
      total = r.total || 0;
      items = filterByGenre(r.results || []);
    } else if (category === "anime") {
      const r = await getPopularAnime(page).catch(() => ({ results: [], total: 0 }));
      total = r.total || 0;
      items = filterByGenre((r.results || []).map((a: any) => ({
        id: a.id,
        externalId: String(a.id),
        title: a.title?.english || a.title?.romaji || "Unknown",
        image: a.coverImage?.large || a.coverImage?.medium || null,
        genres: a.genres || [],
        year: a.seasonYear || null,
        rating: a.averageScore,
        source: "anilist",
        category: "anime",
      })));
    }

    const totalPages = Math.ceil(total / perPage);

    return c.json({
      items,
      page,
      total,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch (err) {
    return c.json({ error: "Failed to fetch trending", details: String(err) }, 500);
  }
});

export default trending;
