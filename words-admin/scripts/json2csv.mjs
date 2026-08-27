import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const INPUT = process.argv[2]
  ? join(process.cwd(), process.argv[2])
  : join(__dirname, "..", "temp", "PEPXiaoXue3_1.json");

// CSV 单元格转义：必要时加引号，内部引号翻倍
function cell(value) {
  const s = value == null ? "" : String(value);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows) {
  return rows
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}

const raw = readFileSync(INPUT, "utf8").trim();
// 文件是多个多行 JSON 对象拼接而成，通过对象间的分界标记("}\n{")拼接为数组
const records = JSON.parse(
  `[${raw.replace(/}\s*\n\s*{/g, "},{")}]`
);

const rows = [
  ["wordRank", "headWord", "content", "bookId"],
  ...records.map((r) => [
    r.wordRank,
    r.headWord,
    JSON.stringify(r.content), // content 以 JSON 字符串保存
    r.bookId,
  ]),
];

const outPath = INPUT.replace(/\.json$/i, ".csv");
writeFileSync(outPath, toCsv(rows), "utf8");

console.log(`已转换 ${records.length} 条记录 -> ${outPath}`);