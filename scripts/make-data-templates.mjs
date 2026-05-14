// Генерирует 5 шаблонов с предзаполненными данными из БД,
// чтобы Наира заполняла только недостающие поля.
//
// Запуск: node --env-file=.env.local scripts/make-data-templates.mjs

import { createClient } from "@supabase/supabase-js";
import XLSX from "xlsx";
import fs from "node:fs";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const OUT_DIR = "data-templates";
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR);

function writeWorkbook(name, sheets) {
  const wb = XLSX.utils.book_new();
  for (const { name: sheetName, rows, cols } of sheets) {
    const ws = XLSX.utils.aoa_to_sheet(rows);
    if (cols) ws["!cols"] = cols;
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }
  const path = `${OUT_DIR}/${name}`;
  XLSX.writeFile(wb, path);
  console.log(`✓ ${path}`);
}

// ============================================================
// 1. ШАБЛОН: расценки на артикулы без per-article ставки
// ============================================================
async function template1Rates() {
  const { data: articles } = await s
    .from("articles")
    .select("id, code, name, material")
    .order("code")
    .limit(2000);

  const { data: ratesRaw } = await s
    .from("rates")
    .select("article_id")
    .not("article_id", "is", null);
  const rated = new Set((ratesRaw ?? []).map((r) => r.article_id));

  const missing = articles.filter((a) => !rated.has(a.id));

  const header = [
    "Артикул",
    "Название",
    "Материал",
    "Литейка ₽/пара",
    "Обрезка ₽/пара (PACK)",
    "Упаковка с носком ₽/пара (PACK)",
    "Упаковка б/носка ₽/пара (PACK)",
    "Крой ₽/деталь",
    "Швейка ₽/операция",
    "Клеевой ₽/пара",
    "Обшив ₽/пара",
    "Маркировка ₽/пара",
    "Склад ₽/пара",
    "Комментарий",
  ];

  const rows = [header];
  for (const a of missing) {
    rows.push([a.code, a.name, a.material, "", "", "", "", "", "", "", "", "", "", ""]);
  }

  const instruction = [
    ["Шаблон расценок"],
    [`Артикулов без per-article расценок: ${missing.length}`],
    [""],
    ["Заполняйте только те колонки, которые действительно применимы к артикулу."],
    ["Пустая клетка = расценка не задана (будет считаться по общей ставке цеха)."],
    [""],
    ["Цеха:"],
    ["  Литейка (LIT)   — литьё"],
    ["  Упаковка (PACK) — обрезка, упаковка"],
    ["  Крой (CUT)      — раскрой текстиля"],
    ["  Швейка (SEW)    — пошив подкладок"],
    ["  Клеевой (GLU)   — вклейка"],
    ["  Обшив (ASSY)    — фурнитура"],
    ["  Маркировка (MARK) — логотип, ОТК"],
    ["  Склад (SHIP)    — упаковка для отгрузки"],
    [""],
    ["Можно заполнять группами: одинаковая ставка для одинаковых артикулов."],
    ["Можно копировать строки и вставлять — сохранится."],
  ];

  writeWorkbook("01-rates-missing.xlsx", [
    {
      name: "Инструкция",
      rows: instruction,
      cols: [{ wch: 70 }],
    },
    {
      name: "Расценки",
      rows,
      cols: [
        { wch: 14 }, // код
        { wch: 50 }, // название
        { wch: 12 }, // материал
        { wch: 12 }, // литейка
        { wch: 14 }, // обрезка
        { wch: 18 }, // упак с носком
        { wch: 18 }, // упак б/носка
        { wch: 14 }, // крой
        { wch: 16 }, // швейка
        { wch: 14 }, // клеевой
        { wch: 14 }, // обшив
        { wch: 14 }, // маркировка
        { wch: 14 }, // склад
        { wch: 30 }, // комментарий
      ],
    },
  ]);
}

