const TVMAZE_BASE = "https://api.tvmaze.com";

export interface TvmazeShow {
  id: number;
  name: string;
  summary: string;
  image: { medium: string; original: string } | null;
  premiered: string;
  rating: { average: number } | null;
  genres: string[];
  status: string;
  network: { name: string; country: { name: string } } | null;
  webChannel: { name: string } | null;
  _embedded?: { episodes: TvmazeEpisode[] };
}

export interface TvmazeEpisode {
  id: number;
  name: string;
  season: number;
  number: number;
  airdate: string;
}

export interface TvmazeSearchResult {
  score: number;
  show: TvmazeShow;
}

export async function searchSeries(query: string): Promise<TvmazeSearchResult[]> {
  const params = new URLSearchParams({ q: query });
  const res = await fetch(`${TVMAZE_BASE}/search/shows?${params}`);
  if (!res.ok) throw new Error(`TVmaze API error: ${res.status}`);
  return res.json();
}

export async function getShowDetails(id: number): Promise<TvmazeShow> {
  const res = await fetch(`${TVMAZE_BASE}/shows/${id}?embed=episodes`);
  if (!res.ok) throw new Error(`TVmaze API error: ${res.status}`);
  return res.json();
}

export async function getShowSchedule(
  country: string = "US",
  date?: string
): Promise<{ id: number; url: string; name: string; season: number; number: number; airdate: string; show: { name: string } }[]> {
  const params = new URLSearchParams({ country });
  if (date) params.set("date", date);
  const res = await fetch(`${TVMAZE_BASE}/schedule?${params}`);
  if (!res.ok) throw new Error(`TVmaze API error: ${res.status}`);
  return res.json();
}
