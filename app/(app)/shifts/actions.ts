"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  addOutput,
  addWorker,
  closeShift,
  openShift,
  removeOutput,
  removeWorker,
} from "@/lib/services/shifts";
import type { WorkerOperation } from "@/lib/services/payroll";

export type FormState = { error: string | null };

export async function openShiftAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user?.employee) return { error: "Профиль работника не найден" };

  const workshopId = String(formData.get("workshop_id") || user.employee.workshop_id || "");
  const shiftType = String(formData.get("shift_type") || "день") as "день" | "ночь";
  const shiftDate = String(formData.get("shift_date") || new Date().toISOString().slice(0, 10));

  if (!workshopId) return { error: "Выберите цех" };

  const supabase = createClient();
  try {
    const { id } = await openShift(supabase, {
      workshopId,
      foremanId: user.employee.id,
      shiftDate,
      shiftType,
    });
    revalidatePath("/shifts");
    redirect(`/shifts/${id}`);
  } catch (e) {
    // Supabase возвращает PostgrestError (обычный объект, не Error).
    // Достаём message максимально мягко и сразу логируем в серверную консоль.
    if (e && typeof e === "object" && "digest" in e) throw e; // redirect re-throw
    const err = e as { message?: string; details?: string; hint?: string; code?: string } | Error;
    const msg =
      (err as { message?: string }).message ||
      (err as { details?: string }).details ||
      "Не удалось открыть смену";
    console.error("[openShiftAction] failed:", err);
    return { error: msg };
  }
}

export async function addOutputAction(shiftId: string, formData: FormData) {
  const supabase = createClient();
  const castFormsRaw = formData.get("cast_forms");
  const castForms =
    castFormsRaw && castFormsRaw !== "none" ? Number(castFormsRaw) : null;
  const machineRaw = formData.get("machine");
  const machine =
    machineRaw && machineRaw !== "none" ? String(machineRaw) : null;
  await addOutput(supabase, {
    shiftId,
    articleId: String(formData.get("article_id")),
    quantity: Number(formData.get("quantity")),
    weight: formData.get("weight") ? Number(formData.get("weight")) : null,
    defectQty: Number(formData.get("defect_qty") || 0),
    machine,
    castForms,
    downtimeMin: Number(formData.get("downtime_min") || 0),
  });
  revalidatePath(`/shifts/${shiftId}`);
}

export async function removeOutputAction(formData: FormData) {
  const shiftId = String(formData.get("shift_id"));
  const outputId = String(formData.get("id"));
  const supabase = createClient();
  await removeOutput(supabase, outputId);
  revalidatePath(`/shifts/${shiftId}`);
}

export async function addWorkerAction(shiftId: string, formData: FormData) {
  const employeeId = String(formData.get("employee_id"));
  const operationsRaw = String(formData.get("operations") || "[]");
  let operations: WorkerOperation[] = [];
  try {
    operations = JSON.parse(operationsRaw);
  } catch {
    operations = [];
  }
  const supabase = createClient();
  await addWorker(supabase, { shiftId, employeeId, operations });
  revalidatePath(`/shifts/${shiftId}`);
}

/**
 * Добавляет одну операцию работнику. Если работника ещё нет в смене — создаёт.
 * UI пользует это в inline-форме «+ операция».
 */
export async function addWorkerOperationAction(shiftId: string, formData: FormData) {
  const employeeId = String(formData.get("employee_id"));
  const articleId = (formData.get("article_id") as string) || null;
  const operation = (formData.get("operation") as string) || null;
  const qty = Number(formData.get("qty") || 0);
  if (!employeeId || !qty) return;

  const supabase = createClient();
  const { data: existingRaw } = await supabase
    .from("shift_workers")
    .select("id, operations")
    .eq("shift_id", shiftId)
    .eq("employee_id", employeeId)
    .maybeSingle();
  const existing = existingRaw as { id: string; operations: WorkerOperation[] | null } | null;

  const prevOps = (existing?.operations ?? []) as WorkerOperation[];
  const nextOps: WorkerOperation[] = [
    ...prevOps,
    {
      article_id: articleId && articleId !== "none" ? articleId : null,
      operation: operation && operation.trim().length > 0 ? operation.trim() : null,
      qty,
    },
  ];

  await addWorker(supabase, { shiftId, employeeId, operations: nextOps });
  revalidatePath(`/shifts/${shiftId}`);
}

export async function removeWorkerOperationAction(formData: FormData) {
  const shiftId = String(formData.get("shift_id"));
  const workerId = String(formData.get("worker_id"));
  const opIndex = Number(formData.get("op_index"));

  const supabase = createClient();
  const { data: rowRaw } = await supabase
    .from("shift_workers")
    .select("operations, employee_id")
    .eq("id", workerId)
    .maybeSingle();
  const row = rowRaw as { operations: WorkerOperation[] | null; employee_id: string } | null;
  if (!row) return;

  const prev = (row.operations ?? []) as WorkerOperation[];
  const nextOps = prev.filter((_, i) => i !== opIndex);

  if (nextOps.length === 0) {
    await supabase.from("shift_workers").delete().eq("id", workerId);
  } else {
    await addWorker(supabase, {
      shiftId,
      employeeId: row.employee_id,
      operations: nextOps,
    });
  }
  revalidatePath(`/shifts/${shiftId}`);
}

export async function removeWorkerAction(formData: FormData) {
  const shiftId = String(formData.get("shift_id"));
  const workerId = String(formData.get("id"));
  const supabase = createClient();
  await removeWorker(supabase, workerId);
  revalidatePath(`/shifts/${shiftId}`);
}

export async function closeShiftAction(formData: FormData) {
  const shiftId = String(formData.get("shift_id"));
  const supabase = createClient();
  await closeShift(supabase, shiftId);
  revalidatePath(`/shifts/${shiftId}`);
  revalidatePath("/shifts");
}
