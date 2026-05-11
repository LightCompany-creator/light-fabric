"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NormSchema } from "./schema";

export type FormState = { error: string | null; fieldErrors?: Record<string, string> };

function parseForm(formData: FormData) {
  return NormSchema.safeParse(Object.fromEntries(formData.entries()));
}

function fieldErrors(error: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createNormAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Проверьте поля", fieldErrors: fieldErrors(parsed.error) };
  }
  const supabase = createClient();
  const { error } = await supabase.from("norms").insert(parsed.data as never);
  if (error) {
    if (error.code === "23505") {
      return {
        error: "Норма для этой пары артикул+материал уже существует",
      };
    }
    return { error: error.message };
  }
  revalidatePath("/catalog/norms");
  redirect("/catalog/norms");
}

export async function updateNormAction(
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
    .from("norms")
    .update(parsed.data as never)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/catalog/norms");
  revalidatePath(`/catalog/norms/${id}`);
  redirect("/catalog/norms");
}

export async function deleteNormAction(formData: FormData) {
  const id = String(formData.get("id"));
  if (!id) return;
  const supabase = createClient();
  await supabase.from("norms").delete().eq("id", id);
  revalidatePath("/catalog/norms");
}
