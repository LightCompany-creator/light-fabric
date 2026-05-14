// Применяет расценки из рукописных таблиц через service_role (минует RLS).
// Запуск: node --env-file=.env.local scripts/apply-rates.mjs

import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// ============================================================
// ДАННЫЕ ИЗ ФОТО
// ============================================================
// Каждая группа = одна строка таблицы. У всех артикулов в группе
// применяются одинаковые расценки по 4 операциям:
//   литьё (LIT), обрезка (PACK), упаковка с носком (PACK), упаковка б/носка (PACK).
// null означает «расценка не задана» — пропускаем эту операцию.

const GROUPS = [
  // === ЭВА (фото 1) ===
  {
    name: "Галоши/Сабо ЭВА",
    codes: ["022","022/1","023","023/1","044","127","129","901","902","903","905","905/1","905/м","906","907","907/1","907м","908","909","909м","3022/1","3022м","3023","4022","4023","С-044","С-044м","130","315","944","922","923","6023"],
    lit: 4.5, cut: 1.8, packSock: 1.9, packNoSock: 1.9,
  },
  {
    name: "Сапоги цельнолитые мужские ЭВА",
    codes: ["112","112/1","112/м","112/н","184","184/1","184/м","184/н","187/м","187/н","220","220/1","220/м","220/н","412м","412н","А-100м","А-100мм","А-100н","А-100нм","АВ-300","АВ-300н","113/1","113/м","113/н"],
    lit: 11.5, cut: 4.5, packSock: 4.2, packNoSock: 3.6,
  },
  {
    name: "Сапоги цельнолитые женские/детские ЭВА",
    codes: ["027","048","221","026","811","АВ-310"],
    lit: 8, cut: 3.5, packSock: 2.9, packNoSock: 2.3,
  },
  {
    name: "Женская упаковка 221",
    codes: ["221"],
    lit: null, cut: null, packSock: 3.5, packNoSock: 3,
  },
  {
    name: "Кроксы 849/859",
    codes: ["849","859"],
    lit: 6, cut: 6, packSock: null, packNoSock: 2.6,
  },
  {
    name: "Кроксы основные",
    codes: ["149","149у","159","159у","160","703","704","752","1043","1033"],
    lit: 4.5, cut: 6, packSock: null, packNoSock: 2.6,
  },
  {
    name: "Кроксы двойная пенка",
    codes: ["702","705","751","753","770","771","772","177","1037","179"],
    lit: 9, cut: 6, packSock: null, packNoSock: 2.6,
  },
  {
    name: "Обрезка 177",
    codes: ["177"],
    lit: null, cut: 2, packSock: null, packNoSock: null,
  },
  {
    name: "Пенка лето с камнями",
    codes: ["1004","1020","1022"],
    lit: 3.5, cut: 2.3, packSock: null, packNoSock: 2.3,
  },
  {
    name: "Пенка лето мужские",
    codes: ["007","071","072","073","076","077","137","141","222","657","1010","1024","1025","1026","1030","1031","1032","223","1047"],
    lit: 3.5, cut: 2, packSock: null, packNoSock: 1.5,
  },
  {
    name: "Упаковка 1030/1031/1032",
    codes: ["1030","1031","1032"],
    lit: null, cut: null, packSock: null, packNoSock: 2.6,
  },
  {
    name: "Пенка лето женские",
    codes: ["020","142","145","157","180","650","651","652","653","1021","1023","1027","1028","1029","1034","1036","1037","1038"],
    lit: 3.5, cut: 2, packSock: null, packNoSock: 1.5,
  },
  {
    name: "Упаковка 1027/1028/1029/1034/1036/1037",
    codes: ["1027","1028","1029","1034","1036","1037"],
    lit: null, cut: null, packSock: null, packNoSock: 2.6,
  },
  {
    name: "Пенка лето детские",
    codes: ["019","140","163","164","165","663","664","665","1005","1006","1035","655","161"],
    lit: 3.5, cut: 2, packSock: null, packNoSock: 1.5,
  },
  {
    name: "Упаковка 1035",
    codes: ["1035"],
    lit: null, cut: null, packSock: null, packNoSock: 2.6,
  },

  // === ПВХ (фото 3) ===
  {
    name: "Сапоги ПВХ",
    codes: ["038","039","042","046","061","063","064","065","038/н","039н","042н","046/1","046н","061Н","061НМ"],
    lit: 10.30, cut: 3.20, packSock: 2.60, packNoSock: 2.30,
  },
  {
    name: "ПВХ 080-086",
    codes: ["080","081","082","085","086","080н","086н","080/1","086/1"],
    lit: 8, cut: 2.5, packSock: 2.30, packNoSock: 2.00,
  },
  {
    name: "Галоши ПВХ",
    codes: ["043","069","043/1"],
    lit: 8, cut: 2.5, packSock: null, packNoSock: 2.00,
  },
  {
    name: "085 сапоги мужские ПВХ",
    codes: ["085"],
    lit: 10, cut: null, packSock: null, packNoSock: null,
  },
  {
    name: "Упаковка Аруту 067/069",
    codes: ["067","069"],
    lit: null, cut: null, packSock: null, packNoSock: 1.00,
  },
  {
    name: "Манжет 058",
    codes: ["058"],
    lit: 3.50, cut: null, packSock: null, packNoSock: null,
  },
  {
    name: "Манжет опушка 062",
    codes: ["062"],
    lit: 5.00, cut: null, packSock: null, packNoSock: null,
  },
];

