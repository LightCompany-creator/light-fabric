// Читает employees-template.xlsx и выводит все строки листа «Работники».
// Запуск: node scripts/read-employees-template.mjs

import * as XLSX from "xlsx";
import path from "node:path";
import fs from "node:fs";

const filePath = path.resolve(process.cwd(), "employees-template.xlsx");
const buf = fs.readFileSync(filePath);
const wb = XLSX.read(buf, { type: "buffer", cellDates: true });

console.log("Листы в файле:", wb.SheetNames);
console.log("");

for (const sheetName of wb.SheetNames) {
  const ws = wb.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: null, raw: false });
  console.log(`════════════ Лист: «${sheetName}» (${rows.length} строк) ════════════`);
  if (rows.length === 0) {
    console.log("(пусто)");
  } else {
    console.log(JSON.stringify(rows, null, 2));
  }
  console.log("");
}
