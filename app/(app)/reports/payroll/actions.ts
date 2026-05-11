"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPayrollLines } from "@/lib/services/reports";

export type FormState = { error: string | null; ok?: number };

export async function createPayrollLinesAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const start = String(formData.get("from") ?? "");
  const end = String(formData.get("to") ?? "");
  const period =
    String(formData.get("period") ?? "") || (start ? start.slice(0, 7) : "");
  if (!start || !end) return { error: "Укажите период" };
  const supabase = createClient();
  try {
    const saved = await createPayrollLines(supabase, period, start, end);
    revalidatePath("/reports/payroll");
    return { error: null, ok: saved };
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Не удалось сформировать" };
  }
}
