import "server-only";
import { attachDatabasePool } from "@vercel/functions";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { boardPool?: Pool };

function pool() {
  if (!globalForDb.boardPool) {
    const connectionString = process.env["DATABASE_URL"];
    if (!connectionString) throw new Error("Save service is unavailable.");
    globalForDb.boardPool = new Pool({ connectionString, max: 5 });
    attachDatabasePool(globalForDb.boardPool);
  }
  return globalForDb.boardPool;
}

export const db = () => drizzle(pool(), { schema });
