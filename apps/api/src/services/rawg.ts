const RAWG_BASE = "https://api.rawg.io/api";
const RAWG_KEY = process.env.RAWG_API_KEY;

export interface RawgGame {
  id: number;
  name: string;
  slug: string;
  description: string;
  metacritic: number;
  rating: number;
  released: string;
  background_image: string;
  genres: { id: number; name: string }[];
  platforms: { platform: { id: number; name: string } }[];
  tags: { id: number; name: string }[];
  short_screenshots: { id: number; image: string }[];
}

export interface RawgSearchResult {
  count: number;
  results: RawgGame[];
}

export async function searchGames(
  query: string,
  options?: { genres?: string; platforms?: string; ordering?: string; page?: number }
): Promise<RawgSearchResult> {
  const params = new URLSearchParams({
    key: RAWG_KEY!,
    search: query,
    page_size: "20",
    page: String(options?.page || 1),
  });

  if (options?.genres) params.set("genres", options.genres);
  if (options?.platforms) params.set("platforms", options.platforms);
  if (options?.ordering) params.set("ordering", options.ordering);

  const res = await fetch(`${RAWG_BASE}/games?${params}`);
  if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);
  return res.json();
}

export async function getPopularGames(
  options?: { ordering?: string; page?: number; dates?: string; genres?: string }
): Promise<RawgSearchResult> {
  const params = new URLSearchParams({
    key: RAWG_KEY!,
    page_size: "20",
    page: String(options?.page || 1),
    ordering: options?.ordering || "-added",
  });

  if (options?.dates) params.set("dates", options.dates);
  if (options?.genres) params.set("genres", options.genres);

  const res = await fetch(`${RAWG_BASE}/games?${params}`);
  if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);
  return res.json();
}

export async function getGameDetails(id: number): Promise<RawgGame> {
  const params = new URLSearchParams({ key: RAWG_KEY! });
  const res = await fetch(`${RAWG_BASE}/games/${id}?${params}`);
  if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);
  return res.json();
}

export async function getGameScreenshots(id: number) {
  const params = new URLSearchParams({ key: RAWG_KEY! });
  const res = await fetch(`${RAWG_BASE}/games/${id}/screenshots?${params}`);
  if (!res.ok) throw new Error(`RAWG API error: ${res.status}`);
  return res.json();
}
