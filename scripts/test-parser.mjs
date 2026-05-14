// Имитирует логику lib/services/imports.ts на локальном файле для отладки.
import * as XLSX from "xlsx";
import fs from "node:fs";
import path from "node:path";

const file = path.resolve(process.cwd(), "employees-template.xlsx");
const buf = fs.readFileSync(file);
const wb = XLSX.read(buf, { type: "buffer", cellDates: true });
const ws = wb.Sheets[wb.SheetNames[0]];
const rawRows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: true });

function normalize(s) {
  return String(s ?? "")
    .toLowerCase()
    .trim()
    .replace(/[ё]/g, "е")
    .replace(/[^а-яa-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

const rows = rawRows.map((r) => {
  const out = {};
  for (const [k, v] of Object.entries(r)) out[normalize(k)] = v;
  return out;
});

console.log("Нормализованные заголовки из первой строки:", Object.keys(rows[0]));
console.log("");
console.log("Первая строка:", JSON.stringify(rows[0], null, 2));
console.log("");
console.log("Последняя строка:", JSON.stringify(rows[rows.length - 1], null, 2));
console.log("");
console.log(`Всего строк: ${rows.length}`);
