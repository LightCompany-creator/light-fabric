// Заказы на производство: главный заказ (от коммерческого директора или
// сразу от начальника производства) → подзаказы по цехам.
// Главный заказ:
//   draft (создан коммерческим директором, ждёт приёма) → in_progress
//   (принят начальником производства ЛИБО создан им самим — тогда draft
//   пропускается) → closed (закрывается вручную, когда закрыты ВСЕ подзаказы).
//   Закрытый заказ может переоткрыть начальник производства или админ.
// Подзаказ: assigned (назначен цеху) → correction_requested (цех попросил
//   правку) → in_progress (цех принял) → closed (обе стороны подтвердили —
//   начальник цеха и начальник производства, независимо друг от друга).
// Прогресс (план/факт) считает view suborder_progress по сменам,
// привязанным к подзаказу (shifts.suborder_id).

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/types";

export type OrderStatus = "draft" | "in_progress" | "closed";
export type SuborderStatus =
  | "assigned"
  | "correction_requested"
  | "in_progress"
  | "closed";

export async function createOrder(
  client: SupabaseClient<Database>,
  args: {
    orderDate: string;
    dueDate: string | null;
    comment: string | null;
    createdBy: string | null;
    /** Заказ коммерческого директора ждёт приёма; свой — сразу в работе. */
    needsAcceptance: boolean;
  },
): Promise<{ id: string }> {
  const { data, error } = await client
    .from("production_orders")
    .insert({
      order_date: args.orderDate,
      due_date: args.dueDate,
      comment: args.comment,
      created_by: args.createdBy,
      status: args.needsAcceptance ? "draft" : "in_progress",
    } as never)
    .select("id")
    .single();
  if (error) throw error;
  return { id: (data as { id: string }).id };
}

/** Начальник производства принимает заказ коммерческого директора в работу. */
export async function acceptOrder(
  client: SupabaseClient<Database>,
  args: { orderId: string; acceptedBy: string | null },
): Promise<void> {
  const { data: docRaw, error: dErr } = await client
    .from("production_orders")
    .select("id, status, doc_number")
    .eq("id", args.orderId)
    .single();
  if (dErr) throw dErr;
  const doc = docRaw as Pick<Tables<"production_orders">, "id" | "status" | "doc_number">;
  if (doc.status !== "draft") {
    throw new Error(`Заказ ${doc.doc_number} уже принят или закрыт`);
  }

  const { error } = await client
    .from("production_orders")
    .update({
      status: "in_progress",
      accepted_by: args.acceptedBy,
      accepted_at: new Date().toISOString(),
    } as never)
    .eq("id", args.orderId);
  if (error) throw error;
}

export async function addOrderLine(
  client: SupabaseClient<Database>,
  args: { orderId: string; articleId: string; qty: number },
): Promise<void> {
  const { data: docRaw, error: dErr } = await client
    .from("production_orders")
    .select("id, status, doc_number")
    .eq("id", args.orderId)
    .single();
  if (dErr) throw dErr;
  const doc = docRaw as Pick<Tables<"production_orders">, "id" | "status" | "doc_number">;
  if (doc.status === "closed") {
    throw new Error(`Заказ ${doc.doc_number} закрыт — строки добавлять нельзя`);
  }

  const { error } = await client.from("production_order_lines").insert({
    order_id: args.orderId,
    article_id: args.articleId,
    qty: args.qty,
  } as never);
  if (error) throw error;
}

export async function removeOrderLine(
  client: SupabaseClient<Database>,
  lineId: string,
): Promise<void> {
  const { error } = await client.from("production_order_lines").delete().eq("id", lineId);
  if (error) throw error;
}

/** Удаление заказа целиком (закрытый защищён триггером БД, подзаказы каскадно). */
export async function deleteOrder(
  client: SupabaseClient<Database>,
  orderId: string,
): Promise<void> {
  const { error } = await client.from("production_orders").delete().eq("id", orderId);
  if (error) throw error;
}

/**
 * Закрытие главного заказа: только когда закрыты ВСЕ его подзаказы.
 * Решение делает начальник производства вручную, не автоматически.
 */
