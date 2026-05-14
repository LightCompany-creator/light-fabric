// Импорт справочников из 1С через XLSX.
// Workflow: parseXxxxXlsx → ImportResult с rows + ошибками + dry-run summary.
// Затем applyXxxxxImport — реальная запись в БД и журнал sync_log.

import * as XLSX from "xlsx";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type RowIssue = { rowIndex: number; field?: string; message: string };

export type ImportPreview<T> = {
  total: number;
  valid: T[];
  errors: RowIssue[];
};

// Преобразует строки заголовков в нормализованные ключи
function normalize(s: unknown): string {
  return String(s ?? "")
    .toLowerCase()
    .trim()
    .replace(/[ё]/g, "е")
    .replace(/[^а-яa-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function readSheet(buffer: ArrayBuffer): Record<string, unknown>[] {
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
    defval: null,
    raw: true,
  });
  // Нормализуем ключи (русские заголовки → snake_case)
  return raw.map((r) => {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(r)) out[normalize(k)] = v;
    return out;
  });
}

// =============================================================
// Employees
// =============================================================

export type EmployeeImportRow = {
  tab_number: string;
  full_name: string;
  workshop_code: string | null;
  position: string | null;
  role: "foreman" | "technologist" | "director" | "accountant" | "admin" | null;
  is_active: boolean;
  hire_date: string | null;
};

// Все ключи в нижнем регистре и snake_case — это нормализованные заголовки
// (см. normalize() выше: spaces/ё/punct → _, ё → е, lower).
// Поддерживаем русские, английские и транслитерированные варианты.
const TAB_KEYS = [
  "tab_number", "tab", "tab_no", "tab_n",
  "табельный_номер", "табельный", "таб_номер", "таб",
  "tabelnyy_nomer", "tabelny_nomer", "tabelnyi_nomer", "n_tab",
];
const NAME_KEYS = [
  "full_name", "name",
  "фио", "ф_и_о", "имя", "полное_имя",
  "fio", "f_i_o", "imya", "polnoe_imya",
];
const WS_KEYS = [
  "workshop_code", "workshop", "workshop_id",
  "цех", "цех_код", "код_цеха",
  "tseh", "cech", "tseh_kod",
];
const POS_KEYS = [
  "position",
  "должность",
  "doljnost", "dolzhnost",
];
const ROLE_KEYS = ["role", "роль", "rol"];
const ACTIVE_KEYS = [
  "is_active", "active",
  "активен", "работает", "действует",
  "aktiven", "rabotaet",
];
const HIRE_KEYS = [
  "hire_date",
  "дата_приема", "дата_приёма", "принят",
  "data_priema", "data_priema_na_rabotu",
];

function pickFirst(row: Record<string, unknown>, keys: string[]): unknown {
  for (const k of keys) if (k in row && row[k] !== null && row[k] !== "") return row[k];
  return null;
}

function toBool(v: unknown): boolean {
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v !== 0;
  const s = String(v ?? "").toLowerCase().trim();
  return !["", "0", "нет", "no", "false", "n", "off"].includes(s);
}

