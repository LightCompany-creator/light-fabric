"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser, type CurrentUser } from "@/lib/auth";
import {
  acceptSuborder,
  addSuborderLine,
  closeSuborderByProduction,
  closeSuborderByWorkshop,
  removeSuborderLine,
  reopenSuborder,
  requestCorrection,
  resolveCorrection,
} from "@/lib/services/orders";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type FormState = { error: string | null };

function errMessage(e: unknown, fallback: string): string {
  if (e && typeof e === "object") {
    const err = e as { message?: string; details?: string };
    return err.message || err.details || fallback;
  }
  return fallback;
}

function canManageProduction(role: string | null | undefined): boolean {
  return role === "production_manager" || role === "admin";
}

/** Начальник цеха-получателя подзаказа (или админ). */
async function assertWorkshopSide(
  client: SupabaseClient<Database>,
  user: CurrentUser | null,
  suborderId: string,
): Promise<string | null> {
  if (!user) return "Не авторизован";
  if (user.role === "admin") return null;
  if (user.role !== "foreman") return "Эту операцию выполняет начальник цеха";

  const { data, error } = await client
    .from("production_suborders")
    .select("workshop_id")
    .eq("id", suborderId)
    .single();
  if (error) return "Подзаказ не найден";
  const workshopId = (data as { workshop_id: string }).workshop_id;
  if (workshopId !== user.employee?.workshop_id) {
    return "Этот подзаказ назначен другому цеху";
  }
  return null;
}

function revalidateSuborder(suborderId: string) {
  revalidatePath(`/orders/suborders/${suborderId}`);
  revalidatePath("/orders/suborders");
}

export async function addSuborderLineAction(
  suborderId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const articleId = String(formData.get("article_id") || "");
  const qty = Number(formData.get("qty") || 0);
  if (!articleId) return { error: "Выберите артикул" };
  if (!qty || qty <= 0) return { error: "Укажите количество" };

  const user = await getCurrentUser();
  if (!canManageProduction(user?.role)) {
    return { error: "Строки плана меняет начальник производства" };
  }

  const supabase = createClient();
  try {
    await addSuborderLine(supabase, { suborderId, articleId, qty });
    revalidateSuborder(suborderId);
    return { error: null };
  } catch (e) {
    console.error("[addSuborderLineAction] failed:", e);
    return { error: errMessage(e, "Не удалось добавить строку") };
  }
}

export async function removeSuborderLineAction(formData: FormData) {
  const suborderId = String(formData.get("suborder_id"));
  const lineId = String(formData.get("id"));
  const user = await getCurrentUser();
  if (!canManageProduction(user?.role)) return;

  const supabase = createClient();
  await removeSuborderLine(supabase, lineId);
  revalidateSuborder(suborderId);
}

export async function acceptSuborderAction(
  suborderId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: FormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  const supabase = createClient();
  const denied = await assertWorkshopSide(supabase, user, suborderId);
  if (denied) return { error: denied };

  try {
    await acceptSuborder(supabase, { suborderId, acceptedBy: user!.employee?.id ?? null });
    revalidateSuborder(suborderId);
    revalidatePath("/orders");
    return { error: null };
  } catch (e) {
    console.error("[acceptSuborderAction] failed:", e);
    return { error: errMessage(e, "Не удалось принять подзаказ") };
  }
}

export async function requestCorrectionAction(
  suborderId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const comment = String(formData.get("comment") || "").trim();
  if (!comment) return { error: "Опишите, что нужно скорректировать" };

  const user = await getCurrentUser();
  const supabase = createClient();
  const denied = await assertWorkshopSide(supabase, user, suborderId);
  if (denied) return { error: denied };

  try {
    await requestCorrection(supabase, { suborderId, comment });
    revalidateSuborder(suborderId);
    return { error: null };
  } catch (e) {
    console.error("[requestCorrectionAction] failed:", e);
    return { error: errMessage(e, "Не удалось запросить корректировку") };
  }
}

export async function resolveCorrectionAction(
  suborderId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!canManageProduction(user?.role)) {
    return { error: "Разрешить корректировку может начальник производства" };
  }
  const dueDate = (formData.get("due_date") as string) || null;

  const supabase = createClient();
  try {
    await resolveCorrection(supabase, { suborderId, dueDate });
    revalidateSuborder(suborderId);
    return { error: null };
  } catch (e) {
    console.error("[resolveCorrectionAction] failed:", e);
    return { error: errMessage(e, "Не удалось обновить подзаказ") };
  }
}

export async function closeSuborderWorkshopAction(
  suborderId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: FormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  const supabase = createClient();
  const denied = await assertWorkshopSide(supabase, user, suborderId);
  if (denied) return { error: denied };

  try {
    await closeSuborderByWorkshop(supabase, {
      suborderId,
      confirmedBy: user!.employee?.id ?? null,
    });
    revalidateSuborder(suborderId);
    revalidatePath("/orders");
    return { error: null };
  } catch (e) {
    console.error("[closeSuborderWorkshopAction] failed:", e);
    return { error: errMessage(e, "Не удалось подтвердить выполнение") };
  }
}

export async function closeSuborderProductionAction(
  suborderId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: FormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!canManageProduction(user?.role)) {
    return { error: "Подтвердить приёмку может начальник производства" };
  }

  const supabase = createClient();
  try {
    await closeSuborderByProduction(supabase, {
      suborderId,
      confirmedBy: user!.employee?.id ?? null,
    });
    revalidateSuborder(suborderId);
    revalidatePath("/orders");
    return { error: null };
  } catch (e) {
    console.error("[closeSuborderProductionAction] failed:", e);
    return { error: errMessage(e, "Не удалось подтвердить приёмку") };
  }
}

export async function reopenSuborderAction(
  suborderId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: FormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (user?.role !== "admin") {
    return { error: "Переоткрыть закрытый подзаказ может только администратор" };
  }

  const supabase = createClient();
  try {
    await reopenSuborder(supabase, { suborderId, reopenedBy: user.employee?.id ?? null });
    revalidateSuborder(suborderId);
    revalidatePath("/orders");
    return { error: null };
  } catch (e) {
    console.error("[reopenSuborderAction] failed:", e);
    return { error: errMessage(e, "Не удалось переоткрыть подзаказ") };
  }
}