export async function closeOrder(
  client: SupabaseClient<Database>,
  args: { orderId: string; closedBy: string | null },
): Promise<void> {
  const { data: subsRaw, error: sErr } = await client
    .from("production_suborders")
    .select("id, status, doc_number")
    .eq("order_id", args.orderId);
  if (sErr) throw sErr;
  const subs = (subsRaw ?? []) as Pick<
    Tables<"production_suborders">,
    "id" | "status" | "doc_number"
  >[];
  if (subs.length === 0) {
    throw new Error("Нельзя закрыть заказ без подзаказов");
  }
  const notClosed = subs.filter((s) => s.status !== "closed");
  if (notClosed.length > 0) {
    throw new Error(
      `Не все подзаказы закрыты: ${notClosed.map((s) => s.doc_number).join(", ")}`,
    );
  }

  const { error } = await client
    .from("production_orders")
    .update({
      status: "closed",
      closed_by: args.closedBy,
      closed_at: new Date().toISOString(),
    } as never)
    .eq("id", args.orderId);
  if (error) throw error;
}

/** Переоткрытие закрытого заказа. Только админ (дублируется триггером БД). */
export async function reopenOrder(
  client: SupabaseClient<Database>,
  args: { orderId: string; reopenedBy: string | null },
): Promise<void> {
  const { error } = await client
    .from("production_orders")
    .update({
      status: "in_progress",
      reopened_by: args.reopenedBy,
      reopened_at: new Date().toISOString(),
    } as never)
    .eq("id", args.orderId);
  if (error) throw error;
}

export async function createSuborder(
  client: SupabaseClient<Database>,
  args: {
    orderId: string;
    workshopId: string;
    dueDate: string | null;
    createdBy: string | null;
  },
): Promise<{ id: string }> {
  const { data: orderRaw, error: oErr } = await client
    .from("production_orders")
    .select("id, status, doc_number")
    .eq("id", args.orderId)
    .single();
  if (oErr) throw oErr;
  const order = orderRaw as Pick<Tables<"production_orders">, "id" | "status" | "doc_number">;
  if (order.status === "draft") {
    throw new Error(`Заказ ${order.doc_number} ещё не принят в работу`);
  }
  if (order.status === "closed") {
    throw new Error(`Заказ ${order.doc_number} закрыт`);
  }

  const { data, error } = await client
    .from("production_suborders")
    .insert({
      order_id: args.orderId,
      workshop_id: args.workshopId,
      due_date: args.dueDate,
      created_by: args.createdBy,
      status: "assigned",
    } as never)
    .select("id")
    .single();
  if (error) throw error;
  return { id: (data as { id: string }).id };
}

export async function addSuborderLine(
  client: SupabaseClient<Database>,
  args: { suborderId: string; articleId: string; qty: number },
): Promise<void> {
  const { data: docRaw, error: dErr } = await client
    .from("production_suborders")
    .select("id, status, doc_number")
    .eq("id", args.suborderId)
    .single();
  if (dErr) throw dErr;
  const doc = docRaw as Pick<
    Tables<"production_suborders">,
    "id" | "status" | "doc_number"
  >;
  if (doc.status === "closed") {
    throw new Error(`Подзаказ ${doc.doc_number} закрыт — строки добавлять нельзя`);
  }

  const { error } = await client.from("production_suborder_lines").insert({
    suborder_id: args.suborderId,
    article_id: args.articleId,
    qty: args.qty,
  } as never);
  if (error) throw error;
}

export async function removeSuborderLine(
  client: SupabaseClient<Database>,
  lineId: string,
): Promise<void> {
  const { error } = await client.from("production_suborder_lines").delete().eq("id", lineId);
  if (error) throw error;
}

