const OMDb_BASE = "https://www.omdbapi.com";
const OMDb_KEY = process.env.OMDB_API_KEY;

export interface OmdbResult {
  Title: string;
  Year: string;
  imdbID: string;
  Type: string;
  Poster: string;
}

export interface OmdbSearchResponse {
  Search: OmdbResult[];
  totalResults: string;
  Response: string;
  Error?: string;
}

export interface OmdbDetails {
  Title: string;
  Year: string;
  Rated: string;
  Released: string;
  Runtime: string;
  Genre: string;
  Director: string;
  Actors: string;
  Plot: string;
  Poster: string;
  imdbRating: string;
  imdbVotes: string;
  imdbID: string;
  Type: string;
  totalSeasons?: string;
  Response: string;
  Error?: string;
}

export async function searchMovies(
  query: string,
  page: number = 1,
  year?: number
): Promise<{ results: OmdbResult[]; total: number }> {
  const params = new URLSearchParams({
    apikey: OMDb_KEY!,
    s: query,
    type: "movie",
    page: String(page),
  });
  if (year) params.set("y", String(year));

  const res = await fetch(`${OMDb_BASE}/?${params}`);
  if (!res.ok) throw new Error(`OMDb API error: ${res.status}`);
  const data: OmdbSearchResponse = await res.json();

  if (data.Response === "False") {
    return { results: [], total: 0 };
  }

  return {
    results: data.Search || [],
    total: parseInt(data.totalResults || "0", 10),
  };
}

export async function searchSeries(
  query: string,
  page: number = 1,
  year?: number
): Promise<{ results: OmdbResult[]; total: number }> {
  const params = new URLSearchParams({
    apikey: OMDb_KEY!,
    s: query,
    type: "series",
    page: String(page),
  });
  if (year) params.set("y", String(year));

  const res = await fetch(`${OMDb_BASE}/?${params}`);
  if (!res.ok) throw new Error(`OMDb API error: ${res.status}`);
  const data: OmdbSearchResponse = await res.json();

  if (data.Response === "False") {
    return { results: [], total: 0 };
  }

  return {
    results: data.Search || [],
    total: parseInt(data.totalResults || "0", 10),
  };
}

const POPULAR_TERMS = ["man", "star", "war", "king", "dark", "game", "last", "first", "red", "black"];

async function searchOmdbCombined(
  type: "movie" | "series",
  page: number
): Promise<{ results: OmdbResult[]; total: number }> {
  const perTerm = 10;
  const startIdx = (page - 1) * perTerm;
  const termIndex = Math.floor(startIdx / 20);
  const offset = startIdx % 20;

  const term1 = POPULAR_TERMS[termIndex % POPULAR_TERMS.length];
  const term2 = POPULAR_TERMS[(termIndex + 1) % POPULAR_TERMS.length];

  const apiPage1 = Math.floor(startIdx / 10) + 1;
  const apiPage2 = apiPage1;

  const searchFn = type === "movie" ? searchMovies : searchSeries;

  const [r1, r2] = await Promise.all([
    searchFn(term1, apiPage1),
    searchFn(term2, apiPage2),
  ]);

  const seen = new Set<string>();
  const merged: OmdbResult[] = [];
  for (const item of [...r1.results, ...r2.results]) {
    if (!seen.has(item.imdbID)) {
      seen.add(item.imdbID);
      merged.push(item);
    }
  }

  const sliced = merged.slice(offset, offset + perTerm);

  return {
    results: sliced,
    total: Math.max(r1.total, r2.total),
  };
}

export async function getPopularMovies(page: number = 1): Promise<{ results: OmdbResult[]; total: number }> {
  return searchOmdbCombined("movie", page);
}

export async function getPopularSeries(page: number = 1): Promise<{ results: OmdbResult[]; total: number }> {
  return searchOmdbCombined("series", page);
}

export async function getDetails(imdbId: string): Promise<OmdbDetails> {
  const params = new URLSearchParams({
    apikey: OMDb_KEY!,
    i: imdbId,
    plot: "short",
  });

  const res = await fetch(`${OMDb_BASE}/?${params}`);
  if (!res.ok) throw new Error(`OMDb API error: ${res.status}`);
  return res.json();
}
