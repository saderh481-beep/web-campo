import "dotenv/config";
import { config } from "./config/env";
import { logger } from "./lib/logger";
import app from "./app";

logger.info(`[api-app] Escuchando en http://0.0.0.0:${config.server.port}`);

export default {
  port: config.server.port,
  fetch: app.fetch,
};
