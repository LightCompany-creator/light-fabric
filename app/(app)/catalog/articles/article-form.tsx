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
import { MATERIAL_OPTIONS, type ArticleInput } from "./schema";
import { createArticleAction, updateArticleAction, type FormState } from "./actions";

const INITIAL: FormState = { error: null };

type Mode = { mode: "create" } | { mode: "edit"; id: string };

export function ArticleForm({
  initial,
  ...rest
}: Mode & {
  initial?: Partial<ArticleInput>;
}) {
  const action =
    rest.mode === "create"
      ? createArticleAction
      : updateArticleAction.bind(null, rest.id);
  const [state, formAction] = useFormState(action, INITIAL);
  const errs = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Основное</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Код артикула" name="code" error={errs.code} defaultValue={initial?.code} required />
          <Field label="Название" name="name" error={errs.name} defaultValue={initial?.name} required />
          <SelectField
            label="Материал"
            name="material"
            error={errs.material}
            defaultValue={initial?.material ?? "ЭВА"}
            options={MATERIAL_OPTIONS.map((m) => ({ value: m, label: m }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Размеры и упаковка</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Field label="Пар в коробке" name="box_qty" type="number" min={1} error={errs.box_qty} defaultValue={initial?.box_qty ?? 12} required />
          <Field label="Размер от" name="size_min" type="number" error={errs.size_min} defaultValue={initial?.size_min ?? ""} />
          <Field label="Размер до" name="size_max" type="number" error={errs.size_max} defaultValue={initial?.size_max ?? ""} />
          <Field label="Вес пары, кг" name="weight_per_pair" type="number" step="0.001" error={errs.weight_per_pair} defaultValue={initial?.weight_per_pair ?? ""} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Цена</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Оптовая цена, ₽" name="wholesale_price" type="number" step="0.01" error={errs.wholesale_price} defaultValue={initial?.wholesale_price ?? ""} />
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

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" asChild>
          <Link href="/catalog/articles">Отмена</Link>
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

function SelectField({
  label,
  name,
  error,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  error?: string;
  defaultValue: string;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`f-${name}`}>{label}</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger id={`f-${name}`}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
