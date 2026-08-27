import postgres from "postgres";
import { config } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { readFileSync } from "node:fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
// 加载项目根目录下的 .env
config({ path: join(__dirname, "..", ".env") });

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  ssl: { rejectUnauthorized: false },
});

const cols = await sql`
  SELECT column_name, data_type, udt_name, is_nullable, column_default
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'word'
  ORDER BY ordinal_position
`;
console.log("\n=== columns ===");
for (const c of cols) {
  console.log(`${c.column_name}\t${c.data_type}\t${c.udt_name}\tnullable=${c.is_nullable}\tdefault=${c.column_default}`);
}

const pks = await sql`
  SELECT a.attname, a.attnum
  FROM pg_index i
  JOIN pg_attribute a ON a.attrelid = i.indrelid AND a.attnum = ANY(i.indkey)
  WHERE i.indrelid = 'public.word'::regclass AND i.indisprimary
`;
console.log("\n=== primary key ===");
for (const p of pks) console.log(p.attname, p.attnum);

const fks = await sql`
  SELECT tc.constraint_name, kcu.column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
  JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
  WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = 'word'
`;
console.log("\n=== foreign keys ===");
for (const f of fks) console.log(f.column_name, "->", f.foreign_table, "(" + f.foreign_column + ")");

process.exit(0);