import { Hono } from "hono";
import { authMiddleware, type Env } from "../middleware/auth";
import { searchGames as rawgSearch, getGameDetails } from "../services/rawg";
import { searchMovies as tmdbSearchMovies, searchSeries as tmdbSearchSeries, getMovieDetails, getSeriesDetails } from "../services/tmdb";
import { searchAnime as anilistSearch } from "../services/anilist";

const search = new Hono<Env>();

search.use("/*", authMiddleware);

function isRelevant(title: string, query: string): boolean {
  const t = title.toLowerCase();
  const q = query.toLowerCase().trim();
  return t.includes(q);
}

search.get("/games", async (c) => {
  const q = c.req.query("q");
  const page = c.req.query("page");

  if (!q) return c.json({ error: "Query parameter 'q' is required" }, 400);

  try {
    const results = await rawgSearch(q, { page: page ? Number(page) : 1 });
    const pageNum = page ? Number(page) : 1;
    const filtered = results.results.filter((g) => isRelevant(g.name, q));
    return c.json({
      results: filtered.map((g) => ({
        id: g.id,
        externalId: String(g.id),
        title: g.name,
        description: g.description,
        image: g.background_image,
        rating: g.metacritic || g.rating,
        genres: g.genres.map((gn) => gn.name),
        year: g.released ? new Date(g.released).getFullYear() : null,
        platforms: g.platforms.map((p) => p.platform.name),
        source: "rawg",
      })),
      total: filtered.length,
      page: pageNum,
      totalPages: Math.ceil(results.count / 20),
      hasMore: pageNum < Math.ceil(results.count / 20),
    });
  } catch (err) {
    return c.json({ error: "Failed to search games", details: String(err) }, 500);
  }
});

search.get("/games/:id", async (c) => {
  const id = Number(c.req.param("id"));
  try {
    const game = await getGameDetails(id);
    return c.json({
      id: game.id,
      title: game.name,
      description: game.description,
      image: game.background_image,
      rating: game.metacritic || game.rating,
      genres: game.genres.map((gn) => gn.name),
      year: game.released ? new Date(game.released).getFullYear() : null,
      platforms: game.platforms.map((p) => p.platform.name),
      source: "rawg",
    });
  } catch (err) {
    return c.json({ error: "Failed to get game details", details: String(err) }, 500);
  }
});

search.get("/movies", async (c) => {
  const q = c.req.query("q");
  const page = c.req.query("page");

  if (!q) return c.json({ error: "Query parameter 'q' is required" }, 400);

  try {
    const { results, total, totalPages } = await tmdbSearchMovies(q, page ? Number(page) : 1);
    const pageNum = page ? Number(page) : 1;
    const filtered = results.filter((r: any) => isRelevant(r.title, q));
    return c.json({
      results: filtered,
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages,
    });
  } catch (err) {
    return c.json({ error: "Failed to search movies", details: String(err) }, 500);
  }
});

search.get("/movies/:id", async (c) => {
  const id = Number(c.req.param("id"));
  try {
    const movie = await getMovieDetails(id);
    return c.json(movie);
  } catch (err) {
    return c.json({ error: "Failed to get movie details", details: String(err) }, 500);
  }
});

search.get("/series", async (c) => {
  const q = c.req.query("q");
  const page = c.req.query("page");

  if (!q) return c.json({ error: "Query parameter 'q' is required" }, 400);

  try {
    const { results, total, totalPages } = await tmdbSearchSeries(q, page ? Number(page) : 1);
    const pageNum = page ? Number(page) : 1;
    const filtered = results.filter((r: any) => isRelevant(r.title, q));
    return c.json({
      results: filtered,
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages,
    });
  } catch (err) {
    return c.json({ error: "Failed to search series", details: String(err) }, 500);
  }
});

search.get("/series/:id", async (c) => {
  const id = Number(c.req.param("id"));
  try {
    const series = await getSeriesDetails(id);
    return c.json(series);
  } catch (err) {
    return c.json({ error: "Failed to get series details", details: String(err) }, 500);
  }
});

search.get("/anime", async (c) => {
  const q = c.req.query("q");
  const page = c.req.query("page");

  if (!q) return c.json({ error: "Query parameter 'q' is required" }, 400);

  try {
    const { results, total } = await anilistSearch(q, page ? Number(page) : 1);
    const pageNum = page ? Number(page) : 1;
    const filtered = results.filter((a: any) => isRelevant(a.title.english || a.title.romaji, q));
    const totalPages = Math.ceil(total / 20);
    return c.json({
      results: filtered.map((a) => ({
        id: a.id,
        externalId: String(a.id),
        title: a.title.english || a.title.romaji,
        description: a.description?.replace(/<[^>]*>/g, ""),
        image: a.coverImage.large || a.coverImage.medium,
        rating: a.averageScore,
        genres: a.genres,
        year: a.seasonYear,
        episodes: a.episodes,
        studios: a.studios.nodes.map((s) => s.name),
        format: a.format,
        status: a.status,
        source: "anilist",
      })),
      total,
      page: pageNum,
      totalPages,
      hasMore: pageNum < totalPages,
    });
  } catch (err) {
    return c.json({ error: "Failed to search anime", details: String(err) }, 500);
  }
});

search.get("/anime/:id", async (c) => {
  const id = Number(c.req.param("id"));
  try {
    const { getAnimeDetails } = await import("../services/anilist");
    const anime = await getAnimeDetails(id);
    return c.json({
      id: anime.id,
      title: anime.title.english || anime.title.romaji,
      description: anime.description?.replace(/<[^>]*>/g, ""),
      image: anime.coverImage.large || anime.coverImage.medium,
      rating: anime.averageScore,
      genres: anime.genres,
      year: anime.seasonYear,
      episodes: anime.episodes,
      studios: anime.studios.nodes.map((s) => s.name),
      format: anime.format,
      status: anime.status,
      source: "anilist",
    });
  } catch (err) {
    return c.json({ error: "Failed to get anime details", details: String(err) }, 500);
  }
});

export default search;
