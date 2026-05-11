"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  applyArticlesImport,
  applyEmployeesImport,
  parseArticlesXlsx,
  parseEmployeesXlsx,
  type ImportPreview,
  type ArticleImportRow,
  type EmployeeImportRow,
  type RowIssue,
} from "@/lib/services/imports";

export type EmployeeImportState = {
  error: string | null;
  preview?: ImportPreview<EmployeeImportRow>;
  applied?: { inserted: number; updated: number; failed: number };
};

export type ArticleImportState = {
  error: string | null;
  preview?: ImportPreview<ArticleImportRow>;
  applied?: { inserted: number; updated: number; failed: number };
};

async function readFile(formData: FormData): Promise<ArrayBuffer | null> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return null;
  return await file.arrayBuffer();
}

export async function importEmployeesAction(
  _prev: EmployeeImportState,
  formData: FormData,
): Promise<EmployeeImportState> {
  const buf = await readFile(formData);
  if (!buf) return { error: "Файл не выбран" };

  const preview = parseEmployeesXlsx(buf);
  const mode = String(formData.get("mode") ?? "preview");

  if (mode !== "apply") return { error: null, preview };

  if (preview.errors.length > 0) {
    return { error: "Сначала исправьте ошибки или используйте dry-run", preview };
  }
  const supabase = createClient();
  try {
    const applied = await applyEmployeesImport(supabase, preview.valid);
    revalidatePath("/sync/log");
    revalidatePath("/catalog/employees");
    return { error: null, preview, applied };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Ошибка применения",
      preview,
    };
  }
}

export async function importArticlesAction(
  _prev: ArticleImportState,
  formData: FormData,
): Promise<ArticleImportState> {
  const buf = await readFile(formData);
  if (!buf) return { error: "Файл не выбран" };

  const preview = parseArticlesXlsx(buf);
  const mode = String(formData.get("mode") ?? "preview");

  if (mode !== "apply") return { error: null, preview };

  if (preview.errors.length > 0) {
    return { error: "Сначала исправьте ошибки или используйте dry-run", preview };
  }
  const supabase = createClient();
  try {
    const applied = await applyArticlesImport(supabase, preview.valid);
    revalidatePath("/sync/log");
    revalidatePath("/catalog/articles");
    return { error: null, preview, applied };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Ошибка применения",
      preview,
    };
  }
}

export type { RowIssue };
