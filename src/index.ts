import express from "express";
import cors from "cors";
import { config } from "../config/index.js";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { characterRouter } from "./routes/characters.js";
import { promptRouter } from "./routes/prompts.js";
import { contentRouter } from "./routes/content.js";
import { instagramRouter } from "./routes/instagram.js";
import { calendarRouter } from "./routes/calendar.js";
import { fanvueRouter } from "./routes/fanvue.js";
import { analyticsRouter } from "./routes/analytics.js";
import { ugcRouter } from "./routes/ugc.js";
import { IMAGES_ROOT, VIDEOS_ROOT } from "./services/generation/providerUtils.js";

// Allows the production dashboard domain, any Vercel preview deployment for
// the same project (ai-influencer-c1g7-<branch/hash>-<team>.vercel.app —
// Vercel mints a new one per branch/commit), and local dev.
const ALLOWED_ORIGIN_PATTERNS = [/^https:\/\/ai-influencer-c1g7(-[\w-]+)?\.vercel\.app$/, /^http:\/\/localhost:3000$/];

const app = express();
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGIN_PATTERNS.some((pattern) => pattern.test(origin))) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

// Serves generated image/video files so the dashboard can render them
// directly (e.g. /media/images/{characterId}/{assetId}.png). Read-only,
// no directory listing — express.static only serves files that exist.
app.use("/media/images", express.static(IMAGES_ROOT));
app.use("/media/videos", express.static(VIDEOS_ROOT));

app.get("/health", (_req, res) => {
  res.json({ status: "ok", env: config.server.nodeEnv });
});

app.use("/api/characters", characterRouter);
app.use("/api/prompts", promptRouter);
app.use("/api/content", contentRouter);
app.use("/api/instagram", instagramRouter);
app.use("/api/calendar", calendarRouter);
app.use("/api/fanvue", fanvueRouter);
app.use("/api/analytics", analyticsRouter);
app.use("/api/ugc", ugcRouter);

app.use(errorHandler);

app.listen(config.server.port, () => {
  logger.info(`🚀 ai-influencer API listening on port ${config.server.port}`);
});
