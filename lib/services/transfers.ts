// Перемещения между цехами (документы передачи).
// Жизненный цикл: open (создан, можно править/удалять)
//   → accepted (принят получателем, закрыт; переоткрыть может только админ).
// Остатки складов цехов считает view workshop_stock.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/types";

export type TransferStatus = "open" | "accepted";

export type StockRow = {
  workshop_id: string;
  article_id: string;
  qty: number;
};

/** Остатки склада цеха (или всех цехов, если workshopId не задан). */
export async function getWorkshopStock(
  client: SupabaseClient<Database>,
  workshopId?: string,
): Promise<StockRow[]> {
  let q = client.from("workshop_stock").select("workshop_id, article_id, qty");
  if (workshopId) q = q.eq("workshop_id", workshopId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as StockRow[];
}

/** Остаток конкретного артикула на складе цеха. */
export async function getStockQty(
  client: SupabaseClient<Database>,
  workshopId: string,
  articleId: string,
): Promise<number> {
  const { data, error } = await client
    .from("workshop_stock")
    .select("qty")
    .eq("workshop_id", workshopId)
    .eq("article_id", articleId)
    .maybeSingle();
  if (error) throw error;
  return (data as { qty: number } | null)?.qty ?? 0;
}

export async function createTransfer(
  client: SupabaseClient<Database>,
  args: {
    fromWorkshopId: string;
    toWorkshopId: string;
    transferDate: string;
    createdBy: string | null;
    comment?: string | null;
  },
): Promise<{ id: string }> {
  const { data, error } = await client
    .from("transfers")
    .insert({
      from_workshop_id: args.fromWorkshopId,
      to_workshop_id: args.toWorkshopId,
      transfer_date: args.transferDate,
      created_by: args.createdBy,
      comment: args.comment ?? null,
    } as never)
    .select("id")
    .single();
  if (error) throw error;
  return { id: (data as { id: string }).id };
}

/**
 * Добавляет строку в открытый документ.
 * Контроль приписок: нельзя передать больше, чем есть на остатке
 * склада-отправителя (с учётом уже добавленных строк этого документа).
 */
export async function addTransferLine(
  client: SupabaseClient<Database>,
  args: { transferId: string; articleId: string; qty: number },
): Promise<void> {
  const { data: docRaw, error: dErr } = await client
    .from("transfers")
    .select("id, status, from_workshop_id, doc_number")
    .eq("id", args.transferId)
    .single();
  if (dErr) throw dErr;
  const doc = docRaw as Pick<
    Tables<"transfers">,
    "id" | "status" | "from_workshop_id" | "doc_number"
  >;
  if (doc.status !== "open") {
    throw new Error(`Документ ${doc.doc_number} закрыт — строки добавлять нельзя`);
  }

  const stock = await getStockQty(client, doc.from_workshop_id, args.articleId);

  // Строки этого же документа ещё не списаны со склада (документ не принят),
  // поэтому учитываем их вручную.
  const { data: linesRaw } = await client
    .from("transfer_lines")
    .select("qty")
    .eq("transfer_id", args.transferId)
    .eq("article_id", args.articleId);
  const reserved = ((linesRaw ?? []) as { qty: number }[]).reduce(
    (s, l) => s + l.qty,
    0,
  );

  if (args.qty + reserved > stock) {
    throw new Error(
      `Недостаточно на остатке: доступно ${stock - reserved}, запрошено ${args.qty}`,
    );
  }

  const { error } = await client.from("transfer_lines").insert({
    transfer_id: args.transferId,
    article_id: args.articleId,
    qty: args.qty,
  } as never);
  if (error) throw error;
}

export async function removeTransferLine(
  client: SupabaseClient<Database>,
  lineId: string,
): Promise<void> {
  const { error } = await client.from("transfer_lines").delete().eq("id", lineId);
  if (error) throw error;
}

/** Удаление открытого документа целиком (закрытый защищён триггером БД). */
export async function deleteTransfer(
  client: SupabaseClient<Database>,
  transferId: string,
): Promise<void> {
  const { error } = await client.from("transfers").delete().eq("id", transferId);
  if (error) throw error;
}

/**
 * Приём документа получателем: финальная проверка остатков отправителя
 * и закрытие. После этого документ неизменяем (триггер БД).
 */
export async function acceptTransfer(
  client: SupabaseClient<Database>,
  args: { transferId: string; acceptedBy: string | null },
): Promise<void> {
  const { data: docRaw, error: dErr } = await client
    .from("transfers")
    .select("id, status, from_workshop_id, doc_number")
    .eq("id", args.transferId)
    .single();
  if (dErr) throw dErr;
  const doc = docRaw as Pick<
    Tables<"transfers">,
    "id" | "status" | "from_workshop_id" | "doc_number"
  >;
  if (doc.status !== "open") {
    throw new Error(`Документ ${doc.doc_number} уже принят`);
  }

  const { data: linesRaw, error: lErr } = await client
    .from("transfer_lines")
    .select("article_id, qty")
    .eq("transfer_id", args.transferId);
  if (lErr) throw lErr;
  const lines = (linesRaw ?? []) as { article_id: string; qty: number }[];
  if (lines.length === 0) {
    throw new Error("Нельзя принять документ без строк");
  }

  // Сводим по артикулу и сверяем с остатком отправителя на момент приёма
  const byArticle = new Map<string, number>();
  for (const l of lines) {
    byArticle.set(l.article_id, (byArticle.get(l.article_id) ?? 0) + l.qty);
  }
  for (const [articleId, qty] of Array.from(byArticle.entries())) {
    const stock = await getStockQty(client, doc.from_workshop_id, articleId);
    if (qty > stock) {
      throw new Error(
        `Недостаточно на остатке отправителя (доступно ${stock}, в документе ${qty}). Скорректируйте документ`,
      );
    }
  }

  const { error } = await client
    .from("transfers")
    .update({
      status: "accepted",
      accepted_by: args.acceptedBy,
      accepted_at: new Date().toISOString(),
    } as never)
    .eq("id", args.transferId);
  if (error) throw error;
}

/** Переоткрытие закрытого документа. Только админ (дублируется триггером БД). */
export async function reopenTransfer(
  client: SupabaseClient<Database>,
  args: { transferId: string; reopenedBy: string | null },
): Promise<void> {
  const { error } = await client
    .from("transfers")
    .update({
      status: "open",
      reopened_by: args.reopenedBy,
      reopened_at: new Date().toISOString(),
    } as never)
    .eq("id", args.transferId);
  if (error) throw error;
}