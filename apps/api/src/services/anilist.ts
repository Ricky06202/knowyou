const ANILIST_BASE = "https://graphql.anilist.co";

export interface AnilistMediaTitle {
  romaji: string;
  english: string;
  native: string;
}

export interface AnilistCoverImage {
  large: string;
  medium: string;
}

export interface AnilistMedia {
  id: number;
  title: AnilistMediaTitle;
  description: string;
  coverImage: AnilistCoverImage;
  averageScore: number;
  genres: string[];
  episodes: number | null;
  status: string;
  season: string;
  seasonYear: number;
  studios: { nodes: { name: string }[] };
  format: string;
  type: string;
}

export interface AnilistPageInfo {
  total: number;
  perPage: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

export interface AnilistSearchResponse {
  data: {
    Page: {
      pageInfo: AnilistPageInfo;
      media: AnilistMedia[];
    };
  };
}

const SEARCH_QUERY = `
query ($search: String, $page: Int, $type: MediaType) {
  Page(page: $page, perPage: 20) {
    pageInfo {
      total
      perPage
      currentPage
      lastPage
      hasNextPage
    }
    media(search: $search, type: $type, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
        native
      }
      description(asHtml: false)
      coverImage {
        large
        medium
      }
      averageScore
      genres
      episodes
      status
      season
      seasonYear
      studios(isMain: true) {
        nodes {
          name
        }
      }
      format
      type
    }
  }
}`;

export async function searchAnime(
  query: string,
  page: number = 1
): Promise<{ results: AnilistMedia[]; total: number }> {
  const res = await fetch(ANILIST_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: SEARCH_QUERY,
      variables: { search: query, page, type: "ANIME" },
    }),
  });

  if (!res.ok) throw new Error(`AniList API error: ${res.status}`);
  const data: AnilistSearchResponse = await res.json();

  return {
    results: data.data.Page.media,
    total: data.data.Page.pageInfo.total,
  };
}

const POPULAR_QUERY = `
query ($page: Int, $type: MediaType) {
  Page(page: $page, perPage: 20) {
    pageInfo {
      total
      perPage
      currentPage
      lastPage
      hasNextPage
    }
    media(type: $type, sort: POPULARITY_DESC) {
      id
      title {
        romaji
        english
        native
      }
      description(asHtml: false)
      coverImage {
        large
        medium
      }
      averageScore
      genres
      episodes
      status
      season
      seasonYear
      studios(isMain: true) {
        nodes {
          name
        }
      }
      format
      type
    }
  }
}`;

export async function getPopularAnime(
  page: number = 1
): Promise<{ results: AnilistMedia[]; total: number }> {
  const res = await fetch(ANILIST_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: POPULAR_QUERY,
      variables: { page, type: "ANIME" },
    }),
  });

  if (!res.ok) throw new Error(`AniList API error: ${res.status}`);
  const data: AnilistSearchResponse = await res.json();

  return {
    results: data.data.Page.media,
    total: data.data.Page.pageInfo.total,
  };
}

const POPULAR_BY_GENRE_QUERY = `
query ($page: Int, $type: MediaType, $genre: String) {
  Page(page: $page, perPage: 20) {
    pageInfo {
      total
      perPage
      currentPage
      lastPage
      hasNextPage
    }
    media(type: $type, sort: POPULARITY_DESC, genre: $genre) {
      id
      title {
        romaji
        english
        native
      }
      description(asHtml: false)
      coverImage {
        large
        medium
      }
      averageScore
      genres
      episodes
      status
      season
      seasonYear
      studios(isMain: true) {
        nodes {
          name
        }
      }
      format
      type
    }
  }
}`;

export async function getPopularAnimeByGenre(
  genre: string,
  page: number = 1
): Promise<{ results: AnilistMedia[]; total: number }> {
  const res = await fetch(ANILIST_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: POPULAR_BY_GENRE_QUERY,
      variables: { page, type: "ANIME", genre },
    }),
  });

  if (!res.ok) throw new Error(`AniList API error: ${res.status}`);
  const data: AnilistSearchResponse = await res.json();

  return {
    results: data.data.Page.media,
    total: data.data.Page.pageInfo.total,
  };
}

const MEDIA_QUERY = `
query ($id: Int) {
  Media(id: $id, type: ANIME) {
    id
    title {
      romaji
      english
      native
    }
    description(asHtml: false)
    coverImage {
      large
      medium
    }
    averageScore
    genres
    episodes
    status
    season
    seasonYear
    studios(isMain: true) {
      nodes {
        name
      }
    }
    format
    type
  }
}`;

export async function getAnimeDetails(id: number): Promise<AnilistMedia> {
  const res = await fetch(ANILIST_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: MEDIA_QUERY,
      variables: { id },
    }),
  });

  if (!res.ok) throw new Error(`AniList API error: ${res.status}`);
  const data = await res.json();
  return data.data.Media;
}
