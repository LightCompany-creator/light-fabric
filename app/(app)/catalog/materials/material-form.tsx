"use client";

import Link from "next/link";
import { useFormState, useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UNIT_OPTIONS, type MaterialInput } from "./schema";
import {
  createMaterialAction,
  updateMaterialAction,
  type FormState,
} from "./actions";

const INITIAL: FormState = { error: null };

type Mode = { mode: "create" } | { mode: "edit"; id: string };

export function MaterialForm({
  initial,
  ...rest
}: Mode & { initial?: Partial<MaterialInput> }) {
  const action =
    rest.mode === "create"
      ? createMaterialAction
      : updateMaterialAction.bind(null, rest.id);
  const [state, formAction] = useFormState(action, INITIAL);
  const errs = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Материал</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Код" name="code" error={errs.code} defaultValue={initial?.code} required />
          <Field label="Название" name="name" error={errs.name} defaultValue={initial?.name} required />
          <div className="space-y-1.5">
            <Label htmlFor="f-unit">Единица измерения</Label>
            <Select name="unit" defaultValue={initial?.unit ?? "кг"}>
              <SelectTrigger id="f-unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UNIT_OPTIONS.map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label className="flex items-end gap-2 text-sm">
            <input
              type="checkbox"
              name="is_active"
              defaultChecked={initial?.is_active ?? true}
              className="h-4 w-4"
            />
            Активен
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Остатки</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Текущий остаток"
            name="current_stock"
            type="number"
            step="0.001"
            error={errs.current_stock}
            defaultValue={initial?.current_stock ?? 0}
          />
          <Field
            label="Мин. остаток (для оповещений)"
            name="min_stock"
            type="number"
            step="0.001"
            error={errs.min_stock}
            defaultValue={initial?.min_stock ?? 0}
          />
        </CardContent>
      </Card>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" asChild>
          <Link href="/catalog/materials">Отмена</Link>
        </Button>
        <SubmitButton mode={rest.mode} />
      </div>
    </form>
  );
}

function SubmitButton({ mode }: { mode: "create" | "edit" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {mode === "create" ? "Создать" : "Сохранить"}
    </Button>
  );
}

function Field({
  label,
  error,
  ...input
}: {
  label: string;
  error?: string;
} & React.ComponentProps<typeof Input>) {
  const id = `f-${input.name}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...input} />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
