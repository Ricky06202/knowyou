import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  smallint,
  jsonb,
  real,
  foreignKey,
  index,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    refreshToken: text("refresh_token").notNull(),
    userAgent: text("user_agent"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("sessions_user_id_idx").on(table.userId)]
);

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" })
    .unique(),
  games: jsonb("games").$type<{
    genres: string[];
    liked: string[];
    disliked: string[];
    platforms: string[];
  }>().default({ genres: [], liked: [], disliked: [], platforms: [] }),
  movies: jsonb("movies").$type<{
    genres: string[];
    liked: string[];
    disliked: string[];
    directors: string[];
    actors: string[];
  }>().default({ genres: [], liked: [], disliked: [], directors: [], actors: [] }),
  series: jsonb("series").$type<{
    genres: string[];
    liked: string[];
    disliked: string[];
  }>().default({ genres: [], liked: [], disliked: [] }),
  anime: jsonb("anime").$type<{
    genres: string[];
    liked: string[];
    disliked: string[];
    studios: string[];
  }>().default({ genres: [], liked: [], disliked: [], studios: [] }),
  kdrama: jsonb("kdrama").$type<{
    genres: string[];
    liked: string[];
    disliked: string[];
  }>().default({ genres: [], liked: [], disliked: [] }),
  tasteVector: jsonb("taste_vector").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatHistory = pgTable(
  "chat_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).notNull(),
    content: text("content").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("chat_history_user_id_idx").on(table.userId)]
);

export const recommendations = pgTable(
  "recommendations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 50 }).notNull(),
    externalId: varchar("external_id", { length: 255 }).notNull(),
    source: varchar("source", { length: 50 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    data: jsonb("data"),
    score: real("score"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("recommendations_user_id_idx").on(table.userId)]
);

export const userFeedback = pgTable(
  "user_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    recommendationId: uuid("recommendation_id")
      .notNull()
      .references(() => recommendations.id, { onDelete: "cascade" }),
    rating: smallint("rating"),
    feedback: varchar("feedback", { length: 50 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("user_feedback_user_id_idx").on(table.userId)]
);

export const userLibrary = pgTable(
  "user_library",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: varchar("category", { length: 50 }).notNull(),
    externalId: varchar("external_id", { length: 255 }).notNull(),
    source: varchar("source", { length: 50 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    image: text("image"),
    genres: jsonb("genres").$type<string[]>().default([]),
    status: varchar("status", { length: 50 }).notNull().default("queued"),
    progress: smallint("progress"),
    totalEpisodes: smallint("total_episodes"),
    hoursPlayed: real("hours_played"),
    rating: smallint("rating"),
    data: jsonb("data"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("user_library_user_id_idx").on(table.userId),
    index("user_library_category_idx").on(table.category),
  ]
);

export const contentCache = pgTable("content_cache", {
  id: uuid("id").primaryKey().defaultRandom(),
  source: varchar("source", { length: 50 }).notNull(),
  externalId: varchar("external_id", { length: 255 }).notNull(),
  data: jsonb("data").notNull(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).defaultNow().notNull(),
});
