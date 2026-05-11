// Жизненный цикл партии: создание из выработки, приёмка в следующем цехе,
// передача дальше по маршруту. Все операции пишутся в batch_movements,
// чтобы у каждой партии была полная история.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/types";
import {
  ROUTE_SEQUENCES,
  type RouteType,
  type WorkshopCode,
} from "@/lib/constants";

/**
 * Возвращает последовательность кодов цехов для артикула.
 * 1) Из таблицы routes (если задана технологом)
 * 2) Иначе — типовая по route_type из articles
 */
export async function getRouteForArticle(
  client: SupabaseClient<Database>,
  articleId: string,
): Promise<WorkshopCode[]> {
  const { data: routeData } = await client
    .from("routes")
    .select("sequence")
    .eq("article_id", articleId)
    .eq("is_active", true)
    .maybeSingle();
  const route = routeData as { sequence: WorkshopCode[] } | null;
  if (route?.sequence && Array.isArray(route.sequence) && route.sequence.length > 0) {
    return route.sequence;
  }

  const { data: artData } = await client
    .from("articles")
    .select("route_type")
    .eq("id", articleId)
    .maybeSingle();
  const art = artData as Pick<Tables<"articles">, "route_type"> | null;
  return ROUTE_SEQUENCES[(art?.route_type ?? "medium") as RouteType];
}

/**
 * Следующий цех в маршруте после текущего. Возвращает null, если текущий — последний.
 */
export function nextWorkshopInRoute(
  route: WorkshopCode[],
  currentCode: WorkshopCode,
): WorkshopCode | null {
  const i = route.indexOf(currentCode);
  if (i === -1 || i === route.length - 1) return null;
  return route[i + 1];
}

/**
 * Создаёт партию из строки выработки.
 * Идемпотентен: если у выработки уже есть batch_id — возвращает его.
 */
export async function createBatchFromOutput(
  client: SupabaseClient<Database>,
  outputId: string,
): Promise<string> {
  const { data: outputRaw, error: outErr } = await client
    .from("shift_outputs")
    .select("*, shift:shifts(id, workshop_id, shift_date)")
    .eq("id", outputId)
    .maybeSingle();
  if (outErr) throw outErr;
  const output = outputRaw as
    | (Tables<"shift_outputs"> & {
        shift: Pick<Tables<"shifts">, "id" | "workshop_id" | "shift_date">;
      })
    | null;
  if (!output) throw new Error("Запись выработки не найдена");
  if (output.batch_id) return output.batch_id;

  // Получаем код цеха (для генерации batch_number)
  const { data: wsRaw } = await client
    .from("workshops")
    .select("code")
    .eq("id", output.shift.workshop_id)
    .single();
  const ws = wsRaw as unknown as Pick<Tables<"workshops">, "code">;

  // Номер партии через функцию БД
  const { data: batchNumber, error: rpcErr } = await client.rpc(
    "generate_batch_number" as never,
    {
      workshop_code: ws.code,
      batch_date: output.shift.shift_date,
    } as never,
  );
  if (rpcErr) throw rpcErr;
  if (!batchNumber || typeof batchNumber !== "string") {
    throw new Error("Не удалось сгенерировать номер партии");
  }

  const { data: batchRaw, error: bErr } = await client
    .from("batches")
    .insert({
      batch_number: batchNumber,
      article_id: output.article_id,
      quantity: output.quantity,
      weight: output.weight,
      created_in_workshop: output.shift.workshop_id,
      current_workshop: output.shift.workshop_id,
      status: "created",
      defect_total: output.defect_qty ?? 0,
      shift_id: output.shift.id,
    } as never)
    .select("id")
    .single();
  if (bErr) throw bErr;
  const batch = batchRaw as { id: string };

  // Первая запись истории движения
  const { error: mErr } = await client.from("batch_movements").insert({
    batch_id: batch.id,
    from_workshop: null,
    to_workshop: output.shift.workshop_id,
    qty_in: null,
    qty_out: output.quantity,
    defect_at_step: output.defect_qty ?? 0,
  } as never);
  if (mErr) throw mErr;

  // Связываем выработку с партией
  await client
    .from("shift_outputs")
    .update({ batch_id: batch.id } as never)
    .eq("id", outputId);

  return batch.id;
}

/** Приёмка партии: фиксирует факт qty_in и брак приёмки. */
export async function receiveBatch(
  client: SupabaseClient<Database>,
  args: {
    batchId: string;
    workshopId: string;
    employeeId: string | null;
    qtyIn: number;
    defectAtStep: number;
    notes?: string | null;
  },
): Promise<void> {
  const { data: batchRaw } = await client
    .from("batches")
    .select("current_workshop, defect_total")
    .eq("id", args.batchId)
    .maybeSingle();
  const batch = batchRaw as Pick<
    Tables<"batches">,
    "current_workshop" | "defect_total"
  > | null;
  if (!batch) throw new Error("Партия не найдена");

  const { error: mErr } = await client.from("batch_movements").insert({
    batch_id: args.batchId,
    from_workshop: batch.current_workshop,
    to_workshop: args.workshopId,
    moved_by: args.employeeId,
    qty_in: args.qtyIn,
    defect_at_step: args.defectAtStep,
    notes: args.notes ?? null,
  } as never);
  if (mErr) throw mErr;

  const { error: bErr } = await client
    .from("batches")
    .update({
      status: "received",
      current_workshop: args.workshopId,
      defect_total: (batch.defect_total ?? 0) + args.defectAtStep,
    } as never)
    .eq("id", args.batchId);
  if (bErr) throw bErr;
}

/** Передача партии в следующий цех. Партия становится 'in_transit'. */
export async function transferBatch(
  client: SupabaseClient<Database>,
  args: {
    batchId: string;
    toWorkshopId: string;
    employeeId: string | null;
    qtyOut: number;
    notes?: string | null;
  },
): Promise<void> {
  const { data: batchRaw } = await client
    .from("batches")
    .select("current_workshop")
    .eq("id", args.batchId)
    .maybeSingle();
  const batch = batchRaw as Pick<Tables<"batches">, "current_workshop"> | null;
  if (!batch) throw new Error("Партия не найдена");

  const { error: mErr } = await client.from("batch_movements").insert({
    batch_id: args.batchId,
    from_workshop: batch.current_workshop,
    to_workshop: args.toWorkshopId,
    moved_by: args.employeeId,
    qty_out: args.qtyOut,
    notes: args.notes ?? null,
  } as never);
  if (mErr) throw mErr;

  const { error: bErr } = await client
    .from("batches")
    .update({
      status: "in_transit",
      current_workshop: args.toWorkshopId,
    } as never)
    .eq("id", args.batchId);
  if (bErr) throw bErr;
}