// ============================================================
// 2. ШАБЛОН: нормы расхода материала на пару
// ============================================================
async function template2Norms() {
  const { data: articles } = await s
    .from("articles")
    .select("id, code, name, material, weight_per_pair")
    .order("code")
    .limit(2000);

  const { data: normsRaw } = await s.from("norms").select("article_id");
  const hasNorm = new Set((normsRaw ?? []).map((n) => n.article_id));

  const missing = articles.filter((a) => !hasNorm.has(a.id));

  const header = [
    "Артикул",
    "Название",
    "Материал артикула",
    "Вес пары (грамм)",
    "Расход ЭВА (кг/пара)",
    "Расход ПВХ (кг/пара)",
    "Расход силикона (кг/пара)",
    "Расход красителя (кг/пара)",
    "Расход меха (м²/пара)",
    "Расход флиса (м²/пара)",
    "Расход войлока (м²/пара)",
    "Расход заклёпок (шт/пара)",
    "Расход клея (кг/пара)",
    "Комментарий",
  ];

  const rows = [header];
  for (const a of missing) {
    rows.push([
      a.code,
      a.name,
      a.material,
      a.weight_per_pair ? Number(a.weight_per_pair) * 1000 : "",
      "", "", "", "", "", "", "", "", "", "",
    ]);
  }

  const instruction = [
    ["Шаблон норм расхода материалов на пару"],
    [`Артикулов без норм: ${missing.length}`],
    [""],
    ["Заполняй ТОЛЬКО те материалы, которые реально расходуются на этот артикул."],
    ["Если артикул из ЭВА — заполни 'Расход ЭВА' и пропусти ПВХ/силикон."],
    [""],
    ["Типичные значения (можно копировать):"],
    ["  Лёгкая обувь (галоши, сабо, кроксы): 0.25 кг ЭВА"],
    ["  Сапоги ЭВА средние:                  0.7 кг ЭВА"],
    ["  Сапоги ЭВА большие (с манжетом):     1.0 кг ЭВА"],
    ["  Сапоги ПВХ:                          0.8 кг ПВХ"],
    ["  Силиконовые:                         0.6 кг силикона"],
    [""],
    ["Колонка 'Вес пары (грамм)' — справочная (где есть), помогает прикинуть расход."],
    ["Можешь заполнять группами: одинаковые нормы для одинаковых артикулов."],
  ];

  writeWorkbook("02-norms-missing.xlsx", [
    {
      name: "Инструкция",
      rows: instruction,
      cols: [{ wch: 80 }],
    },
    {
      name: "Нормы",
      rows,
      cols: [
        { wch: 14 },
        { wch: 50 },
        { wch: 14 },
        { wch: 14 },
        { wch: 18 },
        { wch: 18 },
        { wch: 20 },
        { wch: 20 },
        { wch: 16 },
        { wch: 16 },
        { wch: 16 },
        { wch: 18 },
        { wch: 18 },
        { wch: 30 },
      ],
    },
  ]);
}

// ============================================================
// 3. ШАБЛОН: веса пар
// ============================================================
async function template3Weights() {
  const { data: articles } = await s
    .from("articles")
    .select("code, name, material, weight_per_pair")
    .order("code")
    .limit(2000);

  const missing = articles.filter((a) => !a.weight_per_pair);
  const present = articles.filter((a) => a.weight_per_pair);

  const header = ["Артикул", "Название", "Материал", "Вес пары (грамм)", "Комментарий"];

  const missingRows = [header];
  for (const a of missing) {
    missingRows.push([a.code, a.name, a.material, "", ""]);
  }

  const presentRows = [header];
  for (const a of present) {
    presentRows.push([a.code, a.name, a.material, Number(a.weight_per_pair) * 1000, ""]);
  }

  const instruction = [
    ["Шаблон средних весов пары"],
    [`Без веса: ${missing.length}, с весом: ${present.length}`],
    [""],
    ["Заполни вес пары в ГРАММАХ — система сама поделит на 1000 при загрузке."],
    [""],
    ["Зачем нужен вес:"],
    ["  — Сверка на складе (фактический вес партии vs ожидаемый)"],
    ["  — Расчёт стоимости упаковки и доставки"],
    [""],
    ["На листе 'Уже есть' — артикулы с известным весом для справки."],
  ];

  writeWorkbook("03-weights-missing.xlsx", [
    {
      name: "Инструкция",
      rows: instruction,
      cols: [{ wch: 70 }],
    },
    {
      name: "Заполнить",
      rows: missingRows,
      cols: [{ wch: 14 }, { wch: 50 }, { wch: 14 }, { wch: 18 }, { wch: 30 }],
    },
    {
      name: "Уже есть (справочно)",
      rows: presentRows,
      cols: [{ wch: 14 }, { wch: 50 }, { wch: 14 }, { wch: 18 }, { wch: 30 }],
    },
  ]);
}

