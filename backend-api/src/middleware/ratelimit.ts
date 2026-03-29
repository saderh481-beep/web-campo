import { redis } from "@/lib/redis";
import { config } from "../config/env";
import type { Context, Next } from "hono";

export async function rateLimit(c: Context, next: Next, max = config.rateLimit.maxRequests, windowSecs = config.rateLimit.windowMs / 1000) {
  const ip = c.req.header("x-forwarded-for") ?? "unknown";
  const route = new URL(c.req.url).pathname;
  const key = `rl:${ip}:${route}`;

  const count = await redis.incr(key);
  if (count === 1) await redis.expire(key, windowSecs);

  if (count > max) {
    return c.json({ error: "Demasiadas solicitudes, intenta más tarde" }, 429);
  }
  return next();
}

export function rateLimitMiddleware(max = config.rateLimit.maxRequests, windowSecs = config.rateLimit.windowMs / 1000) {
  return (c: Context, next: Next) => rateLimit(c, next, max, windowSecs);
}