/** Начальник цеха принимает подзаказ в работу (assigned/correction_requested → in_progress). */
export async function acceptSuborder(
  client: SupabaseClient<Database>,
  args: { suborderId: string; acceptedBy: string | null },
): Promise<void> {
  const { data: docRaw, error: dErr } = await client
    .from("production_suborders")
    .select("id, status, doc_number")
    .eq("id", args.suborderId)
    .single();
  if (dErr) throw dErr;
  const doc = docRaw as Pick<
    Tables<"production_suborders">,
    "id" | "status" | "doc_number"
  >;
  if (doc.status === "closed") throw new Error(`Подзаказ ${doc.doc_number} уже закрыт`);
  if (doc.status === "in_progress")
    throw new Error(`Подзаказ ${doc.doc_number} уже принят в работу`);

  const { error } = await client
    .from("production_suborders")
    .update({
      status: "in_progress",
      accepted_by: args.acceptedBy,
      accepted_at: new Date().toISOString(),
      correction_comment: null,
    } as never)
    .eq("id", args.suborderId);
  if (error) throw error;
}

/** Начальник цеха просит скорректировать подзаказ (обычно срок) вместо приёма. */
export async function requestCorrection(
  client: SupabaseClient<Database>,
  args: { suborderId: string; comment: string },
): Promise<void> {
  const { data: docRaw, error: dErr } = await client
    .from("production_suborders")
    .select("id, status, doc_number")
    .eq("id", args.suborderId)
    .single();
  if (dErr) throw dErr;
  const doc = docRaw as Pick<
    Tables<"production_suborders">,
    "id" | "status" | "doc_number"
  >;
  if (doc.status !== "assigned") {
    throw new Error(
      `Подзаказ ${doc.doc_number}: корректировку можно запросить только до приёма в работу`,
    );
  }

  const { error } = await client
    .from("production_suborders")
    .update({ status: "correction_requested", correction_comment: args.comment } as never)
    .eq("id", args.suborderId);
  if (error) throw error;
}

/** Начальник производства правит срок по запросу цеха и возвращает подзаказ на рассмотрение. */
export async function resolveCorrection(
  client: SupabaseClient<Database>,
  args: { suborderId: string; dueDate: string | null },
): Promise<void> {
  const { error } = await client
    .from("production_suborders")
    .update({ status: "assigned", due_date: args.dueDate, correction_comment: null } as never)
    .eq("id", args.suborderId);
  if (error) throw error;
}

/**
 * Подтверждение выполнения одной из сторон. Подзаказ закрывается
 * (status → closed), когда подтвердили ОБЕ стороны — цех и производство.
 */
async function confirmSuborder(
  client: SupabaseClient<Database>,
  args: {
    suborderId: string;
    side: "workshop" | "production";
    confirmedBy: string | null;
  },
): Promise<void> {
  const { data: docRaw, error: dErr } = await client
    .from("production_suborders")
    .select("*")
    .eq("id", args.suborderId)
    .single();
  if (dErr) throw dErr;
  const doc = docRaw as Tables<"production_suborders">;
  if (doc.status === "closed") throw new Error(`Подзаказ ${doc.doc_number} уже закрыт`);
  if (doc.status !== "in_progress") {
    throw new Error(`Подзаказ ${doc.doc_number} ещё не принят в работу`);
  }

  const otherSideConfirmed =
    args.side === "workshop" ? doc.production_confirmed_at !== null : doc.workshop_confirmed_at !== null;

  const patch: Record<string, unknown> = { status: otherSideConfirmed ? "closed" : doc.status };
  if (args.side === "workshop") {
    patch.workshop_confirmed_by = args.confirmedBy;
    patch.workshop_confirmed_at = new Date().toISOString();
  } else {
    patch.production_confirmed_by = args.confirmedBy;
    patch.production_confirmed_at = new Date().toISOString();
  }

  const { error } = await client
    .from("production_suborders")
    .update(patch as never)
    .eq("id", args.suborderId);
  if (error) throw error;
}

export async function closeSuborderByWorkshop(
  client: SupabaseClient<Database>,
  args: { suborderId: string; confirmedBy: string | null },
): Promise<void> {
  await confirmSuborder(client, { ...args, side: "workshop" });
}

export async function closeSuborderByProduction(
  client: SupabaseClient<Database>,
  args: { suborderId: string; confirmedBy: string | null },
): Promise<void> {
  await confirmSuborder(client, { ...args, side: "production" });
}

