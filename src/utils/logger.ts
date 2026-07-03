import pino from "pino";
import { config } from "../../config/index.js";

/**
 * Central logger. Import this everywhere instead of console.log
 * (per project dev policy: all modules must emit structured logs).
 */
export const logger = pino({
  level: config.log.level,
  transport:
    config.server.nodeEnv === "development"
      ? { target: "pino-pretty", options: { colorize: true } }
      : undefined,
});
