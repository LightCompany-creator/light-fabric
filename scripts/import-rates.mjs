// Заливает расценки по цехам и операциям из рукописных таблиц ЭВА и ПВХ.
// Запуск: node --env-file=.env.local scripts/import-rates.mjs
//
// Маппинг колонок таблицы → цех + операция:
//   "Литейка"        → LIT, operation=null
//   "Обрезка"        → PACK, operation="обрезка"
//   "Упаковка с носком"  → PACK, operation="упаковка с носком"
//   "Упаковка б/носка"   → PACK, operation="упаковка без носка"
// Все ставки в рублях за пару.

import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// Группы расценок: codes — список артикулов, rates — ставки по операциям.
// Если ставка для операции = null, запись не создаётся.
const GROUPS = [
  // ===== ЭВА =====
  {
    label: "ЭВА · Галоши Сабо",
    codes: ["022","023","044","127","129","901","902","903","905","906","907","908","909","3022","3023","4022","4023","С-044","130","315","944","922","923","6023"],
    rates: { lit: 4.5, trim: 1.8, packWithSock: 1.9, packNoSock: 1.9 },
  },
  {
    label: "ЭВА · Сапоги Цельнолитые Мужск.",
    codes: ["112","184","220","412","А-100","АВ-300","113","310"],
    rates: { lit: 11.5, trim: 4.5, packWithSock: 4.2, packNoSock: 3.6 },
  },
  {
    label: "ЭВА · Сапоги Цельнолитые Женск./Детск.",
    codes: ["027","048","221","026","811","АВ-310"],
    rates: { lit: 8, trim: 3.5, packWithSock: 2.9, packNoSock: 2.3 },
  },
  {
    label: "ЭВА · женская упаковка (221) — переопределение",
    codes: ["221"],
    rates: { packWithSock: 3.5, packNoSock: 3 },
  },
  {
    label: "ЭВА · Кроксы 849/859",
    codes: ["849","859"],
    rates: { lit: 6, trim: 6, packNoSock: 2.6 },
  },
  {
    label: "ЭВА · Кроксы 149-160 серия",
    codes: ["149","149у","159","159у","160","703","704","752","1043","1033"],
    rates: { lit: 4.5, trim: 6, packNoSock: 2.6 },
  },
  {
    label: "ЭВА · Кроксы Двойная пенка",
    codes: ["702","705","751","753","770","771","772","177","1037","179"],
    rates: { lit: 9, trim: 6, packNoSock: 2.6 },
  },
  {
    label: "ЭВА · Пенка лето с камнями",
    codes: ["1004","1020","1022"],
    rates: { lit: 3.5, trim: 2.3, packNoSock: 2.3 },
  },
  {
    label: "ЭВА · Пенка лето мужск.",
    codes: ["007","071","072","073","076","077","137","141","222","657","1010","1024","1025","1026","1030","1031","1032","223","1047"],
    rates: { lit: 3.5, trim: 2, packNoSock: 1.5 },
  },
  {
    label: "ЭВА · Упаковка 1030/1031/1032 — переопределение",
    codes: ["1030","1031","1032"],
    rates: { packNoSock: 2.6 },
  },
  {
    label: "ЭВА · Пенка лето Женская",
    codes: ["020","142","145","157","180","650","651","652","653","1021","1023","1027","1028","1029","1034","1036","1037","1038"],
    rates: { lit: 3.5, trim: 2, packNoSock: 1.5 },
  },
  {
    label: "ЭВА · Упаковка 1027/1028/1029/1034/1036/1037 — переопределение",
    codes: ["1027","1028","1029","1034","1036","1037"],
    rates: { packNoSock: 2.6 },
  },
  {
    label: "ЭВА · Пенка лето Детские",
    codes: ["019","140","163","164","165","663","664","665","1005","1006","1035","655","161"],
    rates: { lit: 3.5, trim: 2, packNoSock: 1.5 },
  },
  {
    label: "ЭВА · Упаковка 1035 — переопределение",
    codes: ["1035"],
    rates: { packNoSock: 2.6 },
  },

  // ===== ПВХ =====
  {
    label: "ПВХ · Сапоги",
    codes: ["038","039","042","046","061","063","064","065"],
    rates: { lit: 10.30, trim: 3.20, packWithSock: 2.60, packNoSock: 2.30 },
  },
  {
    label: "ПВХ · 080-086 (перешив, новые ставки)",
    codes: ["080","081","082","085","086"],
    rates: { lit: 8, trim: 2.8, packWithSock: 2.30, packNoSock: 2.00 },
  },
  {
    label: "ПВХ · Галоши 043/069",
    codes: ["043","069"],
    rates: { lit: 8, trim: 2.8, packNoSock: 2.00 },
  },
  {
    label: "ПВХ · 085 сапоги мужские — Литейка override",
    codes: ["085"],
    rates: { lit: 10 },
  },
  {
    label: "ПВХ · Упаковка 067/069 (Аруту) — переопределение",
    codes: ["067","069"],
    rates: { packNoSock: 1.00 },
  },
];

