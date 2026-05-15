// Аналитика для дашбордов. На MVP — простые in-memory агрегации
// в Node (Server Component). Для продакшна часть запросов стоит
// перенести в материализованные представления Postgres.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/types";
import {
  addDays,
  differenceInCalendarDays,
  format,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export type DirectorOverview = {
  range: {
    from: string; // YYYY-MM-DD
    to: string;
    label: string; // «Сегодня», «За неделю», «За месяц», «1–15 мая» и т.п.
  };
  totals: {
    pairs: number;
    valueRub: number;
    defectPct: number;
    payrollRub: number;
    materialsKg: number;
  };
  topArticles: { code: string; name: string; pairs: number }[];
  productionByDay: { x: string; y: number }[];
  workshopLoad: { x: string; y: number; color?: string }[];
};

export type DateRange = { from: string; to: string; label?: string };

export async function getDirectorOverview(
  client: SupabaseClient<Database>,
  range: DateRange,
): Promise<DirectorOverview> {
  const { from, to, label = "" } = range;

  // 1. Выработка за период: пары, рубли, брак
  const { data: outsRaw } = await client
    .from("shift_outputs")
    .select(
      "quantity, defect_qty, weight, article:articles(code, name, wholesale_price), shift:shifts!inner(shift_date, workshop_id)",
    )
    .gte("shift.shift_date", from)
    .lte("shift.shift_date", to);
  type OutWithJoin = {
    quantity: number;
    defect_qty: number | null;
    weight: number | null;
    article: { code: string; name: string; wholesale_price: number | null } | null;
    shift: { shift_date: string; workshop_id: string } | null;
  };
  const outs = (outsRaw ?? []) as unknown as OutWithJoin[];

  let totalPairs = 0;
  let totalValue = 0;
  let totalDefect = 0;
  for (const o of outs) {
    totalPairs += o.quantity;
    totalDefect += o.defect_qty ?? 0;
    totalValue += o.quantity * Number(o.article?.wholesale_price ?? 0);
  }
  const defectPct = totalPairs > 0 ? (totalDefect / totalPairs) * 100 : 0;

  // 2. ФОТ за период
  const { data: workersRaw } = await client
    .from("shift_workers")
    .select("calculated_pay, shift:shifts!inner(shift_date)")
    .gte("shift.shift_date", from)
    .lte("shift.shift_date", to);
  type WorkerJoin = { calculated_pay: number | null };
  const payRub = ((workersRaw ?? []) as unknown as WorkerJoin[]).reduce(
    (s, w) => s + Number(w.calculated_pay ?? 0),
    0,
  );

  // 3. Расход материалов кг за период
  const { data: matsRaw } = await client
    .from("material_consumption")
    .select("qty_used, material:materials(unit), shift:shifts!inner(shift_date)")
    .gte("shift.shift_date", from)
    .lte("shift.shift_date", to);
  type MatJoin = { qty_used: number; material: { unit: string } | null };
  const materialsKg = ((matsRaw ?? []) as unknown as MatJoin[])
    .filter((m) => m.material?.unit === "кг")
    .reduce((s, m) => s + Number(m.qty_used), 0);

  // 4. Топ артикулов за период
  const topMap = new Map<string, { name: string; pairs: number }>();
  for (const o of outs) {
    if (!o.article) continue;
    const cur = topMap.get(o.article.code) ?? { name: o.article.name, pairs: 0 };
    cur.pairs += o.quantity;
    topMap.set(o.article.code, cur);
  }
  const topArticles = Array.from(topMap.entries())
    .map(([code, v]) => ({ code, name: v.name, pairs: v.pairs }))
    .sort((a, b) => b.pairs - a.pairs)
    .slice(0, 6);

  // 5. Выпуск по дням за период
  const byDay = new Map<string, number>();
  for (const o of outs) {
    const d = o.shift?.shift_date;
    if (!d) continue;
    byDay.set(d, (byDay.get(d) ?? 0) + o.quantity);
  }
  const fromDate = parseISO(from);
  const toDate = parseISO(to);
  const totalDays = Math.max(0, differenceInCalendarDays(toDate, fromDate)) + 1;
  // Если период очень большой (>60 дней) — группируем по неделям, иначе
  // график станет нечитаемым. Для типовых выборок (день/неделя/месяц) —
  // показываем все дни.
  const productionByDay: { x: string; y: number }[] = [];
  for (let i = 0; i < totalDays; i++) {
    const d = isoDate(addDays(fromDate, i));
    productionByDay.push({
      x: format(parseISO(d), "d.MM"),
      y: byDay.get(d) ?? 0,
    });
  }

  // 6. Загрузка цехов за период — суммируем выработку каждого цеха
  const { data: workshopsRaw } = await client
    .from("workshops")
    .select("id, code, name, color, seq_order")
    .eq("is_active", true)
    .order("seq_order");
  type WS = Pick<Tables<"workshops">, "id" | "code" | "name" | "color" | "seq_order">;
  const workshops = (workshopsRaw ?? []) as WS[];

  const byWs = new Map<string, number>();
  for (const o of outs) {
    const wsId = o.shift?.workshop_id;
    if (!wsId) continue;
    byWs.set(wsId, (byWs.get(wsId) ?? 0) + o.quantity);
  }
  const workshopLoad = workshops.map((w) => ({
    x: w.code,
    y: byWs.get(w.id) ?? 0,
    color: w.color,
  }));

  return {
    range: { from, to, label },
    totals: {
      pairs: totalPairs,
      valueRub: totalValue,
      defectPct,
      payrollRub: payRub,
      materialsKg,
    },
    topArticles,
    productionByDay,
    workshopLoad,
  };
}

export type ForemanOverview = {
  currentShift: {
    id: string;
    shift_date: string;
    shift_type: "день" | "ночь";
    outputs: number;
    workers: number;
  } | null;
  weeklyByDay: { x: string; y: number }[];
};

export async function getForemanOverview(
  client: SupabaseClient<Database>,
  args: { workshopId: string; foremanId: string },
): Promise<ForemanOverview> {
  const today = new Date();
  const todayStr = isoDate(today);
  const weekAgo = subDays(today, 6);

  const { data: shiftRaw } = await client
    .from("shifts")
    .select(
      "id, shift_date, shift_type, shift_outputs(id), shift_workers(id)",
    )
    .eq("workshop_id", args.workshopId)
    .eq("foreman_id", args.foremanId)
    .eq("status", "open")
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  type ShiftJoin = {
    id: string;
    shift_date: string;
    shift_type: "день" | "ночь";
    shift_outputs: { id: string }[];
    shift_workers: { id: string }[];
  };
  const s = shiftRaw as unknown as ShiftJoin | null;
  const currentShift = s
    ? {
        id: s.id,
        shift_date: s.shift_date,
        shift_type: s.shift_type,
        outputs: s.shift_outputs?.length ?? 0,
        workers: s.shift_workers?.length ?? 0,
      }
    : null;

  const { data: weekOutsRaw } = await client
    .from("shift_outputs")
    .select("quantity, shift:shifts!inner(shift_date, workshop_id)")
    .gte("shift.shift_date", isoDate(weekAgo))
    .lte("shift.shift_date", todayStr)
    .eq("shift.workshop_id", args.workshopId);
  type WeekOut = { quantity: number; shift: { shift_date: string } };
  const byDay = new Map<string, number>();
  for (const o of (weekOutsRaw ?? []) as unknown as WeekOut[]) {
    const d = o.shift.shift_date;
    byDay.set(d, (byDay.get(d) ?? 0) + o.quantity);
  }
  const ruDays = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  const weeklyByDay: { x: string; y: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    const d = isoDate(date);
    weeklyByDay.push({ x: ruDays[date.getDay()], y: byDay.get(d) ?? 0 });
  }

  return {
    currentShift,
    weeklyByDay,
  };
}

// Утилита: распарсить searchParams `from`/`to`/`period` в DateRange.
// Дефолт — за неделю.
export function resolveRange(searchParams: {
  from?: string;
  to?: string;
  period?: string;
}): DateRange {
  const today = new Date();
  const todayStr = isoDate(today);

  // Произвольный диапазон
  if (searchParams.from && searchParams.to) {
    return {
      from: searchParams.from,
      to: searchParams.to,
      label: rangeLabel(searchParams.from, searchParams.to),
    };
  }

  const period = searchParams.period || "week";
  if (period === "today") {
    return { from: todayStr, to: todayStr, label: "Сегодня" };
  }
  if (period === "month") {
    return {
      from: isoDate(subDays(today, 29)),
      to: todayStr,
      label: "За 30 дней",
    };
  }
  // week (default)
  return {
    from: isoDate(subDays(today, 6)),
    to: todayStr,
    label: "За 7 дней",
  };
}

function rangeLabel(from: string, to: string): string {
  try {
    const f = parseISO(from);
    const t = parseISO(to);
    if (from === to) return format(f, "d MMM");
    return `${format(f, "d MMM")} — ${format(t, "d MMM")}`;
  } catch {
    return `${from} — ${to}`;
  }
}

export { addDays, startOfDay };
