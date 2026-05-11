"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArticleSchema } from "./schema";

export type FormState = { error: string | null; fieldErrors?: Record<string, string> };

function parseForm(formData: FormData) {
  const obj = Object.fromEntries(formData.entries());
  // checkbox is_active не приходит когда unchecked — нормализуем
  const normalized = {
    ...obj,
    is_active: obj.is_active === "on" || obj.is_active === "true",
  };
  return ArticleSchema.safeParse(normalized);
}

function zodErrorsToFields(error: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createArticleAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      error: "Проверьте поля формы",
      fieldErrors: zodErrorsToFields(parsed.error),
    };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("articles")
    .insert(parsed.data as never);
  if (error) {
    if (error.code === "23505") {
      return { error: "Артикул с таким кодом уже существует", fieldErrors: { code: "Дубликат" } };
    }
    return { error: error.message };
  }
  revalidatePath("/catalog/articles");
  redirect("/catalog/articles");
}

export async function updateArticleAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return {
      error: "Проверьте поля формы",
      fieldErrors: zodErrorsToFields(parsed.error),
    };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("articles")
    .update(parsed.data as never)
    .eq("id", id);
  if (error) {
    if (error.code === "23505") {
      return { error: "Артикул с таким кодом уже существует", fieldErrors: { code: "Дубликат" } };
    }
    return { error: error.message };
  }
  revalidatePath("/catalog/articles");
  revalidatePath(`/catalog/articles/${id}`);
  redirect("/catalog/articles");
}

export async function deleteArticleAction(formData: FormData) {
  const id = String(formData.get("id"));
  if (!id) return;
  const supabase = createClient();
  await supabase.from("articles").delete().eq("id", id);
  revalidatePath("/catalog/articles");
}