// ============================================================
// 4. ШАБЛОН: должности и роли сотрудников
// ============================================================
async function template4Employees() {
  const { data: emps } = await s
    .from("employees")
    .select("tab_number, full_name, position, role, workshops:workshop_id(code, name)")
    .order("tab_number")
    .limit(2000);

  const header = [
    "Табельный №",
    "ФИО",
    "Цех (код)",
    "Цех (название)",
    "Должность",
    "Роль для входа в систему",
    "Email для входа (если будет логиниться)",
    "Комментарий",
  ];

  const allRows = [header];
  const missingRows = [header];

  for (const e of emps ?? []) {
    const row = [
      e.tab_number,
      e.full_name,
      e.workshops?.code ?? "",
      e.workshops?.name ?? "",
      e.position ?? "",
      e.role ?? "",
      "",
      "",
    ];
    allRows.push(row);
    if (!e.position) missingRows.push(row);
  }

  const instruction = [
    ["Шаблон должностей и ролей сотрудников"],
    [`Всего сотрудников: ${(emps ?? []).length}, без должности: ${missingRows.length - 1}`],
    [""],
    ["Колонка 'Должность' — свободный текст:"],
    ["  Литейщик, Швея, Грузчик, Маркировщик, Упаковщик, Технолог, Бухгалтер..."],
    [""],
    ["Колонка 'Роль для входа' — заполнять ТОЛЬКО для тех, кто реально будет"],
    ["заходить в систему. Допустимые значения (без кавычек):"],
    ["  foreman       — начальник цеха (открывает смены своего цеха)"],
    ["  technologist  — технолог (ведёт справочники, расценки, нормы)"],
    ["  director      — директор (дашборд, отчёты, без записи)"],
    ["  accountant    — бухгалтер (ЗП, выгрузка в 1С)"],
    ["  admin         — администратор (всё)"],
    [""],
    ["Колонка 'Email' — для тех, у кого роль заполнена. Удобнее обычная почта"],
    ["типа имя.фамилия@light-c.ru — придумаем пароли."],
    [""],
    ["Лист 'Без должности' — только те, кому надо проставить должность."],
    ["Лист 'Все' — полный список для справки."],
  ];

  writeWorkbook("04-employees-positions.xlsx", [
    {
      name: "Инструкция",
      rows: instruction,
      cols: [{ wch: 80 }],
    },
    {
      name: "Без должности",
      rows: missingRows,
      cols: [
        { wch: 12 },
        { wch: 40 },
        { wch: 10 },
        { wch: 18 },
        { wch: 30 },
        { wch: 22 },
        { wch: 30 },
        { wch: 30 },
      ],
    },
    {
      name: "Все сотрудники",
      rows: allRows,
      cols: [
        { wch: 12 },
        { wch: 40 },
        { wch: 10 },
        { wch: 18 },
        { wch: 30 },
        { wch: 22 },
        { wch: 30 },
        { wch: 30 },
      ],
    },
  ]);
}

