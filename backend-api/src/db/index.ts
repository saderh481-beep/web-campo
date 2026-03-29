import postgres from "postgres";
import { config } from "../config/env";

export const sql = postgres(config.database.url, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});
