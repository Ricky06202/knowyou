const DEEPSEEK_BASE = "https://api.deepseek.com";
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekResponse {
  id: string;
  choices: {
    index: number;
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function chatCompletion(
  messages: DeepSeekMessage[],
  options?: {
    model?: string;
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  }
): Promise<DeepSeekResponse> {
  const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: options?.model || "deepseek-v4-flash",
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 2048,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`DeepSeek API error: ${res.status} - ${error}`);
  }

  return res.json();
}

export async function chatCompletionStream(
  messages: DeepSeekMessage[],
  options?: { model?: string; temperature?: number; max_tokens?: number }
): Promise<ReadableStream<Uint8Array>> {
  const res = await fetch(`${DEEPSEEK_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${DEEPSEEK_KEY}`,
    },
    body: JSON.stringify({
      model: options?.model || "deepseek-v4-flash",
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.max_tokens ?? 2048,
      stream: true,
    }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`DeepSeek API error: ${res.status} - ${error}`);
  }

  if (!res.body) {
    throw new Error("No response body for streaming");
  }

  return res.body;
}

export const SYSTEM_PROMPT = `You are KnowYou, a friendly and knowledgeable content recommender assistant. You help users discover video games, movies, TV series, anime, and K-dramas based on their tastes and preferences.

## Personality
- Friendly, casual, and enthusiastic — like a friend who knows a lot about entertainment
- You ALWAYS follow the conversation thread. If the user is talking about a specific topic, stay on that topic until they change it
- You ask clarifying questions when needed
- You explain WHY you think someone would like something
- You're honest if you're not sure about something
- Use emoji occasionally to keep the tone light

## Learning User Tastes (CRITICAL)
After EVERY user message, analyze what they said and extract taste information. You MUST output a JSON block at the very end of your response (after your normal reply) in this exact format:

<!--TASTES:
{
  "games": { "genres": [], "liked": [], "disliked": [] },
  "movies": { "genres": [], "liked": [], "disliked": [] },
  "series": { "genres": [], "liked": [], "disliked": [] },
  "anime": { "genres": [], "liked": [], "disliked": [] },
  "kdrama": { "genres": [], "liked": [], "disliked": [] }
}
-->

Rules for taste extraction:
- ONLY include fields that should CHANGE (add or remove from current profile)
- If the user says "me gusta Disgaea", add "Disgaea" to games.liked
- If the user says "no me gusta Path of Exile", add "Path of Exile" to games.disliked
- If the user says "prefiero RPGs sobre accion", add "RPG" to games.genres
- If the user says "me gustan las pelis de Christopher Nolan", add "Christopher Nolan" to movies.liked
- If the user corrects you ("en realidad no me gusta X"), REMOVE from liked and ADD to disliked
- Extract genres, liked items, disliked items, and any other taste signals
- If nothing changed, output an empty object: <!--TASTES: {} -->
- ALWAYS output the TASTES block, even if empty

## Recommendations (CRITICAL - YOU MUST DO THIS)
EVERY time you mention or recommend any content (games, movies, series, anime), you MUST append a <!--RECOMMENDATIONS: [...]--> block at the VERY END of your response. This is NOT optional. Failure to include this block means the user won't see clickable cards.

Format:
<!--RECOMMENDATIONS:
[
  {"title": "Name", "category": "games|movies|series|anime|kdrama", "externalId": "0", "source": "rawg|tmdb|anilist", "genres": ["Genre1"], "description": "Brief description", "reason": "Why user would like it", "image": null, "year": 2024, "rating": 85}
]
-->

Rules:
- category: "games"|"movies"|"series"|"anime"|"kdrama"
- source: games="rawg", movies="tmdb", series="tmdb", anime="anilist", kdrama="tmdb"
- ALWAYS include this block if you listed ANY titles (Disgaea, Fire Emblem, etc.)
- 2-5 recommendations
- ONLY skip if user is talking about something completely unrelated to entertainment

## Tracking progress
When the user mentions they completed something, are watching/playing something, or dropped something, acknowledge it and be encouraging.

Keep responses concise but informative.`;

export interface TasteUpdate {
  games?: { genres?: string[]; liked?: string[]; disliked?: string[] };
  movies?: { genres?: string[]; liked?: string[]; disliked?: string[] };
  series?: { genres?: string[]; liked?: string[]; disliked?: string[] };
  anime?: { genres?: string[]; liked?: string[]; disliked?: string[] };
  kdrama?: { genres?: string[]; liked?: string[]; disliked?: string[] };
}

export interface Recommendation {
  title: string;
  category: "games" | "movies" | "series" | "anime" | "kdrama";
  externalId: string;
  source: string;
  genres: string[];
  description: string;
  reason: string;
  image: string | null;
  year: number | null;
  rating: number | null;
}

