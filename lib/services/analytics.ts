// Аналитика для дашбордов. На MVP — простые in-memory агрегации
// в Node (Server Component). Для продакшна часть запросов стоит
// перенести в материализованные представления Postgres.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/types";
import {
  addDays,
  format,
  parseISO,
  startOfDay,
  subDays,
} from "date-fns";

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export type DirectorOverview = {
  today: {
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

export async function getDirectorOverview(
  client: SupabaseClient<Database>,
): Promise<DirectorOverview> {
  const today = new Date();
  const todayStr = isoDate(today);
  const weekAgo = subDays(today, 6);
  const twoWeeksAgo = subDays(today, 13);

  // 1. Сегодняшняя выработка с ценами артикулов
  const { data: todayOutsRaw } = await client
    .from("shift_outputs")
    .select(
      "quantity, defect_qty, weight, article:articles(code, name, wholesale_price), shift:shifts!inner(shift_date, workshop_id)",
    )
    .gte("shift.shift_date", todayStr)
    .lte("shift.shift_date", todayStr);
  type OutWithJoin = {
    quantity: number;
    defect_qty: number | null;
    weight: number | null;
    article: { code: string; name: string; wholesale_price: number | null } | null;
    shift: { shift_date: string; workshop_id: string } | null;
  };
  const todayOuts = (todayOutsRaw ?? []) as unknown as OutWithJoin[];

  let todayPairs = 0;
  let todayValue = 0;
  let todayDefect = 0;
  for (const o of todayOuts) {
    todayPairs += o.quantity;
    todayDefect += o.defect_qty ?? 0;
    todayValue += o.quantity * Number(o.article?.wholesale_price ?? 0);
  }
  const defectPct =
    todayPairs > 0 ? (todayDefect / todayPairs) * 100 : 0;

  // 2. ФОТ сегодня
  const { data: todayWorkersRaw } = await client
    .from("shift_workers")
    .select("calculated_pay, shift:shifts!inner(shift_date)")
    .gte("shift.shift_date", todayStr)
    .lte("shift.shift_date", todayStr);
  type WorkerJoin = { calculated_pay: number | null };
  const todayPay = ((todayWorkersRaw ?? []) as unknown as WorkerJoin[]).reduce(
    (s, w) => s + Number(w.calculated_pay ?? 0),
    0,
  );

  // 3. Расход материалов кг сегодня
  const { data: todayMatsRaw } = await client
    .from("material_consumption")
    .select("qty_used, material:materials(unit), shift:shifts!inner(shift_date)")
    .gte("shift.shift_date", todayStr)
    .lte("shift.shift_date", todayStr);
  type MatJoin = { qty_used: number; material: { unit: string } | null };
  const todayMatKg = ((todayMatsRaw ?? []) as unknown as MatJoin[])
    .filter((m) => m.material?.unit === "кг")
    .reduce((s, m) => s + Number(m.qty_used), 0);

  // 4. Топ артикулов за неделю
  const { data: weekOutsRaw } = await client
    .from("shift_outputs")
    .select(
      "quantity, article:articles(code, name), shift:shifts!inner(shift_date)",
    )
    .gte("shift.shift_date", isoDate(weekAgo))
    .lte("shift.shift_date", todayStr);
  type WeekOut = {
    quantity: number;
    article: { code: string; name: string } | null;
  };
  const topMap = new Map<string, { name: string; pairs: number }>();
  for (const o of (weekOutsRaw ?? []) as unknown as WeekOut[]) {
    if (!o.article) continue;
    const cur = topMap.get(o.article.code) ?? { name: o.article.name, pairs: 0 };
    cur.pairs += o.quantity;
    topMap.set(o.article.code, cur);
  }
  const topArticles = Array.from(topMap.entries())
    .map(([code, v]) => ({ code, name: v.name, pairs: v.pairs }))
    .sort((a, b) => b.pairs - a.pairs)
    .slice(0, 6);

  // 5. Выпуск по дням за 2 недели
  const { data: twoWeekOutsRaw } = await client
    .from("shift_outputs")
    .select("quantity, shift:shifts!inner(shift_date)")
    .gte("shift.shift_date", isoDate(twoWeeksAgo))
    .lte("shift.shift_date", todayStr);
  type DayOut = { quantity: number; shift: { shift_date: string } };
  const byDay = new Map<string, number>();
  for (const o of (twoWeekOutsRaw ?? []) as unknown as DayOut[]) {
    const d = o.shift.shift_date;
    byDay.set(d, (byDay.get(d) ?? 0) + o.quantity);
  }
  const productionByDay: { x: string; y: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = isoDate(subDays(today, i));
    productionByDay.push({
      x: format(parseISO(d), "d.MM"),
      y: byDay.get(d) ?? 0,
    });
  }

  // 6. Загрузка цехов сегодня — по выработке за сегодня в каждом цехе
  const { data: workshopsRaw } = await client
    .from("workshops")
    .select("id, code, name, color, seq_order")
    .eq("is_active", true)
    .order("seq_order");
  type WS = Pick<Tables<"workshops">, "id" | "code" | "name" | "color" | "seq_order">;
  const workshops = (workshopsRaw ?? []) as WS[];

  const todayByWs = new Map<string, number>();
  for (const o of todayOuts) {
    const wsId = o.shift?.workshop_id;
    if (!wsId) continue;
    todayByWs.set(wsId, (todayByWs.get(wsId) ?? 0) + o.quantity);
  }
  const workshopLoad = workshops.map((w) => ({
    x: w.code,
    y: todayByWs.get(w.id) ?? 0,
    color: w.color,
  }));

  return {
    today: {
      pairs: todayPairs,
      valueRub: todayValue,
      defectPct,
      payrollRub: todayPay,
      materialsKg: todayMatKg,
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

export { addDays, startOfDay };