// Цеха и operation для каждого канала ставки
const CHANNELS = {
  lit: { workshopCode: "LIT", operation: null },
  trim: { workshopCode: "PACK", operation: "обрезка" },
  packWithSock: { workshopCode: "PACK", operation: "упаковка с носком" },
  packNoSock: { workshopCode: "PACK", operation: "упаковка без носка" },
};

// Находит все артикулы в БД, соответствующие "корневому" коду из рукописной таблицы.
// Логика:
//   1. Точное совпадение (case-insensitive) — если найдено, только оно.
//   2. Иначе: все коды, начинающиеся с root + не-цифра (вариантные суффиксы /м, н, /1 и т.п.).
function findMatchingArticles(rootCode, allArticles) {
  const root = rootCode.toLowerCase();
  const exact = allArticles.filter((a) => a.code.toLowerCase() === root);
  if (exact.length > 0) return exact;
  return allArticles.filter((a) => {
    const c = a.code.toLowerCase();
    if (!c.startsWith(root)) return false;
    const next = c[root.length];
    if (next === undefined) return true;
    return !/\d/.test(next);
  });
}

async function main() {
  // 1. Workshops map: code → id
  const { data: wsRaw } = await s.from("workshops").select("id, code");
  const wsByCode = new Map((wsRaw ?? []).map((w) => [w.code, w.id]));

  // 2. Все артикулы из БД
  const { data: artRaw } = await s.from("articles").select("id, code");
  const allArticles = artRaw ?? [];

  // 3. Собираем все rate-записи
  const records = [];
  const unmatched = new Set();
  const matchedFamilies = [];

  for (const grp of GROUPS) {
    for (const rootCode of grp.codes) {
      const matched = findMatchingArticles(rootCode, allArticles);
      if (matched.length === 0) {
        unmatched.add(rootCode);
        continue;
      }
      if (matched.length > 1) {
        matchedFamilies.push(`${rootCode} → ${matched.map((m) => m.code).join(", ")}`);
      }
      for (const art of matched) {
        for (const [channel, value] of Object.entries(grp.rates)) {
          if (value == null) continue;
          const ch = CHANNELS[channel];
          if (!ch) continue;
          records.push({
            workshop_id: wsByCode.get(ch.workshopCode),
            article_id: art.id,
            operation: ch.operation,
            rate_per_unit: value,
            unit_type: "пара",
          });
        }
      }
    }
  }

  if (matchedFamilies.length > 0) {
    console.log("\nКорневые коды → варианты:");
    matchedFamilies.slice(0, 12).forEach((l) => console.log("  ", l));
    if (matchedFamilies.length > 12) console.log(`  ... ещё ${matchedFamilies.length - 12}`);
    console.log("");
  }

  console.log(`К вставке: ${records.length} записей`);
  console.log(`Артикулов не найдено в БД: ${unmatched.size}`);
  if (unmatched.size > 0) {
    console.log("Не найдены:", [...unmatched].sort().join(", "));
  }

  // 4. Вставляем (без deduplication — несколько строк могут быть для одного workshop+article+operation
  //    если в таблице есть override-блоки; в этом случае более поздняя строка перекрывает).
  // Сначала удаляем существующие записи только для этих article_id+workshop+operation комбинаций,
  // чтобы повторный запуск был идемпотентным.
  const articleIds = [...new Set(records.map((r) => r.article_id))];
  if (articleIds.length > 0) {
    const { error: delErr } = await s
      .from("rates")
      .delete()
      .in("article_id", articleIds);
    if (delErr) {
      console.error("Ошибка очистки старых ставок:", delErr.message);
      process.exit(1);
    }
  }

  const { error } = await s.from("rates").insert(records);
  if (error) {
    console.error("Ошибка вставки:", error.message);
    process.exit(1);
  }
  console.log(`✓ Вставлено ${records.length} ставок`);

  // 5. Сводка
  const { data: byWs } = await s
    .from("rates")
    .select("workshop_id, workshops:workshop_id(code)");
  const byWsCount = {};
  for (const r of byWs ?? []) {
    const code = r.workshops?.code ?? "?";
    byWsCount[code] = (byWsCount[code] || 0) + 1;
  }
  console.log("\nВсего ставок в БД по цехам:", byWsCount);
}

main().catch((e) => {
  console.error("✗", e.message);
  process.exit(1);
});
