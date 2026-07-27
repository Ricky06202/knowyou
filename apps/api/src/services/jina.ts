const JINA_BASE = "https://r.jina.ai";

export interface JinaResult {
  title: string;
  content: string;
  url: string;
}

export async function readUrl(url: string): Promise<string> {
  const res = await fetch(`${JINA_BASE}/${url}`, {
    headers: {
      Accept: "text/markdown",
      "X-Return-Format": "markdown",
    },
  });

  if (!res.ok) {
    throw new Error(`Jina Reader error: ${res.status}`);
  }

  return res.text();
}

export async function searchAndRead(query: string): Promise<JinaResult[]> {
  const searchUrl = `https://s.jina.ai/${encodeURIComponent(query)}`;
  const res = await fetch(searchUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    throw new Error(`Jina Search error: ${res.status}`);
  }

  return res.json();
}

export async function getGameReviews(gameName: string): Promise<string> {
  try {
    const results = await searchAndRead(`${gameName} game review gameplay experience`);
    const topResults = results.slice(0, 3);
    return topResults.map((r) => `Source: ${r.url}\n${r.content}`).join("\n\n---\n\n");
  } catch {
    return `No reviews found for ${gameName}`;
  }
}

export async function getMovieReviews(movieName: string): Promise<string> {
  try {
    const results = await searchAndRead(`${movieName} movie review critic`);
    const topResults = results.slice(0, 3);
    return topResults.map((r) => `Source: ${r.url}\n${r.content}`).join("\n\n---\n\n");
  } catch {
    return `No reviews found for ${movieName}`;
  }
}