/** Переоткрытие закрытого подзаказа. Только админ (дублируется триггером БД). */
export async function reopenSuborder(
  client: SupabaseClient<Database>,
  args: { suborderId: string; reopenedBy: string | null },
): Promise<void> {
  const { error } = await client
    .from("production_suborders")
    .update({
      status: "in_progress",
      workshop_confirmed_by: null,
      workshop_confirmed_at: null,
      production_confirmed_by: null,
      production_confirmed_at: null,
      reopened_by: args.reopenedBy,
      reopened_at: new Date().toISOString(),
    } as never)
    .eq("id", args.suborderId);
  if (error) throw error;
}

export async function getSuborderProgress(
  client: SupabaseClient<Database>,
  suborderId: string,
): Promise<{ suborder_id: string; article_id: string; planned_qty: number; produced_qty: number }[]> {
  const { data, error } = await client
    .from("suborder_progress")
    .select("*")
    .eq("suborder_id", suborderId);
  if (error) throw error;
  return (data ?? []) as {
    suborder_id: string;
    article_id: string;
    planned_qty: number;
    produced_qty: number;
  }[];
}

/** Подзаказы цеха «в работе» — для выбора при открытии смены. */
export async function getActiveSuborders(
  client: SupabaseClient<Database>,
  workshopId: string,
): Promise<Pick<Tables<"production_suborders">, "id" | "doc_number" | "due_date">[]> {
  const { data, error } = await client
    .from("production_suborders")
    .select("id, doc_number, due_date")
    .eq("workshop_id", workshopId)
    .eq("status", "in_progress")
    .order("due_date");
  if (error) throw error;
  return (data ?? []) as Pick<Tables<"production_suborders">, "id" | "doc_number" | "due_date">[];
}

/** План/факт по подзаказу, просуммированный по всем строкам — для дерева заказа. */
export async function getSuborderProgressTotals(
  client: SupabaseClient<Database>,
  suborderIds: string[],
): Promise<Map<string, { planned: number; produced: number }>> {
  const totals = new Map<string, { planned: number; produced: number }>();
  if (suborderIds.length === 0) return totals;

  const { data, error } = await client
    .from("suborder_progress")
    .select("suborder_id, planned_qty, produced_qty")
    .in("suborder_id", suborderIds);
  if (error) throw error;

  for (const row of (data ?? []) as { suborder_id: string; planned_qty: number; produced_qty: number }[]) {
    const acc = totals.get(row.suborder_id) ?? { planned: 0, produced: 0 };
    acc.planned += row.planned_qty;
    acc.produced += row.produced_qty;
    totals.set(row.suborder_id, acc);
  }
  return totals;
}

/** Заказы от коммерческого директора, которые ждут приёма — бейдж начальнику производства. */
export async function countOrdersAwaitingAcceptance(
  client: SupabaseClient<Database>,
): Promise<number> {
  const { count, error } = await client
    .from("production_orders")
    .select("id", { count: "exact", head: true })
    .eq("status", "draft");
  if (error) throw error;
  return count ?? 0;
}

/** Подзаказы, где цех уже подтвердил, но производство ещё нет — готовы к финальной проверке. */
export async function countSuborderConfirmationsPending(
  client: SupabaseClient<Database>,
): Promise<number> {
  const { count, error } = await client
    .from("production_suborders")
    .select("id", { count: "exact", head: true })
    .eq("status", "in_progress")
    .not("workshop_confirmed_at", "is", null)
    .is("production_confirmed_at", null);
  if (error) throw error;
  return count ?? 0;
}

/** Новые подзаказы цеха, которые ещё не приняты в работу — бейдж начальнику цеха. */
export async function countNewSubordersForWorkshop(
  client: SupabaseClient<Database>,
  workshopId: string,
): Promise<number> {
  const { count, error } = await client
    .from("production_suborders")
    .select("id", { count: "exact", head: true })
    .eq("workshop_id", workshopId)
    .eq("status", "assigned");
  if (error) throw error;
  return count ?? 0;
}