// ============================================================
// 5. ШАБЛОН: остатки сырья и минимальные запасы
// ============================================================
async function template5Materials() {
  const { data: mats } = await s
    .from("materials")
    .select("code, name, unit, current_stock, min_stock")
    .order("code");

  const header = [
    "Код",
    "Название",
    "Ед. изм.",
    "Текущий остаток (факт)",
    "Минимальный запас (когда сигнализировать)",
    "Комментарий",
  ];

  const rows = [header];
  for (const m of mats ?? []) {
    rows.push([
      m.code,
      m.name,
      m.unit,
      m.current_stock ?? "",
      m.min_stock ?? "",
      "",
    ]);
  }

  const instruction = [
    ["Шаблон остатков материалов"],
    [`Материалов в БД: ${(mats ?? []).length}`],
    [""],
    ["Сейчас в БД тестовые цифры (5000 кг ЭВА и т.п.) — замени на реальные."],
    [""],
    ["'Текущий остаток' — сколько ФАКТИЧЕСКИ есть на складе сейчас."],
    ["'Минимальный запас' — порог, при котором подсветить материал как 'на исходе'."],
    [""],
    ["Единицы измерения уже зафиксированы:"],
    ["  кг   — для гранул ЭВА/ПВХ, силикона, красителей, клея"],
    ["  м²   — для меха, флиса, войлока"],
    ["  шт   — для заклёпок, пряжек"],
    [""],
    ["Если каких-то материалов в списке не хватает — допиши новые строки внизу"],
    ["(код придумай, например 'GLU-RUB' = резиновый клей)."],
  ];

  writeWorkbook("05-materials-stock.xlsx", [
    {
      name: "Инструкция",
      rows: instruction,
      cols: [{ wch: 80 }],
    },
    {
      name: "Остатки",
      rows,
      cols: [
        { wch: 12 },
        { wch: 40 },
        { wch: 10 },
        { wch: 22 },
        { wch: 36 },
        { wch: 30 },
      ],
    },
  ]);
}

// ============================================================
// 6. ШАБЛОН: машины по цехам (опционально)
// ============================================================
async function template6Machines() {
  const { data: ws } = await s
    .from("workshops")
    .select("code, name")
    .eq("is_active", true)
    .order("seq_order");

  const header = [
    "Цех (код)",
    "Цех (название)",
    "Машина (название)",
    "Тип/модель",
    "Серийный №",
    "Дата ввода в эксплуатацию",
    "Активна (да/нет)",
    "Комментарий",
  ];

  const rows = [header];
  // Предзаполняем известные на сегодня машины из MACHINE_OPTIONS
  const known = ["KCLKA 1", "KCLKA 2", "KCLKA 3", "Четвёрка", "Шестёрка", "Восьмёрка"];
  for (const m of known) {
    rows.push(["LIT", "Литейка", m, "", "", "", "да", ""]);
  }
  // Остальные цеха — пустые строки для заполнения
  for (const w of ws ?? []) {
    if (w.code === "LIT" || w.code === "ADM") continue;
    rows.push([w.code, w.name, "", "", "", "", "да", ""]);
  }

  const instruction = [
    ["Шаблон станков/машин (опционально)"],
    [""],
    ["Сейчас в форме выработки 'Машина' — это просто список из 6 опций."],
    ["Если хочешь полноценный учёт: какая машина в каком цехе, простои по машине,"],
    ["выработка по машине — заполни этот шаблон, и заведу справочник."],
    [""],
    ["Для Литейки уже подставлены 6 известных машин — добавь модель/серийник."],
    ["Для других цехов — допиши строки с реальным оборудованием."],
    [""],
    ["Можно пропустить — система работает и без отдельного справочника машин."],
  ];

  writeWorkbook("06-machines.xlsx", [
    {
      name: "Инструкция",
      rows: instruction,
      cols: [{ wch: 80 }],
    },
    {
      name: "Машины",
      rows,
      cols: [
        { wch: 10 },
        { wch: 18 },
        { wch: 16 },
        { wch: 20 },
        { wch: 18 },
        { wch: 22 },
        { wch: 14 },
        { wch: 30 },
      ],
    },
  ]);
}

async function main() {
  console.log("Генерация шаблонов в папку data-templates/\n");
  await template1Rates();
  await template2Norms();
  await template3Weights();
  await template4Employees();
  await template5Materials();
  await template6Machines();
  console.log("\nГотово.");
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
