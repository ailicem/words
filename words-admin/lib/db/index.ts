import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

// Supabase Postgres 连接（通过连接池 pooler + pgbouncer）。
// 仅在服务端使用，避免在浏览器端暴露数据库凭据。
const connectionString = process.env.DATABASE_URL!;

const client = postgres(connectionString, {
  max: 1,
  // Supabase 连接池使用 SSL/TLS
  ssl: { rejectUnauthorized: false },
});

export const db = drizzle(client, { schema });