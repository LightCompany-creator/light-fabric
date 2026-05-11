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
import { ROLE_OPTIONS, type EmployeeInput } from "./schema";
import {
  createEmployeeAction,
  updateEmployeeAction,
  type FormState,
} from "./actions";

const INITIAL: FormState = { error: null };

type Mode = { mode: "create" } | { mode: "edit"; id: string };

type Workshop = { id: string; name: string; code: string };

export function EmployeeForm({
  workshops,
  initial,
  ...rest
}: Mode & {
  workshops: Workshop[];
  initial?: Partial<EmployeeInput>;
}) {
  const action =
    rest.mode === "create"
      ? createEmployeeAction
      : updateEmployeeAction.bind(null, rest.id);
  const [state, formAction] = useFormState(action, INITIAL);
  const errs = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Личные данные</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Табельный номер"
            name="tab_number"
            error={errs.tab_number}
            defaultValue={initial?.tab_number}
            required
          />
          <Field
            label="ФИО"
            name="full_name"
            error={errs.full_name}
            defaultValue={initial?.full_name}
            required
          />
          <Field
            label="Должность"
            name="position"
            error={errs.position}
            defaultValue={initial?.position ?? ""}
            placeholder="Литейщик, Швея, Упаковщик..."
          />
          <Field
            label="Дата приёма"
            name="hire_date"
            type="date"
            error={errs.hire_date}
            defaultValue={initial?.hire_date ?? ""}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Цех и доступ</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <SelectField
            label="Цех"
            name="workshop_id"
            error={errs.workshop_id}
            defaultValue={initial?.workshop_id ?? "none"}
            options={[
              { value: "none", label: "Без цеха" },
              ...workshops.map((w) => ({ value: w.id, label: `${w.code} · ${w.name}` })),
            ]}
          />
          <SelectField
            label="Роль (для входа в систему)"
            name="role"
            error={errs.role}
            defaultValue={initial?.role ?? "none"}
            options={ROLE_OPTIONS}
          />
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

      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}

      <div className="flex justify-end gap-2">
        <Button variant="ghost" asChild>
          <Link href="/catalog/employees">Отмена</Link>
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
