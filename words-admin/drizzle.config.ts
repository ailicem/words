import "dotenv/config";
import type { Config } from "drizzle-kit";

// Supabase 直连(5432)需要 SSL，在读取 URL 时强制加上 sslmode，避免连接卡住
function databaseUrl() {
  const url = new URL(process.env.DATABASE_URL!);
  if (!url.searchParams.has("sslmode")) {
    url.searchParams.set("sslmode", "require");
  }
  return url.toString();
}

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: databaseUrl(),
  },
} satisfies Config;