import "dotenv/config";
import { z } from "zod";

/**
 * All environment/config values must be read through this module —
 * never call process.env directly elsewhere (per project dev policy).
 */

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().int().positive().default(4000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),

  IG_APP_ID: z.string().optional(),
  IG_APP_SECRET: z.string().optional(),
  IG_ACCESS_TOKEN: z.string().optional(),
  IG_BUSINESS_ACCOUNT_ID: z.string().optional(),

  IMAGE_GEN_API_KEY: z.string().optional(),
  VIDEO_GEN_API_KEY: z.string().optional(),
  IMAGE_GEN_PROVIDER: z.enum(["local-stub", "stability", "openai", "nano-banana"]).default("local-stub"),
  VIDEO_GEN_PROVIDER: z.enum(["local-stub", "runway", "seedance"]).default("local-stub"),

  FANVUE_ACCOUNT_EMAIL: z.string().optional(),
  FANVUE_PROFILE_URL: z.string().optional(),
  ANALYTICS_WEBHOOK_SECRET: z.string().optional(),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error("❌ Invalid environment configuration:", parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment configuration. Check .env against .env.example.");
}

export const config = {
  db: {
    url: parsed.data.DATABASE_URL,
  },
  server: {
    port: parsed.data.PORT,
    nodeEnv: parsed.data.NODE_ENV,
  },
  log: {
    level: parsed.data.LOG_LEVEL,
  },
  instagram: {
    appId: parsed.data.IG_APP_ID,
    appSecret: parsed.data.IG_APP_SECRET,
    accessToken: parsed.data.IG_ACCESS_TOKEN,
    businessAccountId: parsed.data.IG_BUSINESS_ACCOUNT_ID,
    isConfigured: Boolean(parsed.data.IG_ACCESS_TOKEN && parsed.data.IG_BUSINESS_ACCOUNT_ID),
  },
  generation: {
    imageGenApiKey: parsed.data.IMAGE_GEN_API_KEY,
    videoGenApiKey: parsed.data.VIDEO_GEN_API_KEY,
    imageProvider: parsed.data.IMAGE_GEN_PROVIDER,
    videoProvider: parsed.data.VIDEO_GEN_PROVIDER,
  },
  fanvue: {
    accountEmail: parsed.data.FANVUE_ACCOUNT_EMAIL,
    profileUrl: parsed.data.FANVUE_PROFILE_URL ?? "https://www.fanvue.com/maria_intoronto",
  },
  analytics: {
    webhookSecret: parsed.data.ANALYTICS_WEBHOOK_SECRET,
  },

  /** Fixed daily output targets (Phase2/3/4 requirements) */
  targets: {
    imagesPerDay: 20,
    reelsPerDay: 3,
    storiesPerDay: 5,
  },
} as const;

export type AppConfig = typeof config;
