const TMDB_BASE = "https://api.themoviedb.org/3";
const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

export interface TmdbItem {
  id: number;
  title?: string;
  name?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  overview: string;
  release_date?: string;
  first_air_date?: string;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
  media_type?: string;
}

export interface TmdbSearchResponse {
  page: number;
  results: TmdbItem[];
  total_results: number;
  total_pages: number;
}

const MOVIE_GENRES: Record<number, string> = {
  28: "Acción", 12: "Aventura", 16: "Animación", 35: "Comedia",
  80: "Crimen", 99: "Documental", 18: "Drama", 10751: "Familiar",
  14: "Fantasía", 36: "Historia", 27: "Terror", 10402: "Música",
  9648: "Misterio", 10749: "Romance", 878: "Ciencia ficción",
  10770: "TV Movie", 53: "Suspense", 10752: "Bélica", 37: "Western",
};

const TV_GENRES: Record<number, string> = {
  10759: "Acción & Aventura", 16: "Animación", 35: "Comedia",
  80: "Crimen", 99: "Documental", 18: "Drama", 10751: "Familiar",
  10762: "Niños", 9648: "Misterio", 10763: "Noticias",
  10764: "Reality", 10765: "Sci-Fi & Fantasy", 10766: "Soap",
  10767: "Talk", 10768: "Guerra & Política",
};

function mapItem(item: TmdbItem, category: "movies" | "series") {
  const genres = (item.genre_ids || [])
    .map((id) => (category === "movies" ? MOVIE_GENRES : TV_GENRES)[id])
    .filter(Boolean);

  return {
    id: item.id,
    externalId: String(item.id),
    title: item.title || item.name || "Unknown",
    image: item.poster_path ? `${TMDB_IMG}${item.poster_path}` : null,
    genres,
    year: item.release_date
      ? parseInt(item.release_date, 10)
      : item.first_air_date
      ? parseInt(item.first_air_date, 10)
      : null,
    rating: item.vote_average || null,
    description: item.overview || null,
    source: "tmdb",
    category,
  };
}

async function tmdbFetch(path: string, params?: Record<string, string>) {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", TMDB_KEY!);
  url.searchParams.set("language", "es-ES");
  if (params) {
    for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
  return res.json() as Promise<TmdbSearchResponse>;
}

export async function getTrendingMovies(page: number = 1) {
  const data = await tmdbFetch("/trending/movie/week", { page: String(page) });
  return {
    results: data.results.map((i) => mapItem(i, "movies")),
    total: data.total_results,
    totalPages: data.total_pages,
  };
}

export async function getTrendingSeries(page: number = 1) {
  const data = await tmdbFetch("/trending/tv/week", { page: String(page) });
  return {
    results: data.results.map((i) => mapItem(i, "series")),
    total: data.total_results,
    totalPages: data.total_pages,
  };
}

export async function getMoviesByGenre(genreId: number, page: number = 1) {
  const data = await tmdbFetch("/discover/movie", {
    with_genres: String(genreId),
    sort_by: "vote_count.desc",
    page: String(page),
  });
  return {
    results: data.results.map((i) => mapItem(i, "movies")),
    total: data.total_results,
    totalPages: data.total_pages,
  };
}

export async function getSeriesByGenre(genreId: number, page: number = 1) {
  const data = await tmdbFetch("/discover/tv", {
    with_genres: String(genreId),
    sort_by: "vote_count.desc",
    page: String(page),
  });
  return {
    results: data.results.map((i) => mapItem(i, "series")),
    total: data.total_results,
    totalPages: data.total_pages,
  };
}

export async function getPopularMovies(page: number = 1) {
  const data = await tmdbFetch("/movie/popular", { page: String(page) });
  return {
    results: data.results.map((i) => mapItem(i, "movies")),
    total: data.total_results,
    totalPages: data.total_pages,
  };
}

export async function getPopularSeries(page: number = 1) {
  const data = await tmdbFetch("/tv/popular", { page: String(page) });
  return {
    results: data.results.map((i) => mapItem(i, "series")),
    total: data.total_results,
    totalPages: data.total_pages,
  };
}

export async function searchMovies(query: string, page: number = 1) {
  const data = await tmdbFetch("/search/movie", { query, page: String(page) });
  return {
    results: data.results.map((i) => mapItem(i, "movies")),
    total: data.total_results,
    totalPages: data.total_pages,
  };
}

export async function searchSeries(query: string, page: number = 1) {
  const data = await tmdbFetch("/search/tv", { query, page: String(page) });
  return {
    results: data.results.map((i) => mapItem(i, "series")),
    total: data.total_results,
    totalPages: data.total_pages,
  };
}

export async function getMovieDetails(id: number) {
  const url = new URL(`${TMDB_BASE}/movie/${id}`);
  url.searchParams.set("api_key", TMDB_KEY!);
  url.searchParams.set("language", "es-ES");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
  const data = await res.json();
  return {
    id: data.id,
    externalId: String(data.id),
    title: data.title,
    image: data.poster_path ? `${TMDB_IMG}${data.poster_path}` : null,
    genres: (data.genres || []).map((g: any) => g.name),
    year: data.release_date ? parseInt(data.release_date, 10) : null,
    rating: data.vote_average || null,
    description: data.overview || null,
    source: "tmdb",
    category: "movies",
  };
}

export async function getSeriesDetails(id: number) {
  const url = new URL(`${TMDB_BASE}/tv/${id}`);
  url.searchParams.set("api_key", TMDB_KEY!);
  url.searchParams.set("language", "es-ES");
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`TMDB API error: ${res.status}`);
  const data = await res.json();
  return {
    id: data.id,
    externalId: String(data.id),
    title: data.name,
    image: data.poster_path ? `${TMDB_IMG}${data.poster_path}` : null,
    genres: (data.genres || []).map((g: any) => g.name),
    year: data.first_air_date ? parseInt(data.first_air_date, 10) : null,
    rating: data.vote_average || null,
    description: data.overview || null,
    source: "tmdb",
    category: "series",
    totalSeasons: data.number_of_seasons || null,
  };
}

const GENRE_NAME_TO_ID_MOVIE = Object.fromEntries(
  Object.entries(MOVIE_GENRES).map(([k, v]) => [v, Number(k)])
);
const GENRE_NAME_TO_ID_TV = Object.fromEntries(
  Object.entries(TV_GENRES).map(([k, v]) => [v, Number(k)])
);

function getGenreId(name: string, category: "movies" | "series"): number {
  if (category === "movies") return GENRE_NAME_TO_ID_MOVIE[name] || 0;
  return GENRE_NAME_TO_ID_TV[name] || 0;
}
