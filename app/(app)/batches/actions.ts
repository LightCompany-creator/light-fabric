"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import { receiveBatch, transferBatch } from "@/lib/services/batches";

export type FormState = { error: string | null };

export async function receiveBatchAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const batchId = String(formData.get("batch_id"));
  const qtyIn = Number(formData.get("qty_in") || 0);
  const defectAtStep = Number(formData.get("defect_at_step") || 0);
  const notes = (formData.get("notes") as string) || null;

  if (!batchId || qtyIn <= 0) return { error: "Укажите принятое количество" };

  const user = await getCurrentUser();
  if (!user?.employee?.workshop_id) {
    return { error: "Не удалось определить ваш цех — обратитесь к технологу" };
  }

  const supabase = createClient();
  try {
    await receiveBatch(supabase, {
      batchId,
      workshopId: user.employee.workshop_id,
      employeeId: user.employee.id,
      qtyIn,
      defectAtStep,
      notes,
    });
    revalidatePath("/batches/incoming");
    revalidatePath("/batches");
    revalidatePath(`/batches/${batchId}`);
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Не удалось принять партию" };
  }
}

export async function transferBatchAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const batchId = String(formData.get("batch_id"));
  const toWorkshopId = String(formData.get("to_workshop_id"));
  const qtyOut = Number(formData.get("qty_out") || 0);
  const notes = (formData.get("notes") as string) || null;

  if (!batchId || !toWorkshopId || qtyOut <= 0) {
    return { error: "Заполните цех и количество" };
  }

  const user = await getCurrentUser();
  const employeeId = user?.employee?.id ?? null;

  const supabase = createClient();
  try {
    await transferBatch(supabase, {
      batchId,
      toWorkshopId,
      employeeId,
      qtyOut,
      notes,
    });
    revalidatePath("/batches");
    revalidatePath(`/batches/${batchId}`);
    return { error: null };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Не удалось передать партию" };
  }
}
