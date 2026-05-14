"use client";

import { useFormState, useFormStatus } from "react-dom";
import { CheckCircle2, FileUp, Loader2, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  importArticlesAction,
  importEmployeesAction,
  type ArticleImportState,
  type EmployeeImportState,
  type RowIssue,
} from "./actions";

const INITIAL_EMP: EmployeeImportState = { error: null };
const INITIAL_ART: ArticleImportState = { error: null };

export function EmployeesImportForm() {
  const [state, action] = useFormState(importEmployeesAction, INITIAL_EMP);
  return (
    <ImportFormShell
      title="Импорт работников"
      action={action}
      error={state.error}
      preview={state.preview}
      applied={state.applied}
      requiredColumns={[
        "tab_number (Таб.№)",
        "full_name (ФИО)",
        "workshop_code (Код цеха — LIT, PACK…)",
        "position",
        "role (foreman/technologist/director/accountant)",
        "hire_date (ДД.ММ.ГГГГ)",
        "is_active (1/0 или да/нет)",
      ]}
    />
  );
}

export function ArticlesImportForm() {
  const [state, action] = useFormState(importArticlesAction, INITIAL_ART);
  return (
    <ImportFormShell
      title="Импорт артикулов"
      action={action}
      error={state.error}
      preview={state.preview}
      applied={state.applied}
      requiredColumns={[
        "code (Код)",
        "name (Наименование)",
        "material (ЭВА/ПВХ/силикон/...)",
        "box_qty (Пар в коробке)",
        "size_min / size_max",
        "wholesale_price",
      ]}
    />
  );
}

function ImportFormShell({
  title,
  action,
  error,
  preview,
  applied,
  requiredColumns,
}: {
  title: string;
  action: (formData: FormData) => void;
  error: string | null;
  preview?: { total: number; valid: unknown[]; errors: RowIssue[] };
  applied?: {
    inserted: number;
    updated: number;
    failed: number;
    firstError: string | null;
  };
  requiredColumns: string[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <details className="text-sm text-muted-foreground">
          <summary className="cursor-pointer">Какие колонки должны быть в файле?</summary>
          <ul className="mt-2 list-disc space-y-1 pl-6 font-mono text-xs">
            {requiredColumns.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </details>

        <form action={action} className="space-y-3">
          <input
            type="file"
            name="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-sm file:font-medium file:text-secondary-foreground hover:file:bg-secondary/80"
            required
          />
          <div className="flex gap-2">
            <SubmitButton mode="preview" label="Проверить" icon="shield" />
            <SubmitButton mode="apply" label="Применить" icon="upload" />
          </div>
        </form>

        {error ? (
          <p className="flex items-start gap-2 text-sm text-destructive">
            <X className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </p>
        ) : null}

        {applied ? (
          <div className="space-y-2">
            <p className="flex items-start gap-2 text-sm text-success">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              Применено: {applied.inserted} новых, {applied.updated} обновлено,{" "}
              {applied.failed} с ошибкой
            </p>
            {applied.failed > 0 && applied.firstError ? (
              <p className="flex items-start gap-2 text-sm text-destructive">
                <X className="mt-0.5 h-4 w-4 shrink-0" />
                {applied.firstError}
              </p>
            ) : null}
          </div>
        ) : null}

        {preview ? (
          <div className="rounded-md border p-3">
            <p className="text-sm font-medium">
              Найдено строк: {preview.total} · валидных: {preview.valid.length} ·
              с ошибками: {preview.errors.length}
            </p>
            {preview.errors.length > 0 ? (
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs text-destructive">
                {preview.errors.slice(0, 50).map((e, i) => (
                  <li key={i}>
                    строка {e.rowIndex}
                    {e.field ? `, поле ${e.field}` : ""}: {e.message}
                  </li>
                ))}
                {preview.errors.length > 50 ? (
                  <li className="text-muted-foreground">
                    …и ещё {preview.errors.length - 50}
                  </li>
                ) : null}
              </ul>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function SubmitButton({
  mode,
  label,
  icon,
}: {
  mode: "preview" | "apply";
  label: string;
  icon: "shield" | "upload";
}) {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      name="mode"
      value={mode}
      variant={mode === "apply" ? "default" : "secondary"}
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : icon === "shield" ? (
        <ShieldCheck className="mr-2 h-4 w-4" />
      ) : (
        <FileUp className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  );
}
