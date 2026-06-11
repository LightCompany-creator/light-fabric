"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  acceptTransfer,
  addTransferLine,
  createTransfer,
  deleteTransfer,
  removeTransferLine,
  reopenTransfer,
} from "@/lib/services/transfers";

export type FormState = { error: string | null };

function errMessage(e: unknown, fallback: string): string {
  if (e && typeof e === "object") {
    const err = e as { message?: string; details?: string };
    return err.message || err.details || fallback;
  }
  return fallback;
}

export async function createTransferAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user?.employee) return { error: "Профиль работника не найден" };

  const fromWorkshopId = String(
    formData.get("from_workshop_id") || user.employee.workshop_id || "",
  );
  const toWorkshopId = String(formData.get("to_workshop_id") || "");
  const transferDate = String(
    formData.get("transfer_date") || new Date().toISOString().slice(0, 10),
  );
  const comment = (formData.get("comment") as string) || null;

  if (!fromWorkshopId) return { error: "Выберите цех-отправитель" };
  if (!toWorkshopId) return { error: "Выберите цех-получатель" };
  if (fromWorkshopId === toWorkshopId)
    return { error: "Отправитель и получатель не могут совпадать" };

  const supabase = createClient();
  try {
    const { id } = await createTransfer(supabase, {
      fromWorkshopId,
      toWorkshopId,
      transferDate,
      createdBy: user.employee.id,
      comment,
    });
    revalidatePath("/transfers");
    redirect(`/transfers/${id}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // redirect re-throw
    console.error("[createTransferAction] failed:", e);
    return { error: errMessage(e, "Не удалось создать документ") };
  }
}

export async function addLineAction(
  transferId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const articleId = String(formData.get("article_id") || "");
  const qty = Number(formData.get("qty") || 0);
  if (!articleId) return { error: "Выберите артикул" };
  if (!qty || qty <= 0) return { error: "Укажите количество" };

  const supabase = createClient();
  try {
    await addTransferLine(supabase, { transferId, articleId, qty });
    revalidatePath(`/transfers/${transferId}`);
    return { error: null };
  } catch (e) {
    console.error("[addLineAction] failed:", e);
    return { error: errMessage(e, "Не удалось добавить строку") };
  }
}

export async function removeLineAction(formData: FormData) {
  const transferId = String(formData.get("transfer_id"));
  const lineId = String(formData.get("id"));
  const supabase = createClient();
  await removeTransferLine(supabase, lineId);
  revalidatePath(`/transfers/${transferId}`);
}

export async function deleteTransferAction(formData: FormData) {
  const transferId = String(formData.get("id"));
  const supabase = createClient();
  await deleteTransfer(supabase, transferId);
  revalidatePath("/transfers");
  redirect("/transfers");
}

export async function acceptTransferAction(
  transferId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: FormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!user?.employee) return { error: "Профиль работника не найден" };

  const supabase = createClient();
  try {
    await acceptTransfer(supabase, {
      transferId,
      acceptedBy: user.employee.id,
    });
    revalidatePath(`/transfers/${transferId}`);
    revalidatePath("/transfers");
    revalidatePath("/stocks");
    return { error: null };
  } catch (e) {
    console.error("[acceptTransferAction] failed:", e);
    return { error: errMessage(e, "Не удалось принять документ") };
  }
}

export async function reopenTransferAction(
  transferId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: FormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") {
    return { error: "Переоткрыть закрытый документ может только администратор" };
  }

  const supabase = createClient();
  try {
    await reopenTransfer(supabase, {
      transferId,
      reopenedBy: user.employee?.id ?? null,
    });
    revalidatePath(`/transfers/${transferId}`);
    revalidatePath("/transfers");
    revalidatePath("/stocks");
    return { error: null };
  } catch (e) {
    console.error("[reopenTransferAction] failed:", e);
    return { error: errMessage(e, "Не удалось переоткрыть документ") };
  }
}