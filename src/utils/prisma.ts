import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

/**
 * Singleton Prisma client. Avoids exhausting SQLite connections when
 * services import this module repeatedly (especially under tsx watch).
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  globalThis.__prisma ??
  new PrismaClient({
    log: [
      { emit: "event", level: "warn" },
      { emit: "event", level: "error" },
    ],
  });

prisma.$on("warn" as never, (e: unknown) => logger.warn({ e }, "Prisma warning"));
prisma.$on("error" as never, (e: unknown) => logger.error({ e }, "Prisma error"));

if (process.env["NODE_ENV"] !== "production") {
  globalThis.__prisma = prisma;
}
