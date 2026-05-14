// Импортирует артикулы и сотрудников из XLSX через service_role (минует RLS).
// Запуск: node --env-file=.env.local scripts/import-data.mjs

import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";
import fs from "node:fs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function readSheet(file, sheetName) {
  if (!fs.existsSync(file)) {
    console.log(`  ⊘ файл ${file} не найден — пропускаю`);
    return null;
  }
  const wb = XLSX.readFile(file);
  const sheet = sheetName ? wb.Sheets[sheetName] : wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { defval: null });
}

async function importArticles() {
  console.log("\n== Артикулы ==");
  const rows = readSheet("articles-import.xlsx");
  if (!rows) return;

  const payload = [];
  for (const r of rows) {
    const code = String(r["Артикул"] ?? "").trim();
    if (!code) continue;
    payload.push({
      code,
      name: String(r["Наименование"] ?? "").trim(),
      material: String(r["Материал"] ?? "ЭВА").trim(),
      box_qty: Number(r["В коробке"]) || 1,
      size_min: r["Размер от"] ? Number(r["Размер от"]) : null,
      size_max: r["Размер до"] ? Number(r["Размер до"]) : null,
      wholesale_price: r["Цена оптовая"] ? Number(r["Цена оптовая"]) : null,
      is_active: true,
    });
  }
  console.log(`  → upsert ${payload.length} строк...`);
  const { error, count } = await supabase
    .from("articles")
    .upsert(payload, { onConflict: "code", count: "exact" });
  if (error) throw error;

  const { count: total } = await supabase
    .from("articles")
    .select("*", { count: "exact", head: true });
  console.log(`  ✓ всего артикулов в БД теперь: ${total}`);
}

async function importEmployees() {
  console.log("\n== Сотрудники ==");
  const rows = readSheet("employees-template.xlsx", "Работники");
  if (!rows) return;

  // Маппинг кодов цехов
  const { data: wsRaw } = await supabase.from("workshops").select("id, code");
  const codeToId = new Map((wsRaw ?? []).map((w) => [w.code, w.id]));

  const VALID_ROLES = new Set(["foreman", "technologist", "director", "accountant", "admin"]);
  const RU_ROLE_MAP = {
    "начальник цеха": "foreman",
    бригадир: "foreman",
    технолог: "technologist",
    директор: "director",
    бухгалтер: "accountant",
    администратор: "admin",
    админ: "admin",
  };

  const payload = [];
  for (const r of rows) {
    const tab = String(r["Табельный номер"] ?? "").trim();
    const name = String(r["ФИО"] ?? "").trim();
    if (!tab || !name) continue;
    const wsCode = String(r["Цех"] ?? "").trim().toUpperCase();
    const wsId = wsCode ? codeToId.get(wsCode) ?? null : null;
    const roleRaw = String(r["Роль"] ?? "").toLowerCase().trim();
    let role = null;
    if (roleRaw) {
      role = VALID_ROLES.has(roleRaw) ? roleRaw : RU_ROLE_MAP[roleRaw] ?? null;
    }
    const activeRaw = String(r["Активен"] ?? "да").toLowerCase().trim();
    const isActive = !["", "0", "нет", "no", "false"].includes(activeRaw);
    payload.push({
      tab_number: tab,
      full_name: name,
      workshop_id: wsId,
      position: r["Должность"] ? String(r["Должность"]).trim() : null,
      role,
      is_active: isActive,
      hire_date: null,
    });
  }
  console.log(`  → upsert ${payload.length} строк...`);
  const { error } = await supabase
    .from("employees")
    .upsert(payload, { onConflict: "tab_number" });
  if (error) throw error;

  const { count: total } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true });
  console.log(`  ✓ всего сотрудников в БД теперь: ${total}`);
}

async function main() {
  await importArticles();
  await importEmployees();
  console.log("\nГотово.");
}

main().catch((e) => {
  console.error("✗", e.message);
  if (e.details) console.error("  details:", e.details);
  process.exit(1);
});
