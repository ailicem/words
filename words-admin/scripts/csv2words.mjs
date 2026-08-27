import "dotenv/config";
import postgres from "postgres";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const sql = postgres(process.env.DATABASE_URL, {
  ssl: { rejectUnauthorized: false },
});

// 简易 RFC4180 CSV 解析：支持引号包裹、内部引号""转义、逗号与换行
function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += c;
        i++;
      }
    } else if (c === '"') {
      inQuotes = true;
      i++;
    } else if (c === ",") {
      row.push(field);
      field = "";
      i++;
    } else if (c === "\n" || c === "\r") {
      if (field !== "" || row.length > 0) {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }
      if (c === "\r" && text[i + 1] === "\n") i += 2;
      else i++;
    } else {
      field += c;
      i++;
    }
  }
  // 末行（无换行结尾）
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function importFile(filePath, perBatch = 200) {
  const rows = parseCsv(readFileSync(filePath, "utf8"));
  const [header, ...data] = rows;
  if (!header) {
    console.log(`跳过（空文件）: ${filePath}`);
    return 0;
  }
  // 列顺序: wordRank, headWord, content, bookId
  const values = [];
  for (let idx = 0; idx < data.length; idx++) {
    const r = data[idx];
    const bookId = (r[3] ?? "").trim();
    if (!bookId) continue;
    let content;
    try {
      content = r[2] ? JSON.parse(r[2]) : null;
    } catch (e) {
      console.error(`第 ${idx + 2} 行 content 解析失败:`, e.message);
      process.exitCode = 1;
      throw e;
    }
    values.push({
      wordRank: r[0] === "" || r[0] == null ? null : Number(r[0]),
      headWord: r[1] ?? "",
      // 转为 JSON 字符串存储，交给 pg json 列，避免多余的深层序列化
      content: JSON.stringify(content),
      bookId,
    });
  }

  let inserted = 0;
  // 先清理该文件中涉及 bookId 的旧数据，保证可重复导入且不产生重复
  const bookIds = [...new Set(values.map((v) => v.bookId))];
  for (const bk of bookIds) {
    await sql`delete from words where "bookId" = ${bk}`;
  }
  // 逐行插入：内容为 JSON 字符串，交由 pg json 列隐式转换
  for (const v of values) {
    await sql`insert into words ("wordRank", "headWord", content, "bookId") values (${v.wordRank}, ${v.headWord}, ${v.content}, ${v.bookId})`;
    inserted++;
  }
  console.log(`已导入 ${inserted} 条 -> ${filePath}`);
  return inserted;
}

const args = process.argv.slice(2);
const files =
  args.length > 0
    ? args
    : [
        resolve(process.cwd(), join("temp", "PEPXiaoXue3_1.csv")),
        resolve(process.cwd(), join("temp", "PEPXiaoXue3_2.csv")),
      ];

let total = 0;
try {
  for (const f of files) {
    total += await importFile(f);
  }
  console.log(`全部完成，共导入 ${total} 条单词`);
} catch (err) {
  console.error("导入失败:", err);
  process.exitCode = 1;
} finally {
  await sql.end();
}