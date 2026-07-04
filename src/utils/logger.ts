import pino from "pino";
import { config } from "../../config/index.js";

/**
 * Central logger. Import this everywhere instead of console.log
 * (per project dev policy: all modules must emit structured logs).
 */
const isDev = config.server.nodeEnv === "development";

export const logger = isDev
  ? pino({
      level: config.log.level,
      transport: { target: "pino-pretty", options: { colorize: true } },
    })
  : pino({
      level: config.log.level,
    });
