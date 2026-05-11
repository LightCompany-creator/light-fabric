"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { RateSchema } from "./schema";

export type FormState = { error: string | null; fieldErrors?: Record<string, string> };

function parseForm(formData: FormData) {
  const obj = Object.fromEntries(formData.entries());
  return RateSchema.safeParse(obj);
}

function fieldErrors(error: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createRateAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Проверьте поля", fieldErrors: fieldErrors(parsed.error) };
  }
  const supabase = createClient();
  const { error } = await supabase.from("rates").insert(parsed.data as never);
  if (error) return { error: error.message };
  revalidatePath("/catalog/rates");
  redirect("/catalog/rates");
}

export async function updateRateAction(
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
    .from("rates")
    .update(parsed.data as never)
    .eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/catalog/rates");
  revalidatePath(`/catalog/rates/${id}`);
  redirect("/catalog/rates");
}

export async function deleteRateAction(formData: FormData) {
  const id = String(formData.get("id"));
  if (!id) return;
  const supabase = createClient();
  await supabase.from("rates").delete().eq("id", id);
  revalidatePath("/catalog/rates");
}
