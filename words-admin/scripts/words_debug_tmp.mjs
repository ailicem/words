import "dotenv/config";
import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL, { ssl: { rejectUnauthorized: false } });

const r = await sql`
  select count(*)::int as total,
         max(id) as maxid,
         (select count(*)::int from words where "bookId"='PEPXiaoXue3_1') as b1,
         (select count(*)::int from words where "bookId"='PEPXiaoXue3_2') as b2
  from words
`;
const sample = await sql`select id, "wordRank", "headWord", "bookId" from words order by id limit 5`;
console.log(JSON.stringify(r, null, 2));
console.log("sample:", JSON.stringify(sample, null, 2));
await sql.end();