function toDate(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    // Excel serial date
    const d = XLSX.SSF.parse_date_code(v);
    if (!d) return null;
    const y = String(d.y).padStart(4, "0");
    const m = String(d.m).padStart(2, "0");
    const day = String(d.d).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  const s = String(v).trim();
  if (!s) return null;
  // ISO?
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  // dd.mm.yyyy
  const m = s.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (m) {
    let y = m[3];
    if (y.length === 2) y = (Number(y) > 50 ? "19" : "20") + y;
    return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return null;
}

const VALID_ROLES = new Set([
  "foreman",
  "technologist",
  "director",
  "accountant",
  "admin",
]);

const RU_ROLE_MAP: Record<string, EmployeeImportRow["role"]> = {
  "начальник цеха": "foreman",
  начцеха: "foreman",
  бригадир: "foreman", // обратная совместимость
  технолог: "technologist",
  директор: "director",
  бухгалтер: "accountant",
  администратор: "admin",
  админ: "admin",
};

export function parseEmployeesXlsx(buffer: ArrayBuffer): ImportPreview<EmployeeImportRow> {
  const rows = readSheet(buffer);
  const errors: RowIssue[] = [];
  const valid: EmployeeImportRow[] = [];

  rows.forEach((r, i) => {
    const idx = i + 2; // строка в Excel (1-based + заголовок)
    const tab = String(pickFirst(r, TAB_KEYS) ?? "").trim();
    const name = String(pickFirst(r, NAME_KEYS) ?? "").trim();
    if (!tab) {
      errors.push({ rowIndex: idx, field: "tab_number", message: "Пустой табельный номер" });
      return;
    }
    if (!name) {
      errors.push({ rowIndex: idx, field: "full_name", message: "Пустое ФИО" });
      return;
    }
    const wsCode = pickFirst(r, WS_KEYS);
    const rawRole = String(pickFirst(r, ROLE_KEYS) ?? "").toLowerCase().trim();
    let role: EmployeeImportRow["role"] = null;
    if (rawRole) {
      if (VALID_ROLES.has(rawRole)) role = rawRole as EmployeeImportRow["role"];
      else if (RU_ROLE_MAP[rawRole]) role = RU_ROLE_MAP[rawRole];
      else {
        errors.push({ rowIndex: idx, field: "role", message: `Неизвестная роль: ${rawRole}` });
        return;
      }
    }

    const activeRaw = pickFirst(r, ACTIVE_KEYS);
    valid.push({
      tab_number: tab,
      full_name: name,
      workshop_code: wsCode ? String(wsCode).trim().toUpperCase() : null,
      position: pickFirst(r, POS_KEYS) ? String(pickFirst(r, POS_KEYS)).trim() : null,
      role,
      is_active: activeRaw === null ? true : toBool(activeRaw),
      hire_date: toDate(pickFirst(r, HIRE_KEYS)),
    });
  });

  return { total: rows.length, valid, errors };
}

export type ApplyResult = {
  inserted: number;
  updated: number;
  failed: number;
  firstError: string | null;
};

// Распознаём типовую ошибку RLS, чтобы дать понятную подсказку в UI.
function describeError(message: string): string {
  if (/row-level security|new row violates row-level security|policy/i.test(message)) {
    return `${message}. Похоже, у вашей роли нет прав на запись в эту таблицу — войдите как технолог или администратор.`;
  }
  return message;
}

export async function applyEmployeesImport(
  client: SupabaseClient<Database>,
  rows: EmployeeImportRow[],
): Promise<ApplyResult> {
  // Получаем maps workshops code → id
  const { data: wsRaw } = await client.from("workshops").select("id, code");
  const codeToId = new Map<string, string>();
  for (const w of (wsRaw ?? []) as { id: string; code: string }[]) {
    codeToId.set(w.code, w.id);
  }

  // Кто уже есть
  const { data: existingRaw } = await client.from("employees").select("tab_number");
  const existing = new Set<string>(
    ((existingRaw ?? []) as { tab_number: string }[]).map((e) => e.tab_number),
  );

  let inserted = 0;
  let updated = 0;
  let failed = 0;
  let firstError: string | null = null;

  for (const r of rows) {
    const workshopId = r.workshop_code ? codeToId.get(r.workshop_code) ?? null : null;
    const payload = {
      tab_number: r.tab_number,
      full_name: r.full_name,
      workshop_id: workshopId,
      position: r.position,
      role: r.role,
      is_active: r.is_active,
      hire_date: r.hire_date,
    };
    const { error } = await client
      .from("employees")
      .upsert(payload as never, { onConflict: "tab_number" });
    if (error) {
      failed += 1;
      if (!firstError) firstError = describeError(error.message);
    } else if (existing.has(r.tab_number)) {
      updated += 1;
    } else {
      inserted += 1;
    }
  }

  await client.from("sync_log").insert({
    sync_type: "import_employees",
    direction: "from_1c",
    status: failed === 0 ? "success" : "partial",
    records_count: rows.length,
    errors_count: failed,
    details: { inserted, updated, failed, firstError } as never,
  } as never);

  return { inserted, updated, failed, firstError };
}

// =============================================================
// Articles
// =============================================================

export type ArticleImportRow = {
  code: string;
  name: string;
  material: "ЭВА" | "ПВХ" | "силикон" | "текстиль" | "фурнитура" | "прочее";
  box_qty: number;
  size_min: number | null;
  size_max: number | null;
  wholesale_price: number | null;
};

const CODE_KEYS = ["code", "артикул", "код", "kod", "artikul"];
const ART_NAME_KEYS = ["name", "наименование", "название", "имя", "naimenovanie", "imya"];
const MATERIAL_KEYS = ["material", "материал"];
const BOX_KEYS = ["box_qty", "в_коробке", "пар_в_коробке", "v_korobke", "kor", "v_kor"];
const SIZE_MIN_KEYS = ["size_min", "размер_от", "razmer_ot", "ot"];
const SIZE_MAX_KEYS = ["size_max", "размер_до", "razmer_do", "do"];
const PRICE_KEYS = ["wholesale_price", "цена_оптовая", "опт_цена", "цена", "tsena_optovaya", "opt_tsena", "opt", "price"];

const VALID_MATERIALS = new Set([
  "ЭВА",
  "ПВХ",
  "силикон",
  "текстиль",
  "фурнитура",
  "прочее",
]);

function toInt(v: unknown): number | null {
  if (v === null || v === "" || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function toNum(v: unknown): number | null {
  if (v === null || v === "" || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function parseArticlesXlsx(buffer: ArrayBuffer): ImportPreview<ArticleImportRow> {
  const rows = readSheet(buffer);
  const errors: RowIssue[] = [];
  const valid: ArticleImportRow[] = [];

  rows.forEach((r, i) => {
    const idx = i + 2;
    const code = String(pickFirst(r, CODE_KEYS) ?? "").trim();
    const name = String(pickFirst(r, ART_NAME_KEYS) ?? "").trim();
    const material = String(pickFirst(r, MATERIAL_KEYS) ?? "").trim();
    if (!code) {
      errors.push({ rowIndex: idx, field: "code", message: "Пустой код" });
      return;
    }
    if (!name) {
      errors.push({ rowIndex: idx, field: "name", message: "Пустое название" });
      return;
    }
    if (!VALID_MATERIALS.has(material)) {
      errors.push({
        rowIndex: idx,
        field: "material",
        message: `Материал должен быть один из: ЭВА, ПВХ, силикон, текстиль, фурнитура, прочее (а пришло: "${material}")`,
      });
      return;
    }
    const box = toInt(pickFirst(r, BOX_KEYS));
    if (!box || box < 1) {
      errors.push({
        rowIndex: idx,
        field: "box_qty",
        message: "Пар в коробке должно быть числом ≥ 1",
      });
      return;
    }

    valid.push({
      code,
      name,
      material: material as ArticleImportRow["material"],
      box_qty: box,
      size_min: toInt(pickFirst(r, SIZE_MIN_KEYS)),
      size_max: toInt(pickFirst(r, SIZE_MAX_KEYS)),
      wholesale_price: toNum(pickFirst(r, PRICE_KEYS)),
    });
  });

  return { total: rows.length, valid, errors };
}

export async function applyArticlesImport(
  client: SupabaseClient<Database>,
  rows: ArticleImportRow[],
): Promise<ApplyResult> {
  const { data: existingRaw } = await client.from("articles").select("code");
  const existing = new Set<string>(
    ((existingRaw ?? []) as { code: string }[]).map((a) => a.code),
  );

  let inserted = 0;
  let updated = 0;
  let failed = 0;
  let firstError: string | null = null;

  for (const r of rows) {
    const payload = {
      code: r.code,
      name: r.name,
      material: r.material,
      box_qty: r.box_qty,
      size_min: r.size_min,
      size_max: r.size_max,
      wholesale_price: r.wholesale_price,
    };
    const { error } = await client
      .from("articles")
      .upsert(payload as never, { onConflict: "code" });
    if (error) {
      failed += 1;
      if (!firstError) firstError = describeError(error.message);
    } else if (existing.has(r.code)) {
      updated += 1;
    } else {
      inserted += 1;
    }
  }

  await client.from("sync_log").insert({
    sync_type: "import_articles",
    direction: "from_1c",
    status: failed === 0 ? "success" : "partial",
    records_count: rows.length,
    errors_count: failed,
    details: { inserted, updated, failed, firstError } as never,
  } as never);

  return { inserted, updated, failed, firstError };
}
