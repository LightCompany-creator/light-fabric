"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { MaterialSchema } from "./schema";

export type FormState = { error: string | null; fieldErrors?: Record<string, string> };

function parseForm(formData: FormData) {
  const obj = Object.fromEntries(formData.entries());
  return MaterialSchema.safeParse({
    ...obj,
    is_active: obj.is_active === "on" || obj.is_active === "true",
  });
}

function fieldErrors(error: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createMaterialAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Проверьте поля", fieldErrors: fieldErrors(parsed.error) };
  }
  const supabase = createClient();
  const { error } = await supabase.from("materials").insert(parsed.data as never);
  if (error) {
    if (error.code === "23505") {
      return { error: "Материал с таким кодом уже существует", fieldErrors: { code: "Дубликат" } };
    }
    return { error: error.message };
  }
  revalidatePath("/catalog/materials");
  redirect("/catalog/materials");
}

export async function updateMaterialAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Проверьте поля", fieldErrors: fieldErrors(parsed.error) };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("materials")
    .update(parsed.data as never)
    .eq("id", id);
  if (error) {
    if (error.code === "23505") {
      return { error: "Материал с таким кодом уже существует", fieldErrors: { code: "Дубликат" } };
    }
    return { error: error.message };
  }
  revalidatePath("/catalog/materials");
  revalidatePath(`/catalog/materials/${id}`);
  redirect("/catalog/materials");
}

export async function deleteMaterialAction(formData: FormData) {
  const id = String(formData.get("id"));
  if (!id) return;
  const supabase = createClient();
  await supabase.from("materials").delete().eq("id", id);
  revalidatePath("/catalog/materials");
}
