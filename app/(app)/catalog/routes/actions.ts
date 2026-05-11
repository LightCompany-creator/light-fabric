"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { WORKSHOP_CODES, type WorkshopCode } from "@/lib/constants";

export type FormState = { error: string | null; ok?: boolean };

export async function saveRouteAction(
  articleId: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const raw = String(formData.get("sequence") ?? "[]");
  let sequence: WorkshopCode[];
  try {
    sequence = JSON.parse(raw);
  } catch {
    return { error: "Не удалось разобрать последовательность" };
  }
  if (!Array.isArray(sequence) || sequence.length === 0) {
    return { error: "Маршрут не может быть пустым — добавьте хотя бы один цех" };
  }
  const invalid = sequence.find((code) => !WORKSHOP_CODES.includes(code));
  if (invalid) {
    return { error: `Неизвестный код цеха: ${invalid}` };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("routes")
    .upsert(
      { article_id: articleId, sequence, is_active: true } as never,
      { onConflict: "article_id" },
    );
  if (error) return { error: error.message };

  revalidatePath("/catalog/routes");
  revalidatePath(`/catalog/routes/${articleId}`);
  return { error: null, ok: true };
}
