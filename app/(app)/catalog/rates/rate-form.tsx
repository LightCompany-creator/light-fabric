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
import { UNIT_TYPE_OPTIONS, type RateInput } from "./schema";
import {
  createRateAction,
  updateRateAction,
  type FormState,
} from "./actions";

const INITIAL: FormState = { error: null };

type Mode = { mode: "create" } | { mode: "edit"; id: string };
type Workshop = { id: string; code: string; name: string };
type Article = { id: string; code: string; name: string };

export function RateForm({
  workshops,
  articles,
  initial,
  ...rest
}: Mode & {
  workshops: Workshop[];
  articles: Article[];
  initial?: Partial<RateInput>;
}) {
  const action =
    rest.mode === "create"
      ? createRateAction
      : updateRateAction.bind(null, rest.id);
  const [state, formAction] = useFormState(action, INITIAL);
  const errs = state.fieldErrors ?? {};
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Куда применяется</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Цех"
            name="workshop_id"
            error={errs.workshop_id}
            defaultValue={initial?.workshop_id ?? ""}
            options={workshops.map((w) => ({
              value: w.id,
              label: `${w.code} · ${w.name}`,
            }))}
            placeholder="Выберите цех"
          />
          <SelectField
            label="Артикул (опционально)"
            name="article_id"
            error={errs.article_id}
            defaultValue={initial?.article_id ?? "none"}
            options={[
              { value: "none", label: "Общая ставка цеха" },
              ...articles.map((a) => ({ value: a.id, label: `${a.code} · ${a.name}` })),
            ]}
          />
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="f-operation">Операция (опционально)</Label>
            <Input
              id="f-operation"
              name="operation"
              defaultValue={initial?.operation ?? ""}
              placeholder="Пристрочка манжета, литьё, склейка..."
            />
            {errs.operation ? (
              <p className="text-xs text-destructive">{errs.operation}</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Расценка</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field
            label="Сумма, ₽"
            name="rate_per_unit"
            type="number"
            step="0.01"
            min={0}
            error={errs.rate_per_unit}
            defaultValue={initial?.rate_per_unit ?? ""}
            required
          />
          <SelectField
            label="За что"
            name="unit_type"
            error={errs.unit_type}
            defaultValue={initial?.unit_type ?? "пара"}
            options={UNIT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Период действия</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Действует с"
            name="valid_from"
            type="date"
            error={errs.valid_from}
            defaultValue={initial?.valid_from ?? today}
            required
          />
          <Field
            label="Действует по (пусто = бессрочно)"
            name="valid_to"
            type="date"
            error={errs.valid_to}
            defaultValue={initial?.valid_to ?? ""}
          />
        </CardContent>
      </Card>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" asChild>
          <Link href="/catalog/rates">Отмена</Link>
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
  placeholder,
}: {
  label: string;
  name: string;
  error?: string;
  defaultValue: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`f-${name}`}>{label}</Label>
      <Select name={name} defaultValue={defaultValue}>
        <SelectTrigger id={`f-${name}`}>
          <SelectValue placeholder={placeholder} />
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
