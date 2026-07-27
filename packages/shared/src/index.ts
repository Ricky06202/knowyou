export type Category = "games" | "movies" | "series" | "anime" | "kdrama";

export interface UserTaste {
  genres: string[];
  liked: string[];
  disliked: string[];
  platforms?: string[];
  directors?: string[];
  actors?: string[];
  studios?: string[];
}

export interface UserProfile {
  games: UserTaste;
  movies: UserTaste;
  series: UserTaste;
  anime: UserTaste;
  kdrama: UserTaste;
}

export interface ContentItem {
  id: string;
  title: string;
  description: string;
  image?: string;
  rating?: number;
  genres: string[];
  year?: number;
  source: "rawg" | "tmdb" | "jikan" | "tvmaze";
  externalId: string;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface Recommendation {
  id: string;
  category: Category;
  content: ContentItem;
  score: number;
  reason: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}