// ============================================================

// Возвращает массив артикулов, подходящих под код:
// - точное совпадение, ЛИБО
// - артикулы, чей код = `code` + любой суффикс из {буква, /, цифра-после-буквы}
// При этом исключаются «другие корни» типа Ар-044 для 044.
function findArticles(code, allArticles) {
  const lc = (s) => s.toLowerCase();
  const exact = allArticles.find((a) => lc(a.code) === lc(code));
  if (exact) return [exact];
  const prefix = lc(code);
  return allArticles.filter((a) => {
    const c = lc(a.code);
    if (!c.startsWith(prefix)) return false;
    const rest = c.slice(prefix.length);
    if (rest === "") return true;
    return /^[^\d]/.test(rest);
  });
}

function makeRates(group, allArticles, codeToId) {
  const result = [];
  const matchedCodes = new Set();
  for (const code of group.codes) {
    const articles = findArticles(code, allArticles);
    for (const article of articles) {
      if (matchedCodes.has(article.code)) continue; // не дублируем
      matchedCodes.add(article.code);
      const aId = article.id;
    if (group.lit != null) {
      result.push({
        workshop_id: codeToId.get("LIT"),
        article_id: aId,
        operation: "литьё",
        rate_per_unit: group.lit,
      });
    }
    if (group.cut != null) {
      result.push({
        workshop_id: codeToId.get("PACK"),
        article_id: aId,
        operation: "обрезка",
        rate_per_unit: group.cut,
      });
    }
    if (group.packSock != null) {
      result.push({
        workshop_id: codeToId.get("PACK"),
        article_id: aId,
        operation: "упаковка с носком",
        rate_per_unit: group.packSock,
      });
    }
    if (group.packNoSock != null) {
      result.push({
        workshop_id: codeToId.get("PACK"),
        article_id: aId,
        operation: "упаковка без носка",
        rate_per_unit: group.packNoSock,
      });
    }
    }
  }
  return { rates: result, matched: [...matchedCodes] };
}

async function main() {
  // Загружаем артикулы и цеха
  const { data: articlesRaw } = await s
    .from("articles")
    .select("id, code, name")
    .limit(2000);
  const allArticles = articlesRaw;

  const { data: wsRaw } = await s.from("workshops").select("id, code");
  const codeToId = new Map(wsRaw.map((w) => [w.code, w.id]));

  // Удаляем старые расценки LIT и PACK с привязкой к артикулу (per-article).
  // Общие расценки цехов (article_id IS NULL) трогать не будем.
  const litId = codeToId.get("LIT");
  const packId = codeToId.get("PACK");
  console.log("→ удаляю старые per-article расценки LIT и PACK...");
  const { error: delErr } = await s
    .from("rates")
    .delete()
    .in("workshop_id", [litId, packId])
    .not("article_id", "is", null);
  if (delErr) throw delErr;

  // Собираем новые
  const allRates = [];
  const unmatched = [];
  const matchedPerGroup = {};
  for (const g of GROUPS) {
    const { rates, matched } = makeRates(g, allArticles, codeToId);
    matchedPerGroup[g.name] = matched;
    for (const code of g.codes) {
      // если ни один артикул не подошёл под этот код (ни точно, ни префиксом)
      const hits = matched.filter((m) => m === code || m.startsWith(code));
      if (hits.length === 0) unmatched.push({ group: g.name, code });
    }
    allRates.push(...rates);
  }

  console.log(`→ вставляю ${allRates.length} расценок...`);
  // Вставляем батчами по 200
  for (let i = 0; i < allRates.length; i += 200) {
    const chunk = allRates.slice(i, i + 200);
    const { error } = await s.from("rates").insert(chunk);
    if (error) throw error;
  }

  console.log(`✓ вставлено: ${allRates.length}`);
  console.log(`⚠ не найденных кодов: ${unmatched.length}`);
  if (unmatched.length > 0) {
    const byGroup = {};
    for (const u of unmatched) (byGroup[u.group] ??= []).push(u.code);
    for (const [g, codes] of Object.entries(byGroup)) {
      console.log(`  [${g}] ${codes.join(", ")}`);
    }
  }

  // Финальный отчёт
  const { count } = await s
    .from("rates")
    .select("*", { count: "exact", head: true });
  console.log(`\nВсего расценок в БД: ${count}`);
}

main().catch((e) => {
  console.error("✗", e.message);
  if (e.details) console.error("  details:", e.details);
  process.exit(1);
});
