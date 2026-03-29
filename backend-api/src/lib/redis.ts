import { Redis } from "ioredis";
import { config } from "../config/env";
import { logger } from "./logger";

const url = config.server.isProduction
  ? config.redis.url
  : (config.redis.publicUrl ?? config.redis.url);

export const redis = new Redis(url, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
});

redis.on("error", (err) => {
  logger.error("Redis connection error", {
    error: err.message,
  });
});
