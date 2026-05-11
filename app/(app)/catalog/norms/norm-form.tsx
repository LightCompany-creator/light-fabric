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
import { type NormInput } from "./schema";
import {
  createNormAction,
  updateNormAction,
  type FormState,
} from "./actions";

const INITIAL: FormState = { error: null };

type Mode = { mode: "create" } | { mode: "edit"; id: string };
type Article = { id: string; code: string; name: string };
type Material = { id: string; code: string; name: string; unit: string };

export function NormForm({
  articles,
  materials,
  initial,
  ...rest
}: Mode & {
  articles: Article[];
  materials: Material[];
  initial?: Partial<NormInput>;
}) {
  const action =
    rest.mode === "create"
      ? createNormAction
      : updateNormAction.bind(null, rest.id);
  const [state, formAction] = useFormState(action, INITIAL);
  const errs = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Норма расхода</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Артикул"
            name="article_id"
            error={errs.article_id}
            defaultValue={initial?.article_id ?? ""}
            options={articles.map((a) => ({
              value: a.id,
              label: `${a.code} · ${a.name}`,
            }))}
            placeholder="Выберите артикул"
          />
          <SelectField
            label="Материал"
            name="material_id"
            error={errs.material_id}
            defaultValue={initial?.material_id ?? ""}
            options={materials.map((m) => ({
              value: m.id,
              label: `${m.code} · ${m.name} (${m.unit})`,
            }))}
            placeholder="Выберите материал"
          />
          <Field
            label="Расход на пару"
            name="qty_per_pair"
            type="number"
            step="0.0001"
            min={0}
            error={errs.qty_per_pair}
            defaultValue={initial?.qty_per_pair ?? ""}
            required
          />
          <div className="space-y-1.5">
            <Label htmlFor="f-notes">Примечание</Label>
            <Input
              id="f-notes"
              name="notes"
              defaultValue={initial?.notes ?? ""}
              placeholder="например: с допуском 5%"
            />
          </div>
        </CardContent>
      </Card>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" asChild>
          <Link href="/catalog/norms">Отмена</Link>
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