export function extractTastes(response: string): { cleanResponse: string; tastes: TasteUpdate } {
  const tasteRegex = /<!--TASTES:\s*(\{[\s\S]*?\})\s*-->/;
  const match = response.match(tasteRegex);

  let tastes: TasteUpdate = {};
  let cleanResponse = response;

  if (match) {
    try {
      tastes = JSON.parse(match[1]);
    } catch {
      tastes = {};
    }
    cleanResponse = response.replace(tasteRegex, "").trim();
  }

  return { cleanResponse, tastes };
}

export function extractRecommendations(response: string): { cleanResponse: string; recommendations: Recommendation[] } {
  const recRegex = /<!--RECOMMENDATIONS:\s*(\[[\s\S]*?\])\s*-->/;
  const match = response.match(recRegex);

  if (match) {
    try {
      const recommendations = JSON.parse(match[1]);
      const cleanResponse = response.replace(recRegex, "").trim();
      return { cleanResponse, recommendations };
    } catch {}
  }

  // Fallback: extract from numbered list, detect category from context
  const lines = response.split("\n");
  const numberedLineRegex = /^\s*(\d+)[.)]\s+\*{0,2}(.+?)\*{0,2}/;
  const items: { line: string; title: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nMatch = line.match(numberedLineRegex);
    if (nMatch) {
      items.push({ line, title: nMatch[2].trim() });
    }
  }

  if (items.length >= 2) {
    const responseLower = response.toLowerCase();
    let defaultCategory = "games";
    if (responseLower.includes("kdrama") || responseLower.includes("k-drama") || responseLower.includes("coreano")) {
      defaultCategory = "kdrama";
    } else if (responseLower.includes("anime") || responseLower.includes("animación") || responseLower.includes("animado")) {
      defaultCategory = "anime";
    } else if (responseLower.includes("película") || responseLower.includes("pelicula") || responseLower.includes("cine")) {
      defaultCategory = "movies";
    } else if (responseLower.includes("serie") || responseLower.includes("tv")) {
      defaultCategory = "series";
    }

    const sourceMap: Record<string, string> = { games: "rawg", movies: "tmdb", series: "tmdb", anime: "anilist", kdrama: "tmdb" };

    const recommendations: Recommendation[] = items.map((item) => {
      const title = item.title.replace(/\([\d\-–—,]+\)/g, "").trim();

      let category = defaultCategory as "games" | "movies" | "series" | "anime" | "kdrama";
      const lineLower = item.line.toLowerCase();
      if (lineLower.includes("🎬")) category = "movies";
      else if (lineLower.includes("📺")) category = "series";
      else if (lineLower.includes("⛩️")) category = "anime";
      else if (lineLower.includes("🇰🇷") || lineLower.includes("coreano") || lineLower.includes("kdrama")) category = "kdrama";
      else if (lineLower.includes("🎮")) category = "games";

      return {
        title,
        category,
        externalId: "0",
        source: sourceMap[category] || "tmdb",
        genres: [],
        description: "",
        reason: "",
        image: null,
        year: null,
        rating: null,
      };
    });

    return { cleanResponse: response, recommendations };
  }

  return { cleanResponse: response, recommendations: [] };
}

export function buildChatMessages(
  userMessage: string,
  userProfile: Record<string, unknown>,
  chatHistory: { role: string; content: string }[],
  libraryItems?: { title: string; category: string; status: string; rating: number | null; genres: string[] | null; hoursPlayed: number | null; progress: number | null }[]
): DeepSeekMessage[] {
  let libraryContext = "";
  if (libraryItems && libraryItems.length > 0) {
    const grouped: Record<string, string[]> = {};
    for (const item of libraryItems) {
      const cat = item.category;
      if (!grouped[cat]) grouped[cat] = [];
      const statusLabel = item.status || "queued";
      const ratingStr = item.rating ? ` ★${item.rating}/5` : "";
      const hoursStr = item.hoursPlayed ? ` (${item.hoursPlayed}h)` : "";
      const progressStr = item.progress ? ` ep.${item.progress}` : "";
      grouped[cat].push(`${item.title} [${statusLabel}]${hoursStr}${progressStr}${ratingStr}`);
    }
    const parts = Object.entries(grouped).map(
      ([cat, items]) => `${cat}: ${items.join(", ")}`
    );
    libraryContext = `\n\nUser's library/gallery contents:\n${parts.join("\n")}`;
  }

  const messages: DeepSeekMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `User taste profile: ${JSON.stringify(userProfile, null, 2)}${libraryContext}`,
    },
  ];

  for (const msg of chatHistory.slice(-10)) {
    messages.push({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    });
  }

  messages.push({ role: "user", content: userMessage });
  return messages;
}
