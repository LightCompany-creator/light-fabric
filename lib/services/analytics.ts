// Аналитика для дашбордов. На MVP — простые in-memory агрегации
// в Node (Server Component). Для продакшна часть запросов стоит
// перенести в материализованные представления Postgres.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/types";
import {
  addDays,
  differenceInHours,
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
    batchesInWork: number;
  };
  topArticles: { code: string; name: string; pairs: number }[];
  productionByDay: { x: string; y: number }[];
  workshopLoad: { x: string; y: number; color?: string }[];
  stuckBatches: {
    id: string;
    batchNumber: string;
    articleCode: string;
    workshopCode: string;
    hoursStuck: number;
  }[];
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
      "quantity, defect_qty, weight, article:articles(code, name, wholesale_price), shift:shifts!inner(shift_date)",
    )
    .gte("shift.shift_date", todayStr)
    .lte("shift.shift_date", todayStr);
  type OutWithJoin = {
    quantity: number;
    defect_qty: number | null;
    weight: number | null;
    article: { code: string; name: string; wholesale_price: number | null } | null;
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

  // 2. ФОТ сегодня — суммируем по closed shifts
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

  // 4. Партий в работе
  const { count: inWorkCount } = await client
    .from("batches")
    .select("*", { count: "exact", head: true })
    .in("status", ["created", "in_transit", "received", "in_work"]);
  const batchesInWork = inWorkCount ?? 0;

  // 5. Топ артикулов за неделю
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

  // 6. Выпуск по дням за 2 недели
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

  // 7. Загрузка цехов сегодня — по партиям, текущим в каждом цехе
  const { data: workshopsRaw } = await client
    .from("workshops")
    .select("id, code, name, color, seq_order")
    .eq("is_active", true)
    .order("seq_order");
  type WS = Pick<Tables<"workshops">, "id" | "code" | "name" | "color" | "seq_order">;
  const workshops = (workshopsRaw ?? []) as WS[];

  const { data: activeBatchesRaw } = await client
    .from("batches")
    .select("id, current_workshop, quantity, status, created_at")
    .in("status", ["created", "in_transit", "received", "in_work"]);
  type ActiveBatch = Pick<
    Tables<"batches">,
    "id" | "current_workshop" | "quantity" | "status" | "created_at"
  >;
  const activeBatches = (activeBatchesRaw ?? []) as ActiveBatch[];

  const workshopLoad = workshops.map((w) => {
    const pairs = activeBatches
      .filter((b) => b.current_workshop === w.id)
      .reduce((s, b) => s + b.quantity, 0);
    return { x: w.code, y: pairs, color: w.color };
  });

  // 8. Застрявшие партии — created_at старше 24 часов и статус активный
  const now = today.getTime();
  const stuckBatches: DirectorOverview["stuckBatches"] = [];

  if (activeBatches.length > 0) {
    const { data: artRaw } = await client
      .from("articles")
      .select("id, code");
    const byArt = new Map<string, string>();
    for (const a of (artRaw ?? []) as Pick<Tables<"articles">, "id" | "code">[]) {
      byArt.set(a.id, a.code);
    }
    const wsById = new Map<string, string>();
    for (const w of workshops) wsById.set(w.id, w.code);

    const { data: batchDetailsRaw } = await client
      .from("batches")
      .select("id, batch_number, article_id, current_workshop, created_at")
      .in(
        "id",
        activeBatches
          .filter((b) => {
            const ageH = differenceInHours(now, parseISO(b.created_at).getTime());
            return ageH > 24;
          })
          .map((b) => b.id),
      );
    type BD = Pick<
      Tables<"batches">,
      "id" | "batch_number" | "article_id" | "current_workshop" | "created_at"
    >;
    for (const b of (batchDetailsRaw ?? []) as BD[]) {
      const hours = differenceInHours(now, parseISO(b.created_at).getTime());
      stuckBatches.push({
        id: b.id,
        batchNumber: b.batch_number,
        articleCode: byArt.get(b.article_id) ?? "?",
        workshopCode: b.current_workshop
          ? wsById.get(b.current_workshop) ?? "?"
          : "?",
        hoursStuck: hours,
      });
    }
    stuckBatches.sort((a, b) => b.hoursStuck - a.hoursStuck);
  }

  return {
    today: {
      pairs: todayPairs,
      valueRub: todayValue,
      defectPct,
      payrollRub: todayPay,
      materialsKg: todayMatKg,
      batchesInWork,
    },
    topArticles,
    productionByDay,
    workshopLoad,
    stuckBatches: stuckBatches.slice(0, 5),
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
  incomingCount: number;
  inWorkCount: number;
  weeklyByDay: { x: string; y: number }[];
};

export async function getForemanOverview(
  client: SupabaseClient<Database>,
  args: { workshopId: string; foremanId: string },
): Promise<ForemanOverview> {
  const today = new Date();
  const todayStr = isoDate(today);
  const weekAgo = subDays(today, 6);

  // 1. Текущая открытая смена бригадира на сегодня
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

  // 2. Входящие
  const { count: incomingCount } = await client
    .from("batches")
    .select("*", { count: "exact", head: true })
    .eq("current_workshop", args.workshopId)
    .eq("status", "in_transit");

  // 3. В работе у меня
  const { count: inWorkCount } = await client
    .from("batches")
    .select("*", { count: "exact", head: true })
    .eq("current_workshop", args.workshopId)
    .in("status", ["received", "in_work", "created"]);

  // 4. Выработка за неделю по дням
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
  const weeklyByDay: { x: string; y: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = isoDate(subDays(today, i));
    weeklyByDay.push({ x: format(parseISO(d), "EEE", { weekStartsOn: 1 } as { weekStartsOn: 1 }), y: byDay.get(d) ?? 0 });
  }
  // Локализация дней недели не сработает с EEE без locale; перепишем вручную:
  const ruDays = ["вс", "пн", "вт", "ср", "чт", "пт", "сб"];
  weeklyByDay.length = 0;
  for (let i = 6; i >= 0; i--) {
    const date = subDays(today, i);
    const d = isoDate(date);
    weeklyByDay.push({ x: ruDays[date.getDay()], y: byDay.get(d) ?? 0 });
  }

  return {
    currentShift,
    incomingCount: incomingCount ?? 0,
    inWorkCount: inWorkCount ?? 0,
    weeklyByDay,
  };
}

// Утилиты экспортируем для page.tsx
export { addDays, startOfDay };
