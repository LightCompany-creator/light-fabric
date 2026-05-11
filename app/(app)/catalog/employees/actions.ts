"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EmployeeSchema } from "./schema";

export type FormState = {
  error: string | null;
  fieldErrors?: Record<string, string>;
};

function parseForm(formData: FormData) {
  const obj = Object.fromEntries(formData.entries());
  const normalized = {
    ...obj,
    is_active: obj.is_active === "on" || obj.is_active === "true",
  };
  return EmployeeSchema.safeParse(normalized);
}

function zodErrorsToFields(error: import("zod").ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function createEmployeeAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Проверьте поля", fieldErrors: zodErrorsToFields(parsed.error) };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("employees")
    .insert(parsed.data as never);
  if (error) {
    if (error.code === "23505") {
      return {
        error: "Табельный номер уже занят",
        fieldErrors: { tab_number: "Дубликат" },
      };
    }
    return { error: error.message };
  }
  revalidatePath("/catalog/employees");
  redirect("/catalog/employees");
}

export async function updateEmployeeAction(
  id: string,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { error: "Проверьте поля", fieldErrors: zodErrorsToFields(parsed.error) };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("employees")
    .update(parsed.data as never)
    .eq("id", id);
  if (error) {
    if (error.code === "23505") {
      return {
        error: "Табельный номер уже занят",
        fieldErrors: { tab_number: "Дубликат" },
      };
    }
    return { error: error.message };
  }
  revalidatePath("/catalog/employees");
  revalidatePath(`/catalog/employees/${id}`);
  redirect("/catalog/employees");
}

export async function deleteEmployeeAction(formData: FormData) {
  const id = String(formData.get("id"));
  if (!id) return;
  const supabase = createClient();
  await supabase.from("employees").delete().eq("id", id);
  revalidatePath("/catalog/employees");
}
