// Управление сменами. Открытие, добавление выработки и работников, закрытие.
// Закрытие — это оркестрация: ЗП + списание сырья + смена статуса.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/types";
import { calculateShiftPay, type WorkerOperation } from "./payroll";

export async function openShift(
  client: SupabaseClient<Database>,
  args: {
    workshopId: string;
    foremanId: string;
    shiftDate: string;
    shiftType: "день" | "ночь";
  },
): Promise<{ id: string }> {
  // Проверяем что нет другой открытой смены того же типа в том же цехе на эту дату
  const { data: openRaw } = await client
    .from("shifts")
    .select("id")
    .eq("workshop_id", args.workshopId)
    .eq("shift_date", args.shiftDate)
    .eq("shift_type", args.shiftType)
    .eq("status", "open")
    .maybeSingle();
  if (openRaw) {
    const o = openRaw as Pick<Tables<"shifts">, "id">;
    return { id: o.id };
  }

  const { data: insertedRaw, error } = await client
    .from("shifts")
    .insert({
      workshop_id: args.workshopId,
      foreman_id: args.foremanId,
      shift_date: args.shiftDate,
      shift_type: args.shiftType,
      status: "open",
    } as never)
    .select("id")
    .single();
  if (error) throw error;
  const inserted = insertedRaw as { id: string };
  return { id: inserted.id };
}

export async function addOutput(
  client: SupabaseClient<Database>,
  args: {
    shiftId: string;
    articleId: string;
    quantity: number;
    weight: number | null;
    defectQty: number;
    machine: string | null;
    castForms: number | null;
    downtimeMin: number;
  },
): Promise<string> {
  const { data, error } = await client
    .from("shift_outputs")
    .insert({
      shift_id: args.shiftId,
      article_id: args.articleId,
      quantity: args.quantity,
      weight: args.weight,
      defect_qty: args.defectQty,
      machine: args.machine,
      cast_forms: args.castForms,
      downtime_min: args.downtimeMin,
    } as never)
    .select("id")
    .single();
  if (error) throw error;
  await calculateShiftPay(client, args.shiftId);
  return (data as { id: string }).id;
}

export async function addWorker(
  client: SupabaseClient<Database>,
  args: {
    shiftId: string;
    employeeId: string;
    operations: WorkerOperation[];
  },
): Promise<string> {
  const totalQty = args.operations.reduce((s, op) => s + Number(op.qty ?? 0), 0);

  const { data, error } = await client
    .from("shift_workers")
    .upsert(
      {
        shift_id: args.shiftId,
        employee_id: args.employeeId,
        operations: args.operations as unknown as Tables<"shift_workers">["operations"],
        qty_done: totalQty,
      } as never,
      { onConflict: "shift_id,employee_id" },
    )
    .select("id")
    .single();
  if (error) throw error;
  await calculateShiftPay(client, args.shiftId);
  return (data as { id: string }).id;
}

export async function removeWorker(
  client: SupabaseClient<Database>,
  workerId: string,
): Promise<void> {
  const { error } = await client.from("shift_workers").delete().eq("id", workerId);
  if (error) throw error;
}

export async function removeOutput(
  client: SupabaseClient<Database>,
  outputId: string,
): Promise<void> {
  const { error } = await client.from("shift_outputs").delete().eq("id", outputId);
  if (error) throw error;
}

/**
 * Закрытие смены:
 *  1) Считает сделку каждого работника.
 *  2) Списывает сырьё по нормативу (qty × qty_per_pair) и уменьшает остаток.
 *  3) Переводит смену в статус 'closed', проставляет closed_at.
 */
export async function closeShift(
  client: SupabaseClient<Database>,
  shiftId: string,
): Promise<{ consumption: number }> {
  const { data: outsRaw, error: oErr } = await client
    .from("shift_outputs")
    .select("id, article_id, quantity")
    .eq("shift_id", shiftId);
  if (oErr) throw oErr;
  const outs = (outsRaw ?? []) as Pick<
    Tables<"shift_outputs">,
    "id" | "article_id" | "quantity"
  >[];
  if (outs.length === 0) {
    throw new Error("Невозможно закрыть смену без записей выработки");
  }

  await calculateShiftPay(client, shiftId);

  let consumptionCount = 0;
  for (const out of outs) {
    const { data: normsRaw } = await client
      .from("norms")
      .select("material_id, qty_per_pair")
      .eq("article_id", out.article_id);
    const norms = (normsRaw ?? []) as Pick<
      Tables<"norms">,
      "material_id" | "qty_per_pair"
    >[];

    for (const n of norms) {
      const used = Number(n.qty_per_pair) * out.quantity;
      if (used <= 0) continue;

      await client.from("material_consumption").insert({
        shift_id: shiftId,
        material_id: n.material_id,
        qty_used: used,
        is_by_norm: true,
      } as never);

      const { data: matRaw } = await client
        .from("materials")
        .select("current_stock")
        .eq("id", n.material_id)
        .single();
      const mat = matRaw as unknown as Pick<Tables<"materials">, "current_stock">;
      await client
        .from("materials")
        .update({
          current_stock: Math.max(0, Number(mat.current_stock) - used),
        } as never)
        .eq("id", n.material_id);

      consumptionCount += 1;
    }
  }

  const { error: cErr } = await client
    .from("shifts")
    .update({ status: "closed", closed_at: new Date().toISOString() } as never)
    .eq("id", shiftId);
  if (cErr) throw cErr;

  return { consumption: consumptionCount };
}
