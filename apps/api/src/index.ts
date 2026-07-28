import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import auth from "./routes/auth";
import profile from "./routes/profile";
import search from "./routes/search";
import chat from "./routes/chat";
import library from "./routes/library";
import recommend from "./routes/recommend";
import trending from "./routes/trending";
import recommendations from "./routes/recommendations";

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:5173", "http://localhost:1420"],
    credentials: true,
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

app.get("/", (c) =>
  c.json({
    name: "KnowYou API",
    version: "0.1.0",
    status: "running",
  })
);

app.get("/health", (c) => c.json({ status: "ok", timestamp: new Date().toISOString() }));

app.route("/api/auth", auth);
app.route("/api/profile", profile);
app.route("/api/search", search);
app.route("/api/chat", chat);
app.route("/api/library", library);
app.route("/api/recommend", recommend);
app.route("/api/trending", trending);
app.route("/api/recommendations", recommendations);

app.get("/api/download", async (c) => {
  const apkPath = process.env.APK_PATH || "/data/knowyou.apk";
  try {
    const file = Bun.file(apkPath);
    if (!await file.exists()) return c.json({ error: "APK not found" }, 404);
    return new Response(file, {
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": 'attachment; filename="KnowYou.apk"',
      },
    });
  } catch {
    return c.json({ error: "APK not available" }, 404);
  }
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((err, c) => {
  console.error("Unhandled error:", err);
  return c.json({ error: "Internal server error" }, 500);
});

const port = Number(process.env.PORT) || 3001;

Bun.serve({
  fetch: app.fetch,
  port,
  idleTimeout: 60,
});

console.log(`KnowYou API running on http://localhost:${port}`);
