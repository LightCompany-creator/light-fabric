"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import {
  acceptOrder,
  addOrderLine,
  closeOrder,
  createOrder,
  createSuborder,
  deleteOrder,
  removeOrderLine,
  reopenOrder,
} from "@/lib/services/orders";

export type FormState = { error: string | null };

function errMessage(e: unknown, fallback: string): string {
  if (e && typeof e === "object") {
    const err = e as { message?: string; details?: string };
    return err.message || err.details || fallback;
  }
  return fallback;
}

/** Начальник производства и админ — распределяют по цехам, закрывают, переоткрывают. */
function canManageOrders(role: string | null | undefined): boolean {
  return role === "production_manager" || role === "admin";
}

/** Кто может создать главный заказ и его строки — плюс коммерческий директор. */
function canCreateOrder(role: string | null | undefined): boolean {
  return role === "commercial_director" || canManageOrders(role);
}

export async function createOrderAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!canCreateOrder(user?.role)) {
    return { error: "Заказ создаёт коммерческий директор или начальник производства" };
  }

  const orderDate = String(
    formData.get("order_date") || new Date().toISOString().slice(0, 10),
  );
  const dueDate = (formData.get("due_date") as string) || null;
  const comment = (formData.get("comment") as string) || null;

  const supabase = createClient();
  try {
    const { id } = await createOrder(supabase, {
      orderDate,
      dueDate,
      comment,
      createdBy: user!.employee?.id ?? null,
      // Заказ коммерческого директора ждёт приёма; свой (производство/админ) — сразу в работе.
      needsAcceptance: user!.role === "commercial_director",
    });
    revalidatePath("/orders");
    redirect(`/orders/${id}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // redirect re-throw
    console.error("[createOrderAction] failed:", e);
    return { error: errMessage(e, "Не удалось создать заказ") };
  }
}

export async function acceptOrderAction(
  orderId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: FormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!canManageOrders(user?.role)) {
    return { error: "Принять заказ может начальник производства" };
  }

  const supabase = createClient();
  try {
    await acceptOrder(supabase, { orderId, acceptedBy: user!.employee?.id ?? null });
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
    return { error: null };
  } catch (e) {
    console.error("[acceptOrderAction] failed:", e);
    return { error: errMessage(e, "Не удалось принять заказ") };
  }
}

export async function addOrderLineAction(
  orderId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!canCreateOrder(user?.role)) {
    return { error: "Строки заказа меняет коммерческий директор или начальник производства" };
  }

  const articleId = String(formData.get("article_id") || "");
  const qty = Number(formData.get("qty") || 0);
  if (!articleId) return { error: "Выберите артикул" };
  if (!qty || qty <= 0) return { error: "Укажите количество" };

  const supabase = createClient();
  try {
    await addOrderLine(supabase, { orderId, articleId, qty });
    revalidatePath(`/orders/${orderId}`);
    return { error: null };
  } catch (e) {
    console.error("[addOrderLineAction] failed:", e);
    return { error: errMessage(e, "Не удалось добавить строку") };
  }
}

export async function removeOrderLineAction(formData: FormData) {
  const orderId = String(formData.get("order_id"));
  const lineId = String(formData.get("id"));
  const user = await getCurrentUser();
  if (!canCreateOrder(user?.role)) return;

  const supabase = createClient();
  await removeOrderLine(supabase, lineId);
  revalidatePath(`/orders/${orderId}`);
}

export async function deleteOrderAction(formData: FormData) {
  const orderId = String(formData.get("id"));
  const user = await getCurrentUser();
  if (!canCreateOrder(user?.role)) return;

  const supabase = createClient();
  await deleteOrder(supabase, orderId);
  revalidatePath("/orders");
  redirect("/orders");
}

export async function createSuborderAction(
  orderId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!canManageOrders(user?.role)) {
    return { error: "Распределять заказ по цехам может начальник производства" };
  }

  const workshopId = String(formData.get("workshop_id") || "");
  const dueDate = (formData.get("due_date") as string) || null;
  if (!workshopId) return { error: "Выберите цех" };

  const supabase = createClient();
  try {
    const { id } = await createSuborder(supabase, {
      orderId,
      workshopId,
      dueDate,
      createdBy: user!.employee?.id ?? null,
    });
    revalidatePath(`/orders/${orderId}`);
    redirect(`/orders/suborders/${id}`);
  } catch (e) {
    if (e && typeof e === "object" && "digest" in e) throw e; // redirect re-throw
    console.error("[createSuborderAction] failed:", e);
    return { error: errMessage(e, "Не удалось создать подзаказ") };
  }
}

export async function closeOrderAction(
  orderId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: FormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!canManageOrders(user?.role)) {
    return { error: "Закрыть заказ может только начальник производства" };
  }

  const supabase = createClient();
  try {
    await closeOrder(supabase, { orderId, closedBy: user!.employee?.id ?? null });
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
    return { error: null };
  } catch (e) {
    console.error("[closeOrderAction] failed:", e);
    return { error: errMessage(e, "Не удалось закрыть заказ") };
  }
}

export async function reopenOrderAction(
  orderId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _prev: FormState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _formData: FormData,
): Promise<FormState> {
  const user = await getCurrentUser();
  if (!canManageOrders(user?.role)) {
    return { error: "Переоткрыть закрытый заказ может начальник производства или администратор" };
  }

  const supabase = createClient();
  try {
    await reopenOrder(supabase, { orderId, reopenedBy: user!.employee?.id ?? null });
    revalidatePath(`/orders/${orderId}`);
    revalidatePath("/orders");
    return { error: null };
  } catch (e) {
    console.error("[reopenOrderAction] failed:", e);
    return { error: errMessage(e, "Не удалось переоткрыть заказ") };
  }
}
