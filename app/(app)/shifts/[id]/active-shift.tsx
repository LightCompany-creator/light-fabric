"use client";

import { useTransition } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
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
import {
  addOutputAction,
  addWorkerOperationAction,
} from "../actions";
import { CAST_FORMS_OPTIONS, MACHINE_OPTIONS } from "@/lib/constants";

type Article = { id: string; code: string; name: string };
type Employee = { id: string; tab_number: string; full_name: string };

export function AddOutputForm({
  shiftId,
  articles,
}: {
  shiftId: string;
  articles: Article[];
}) {
  const [pending, start] = useTransition();
  const action = addOutputAction.bind(null, shiftId);

  return (
    <form
      action={(fd: FormData) =>
        start(async () => {
          await action(fd);
          const f = document.getElementById(`output-form-${shiftId}`);
          if (f instanceof HTMLFormElement) f.reset();
        })
      }
      id={`output-form-${shiftId}`}
      className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-12"
    >
      <div className="col-span-2 md:col-span-4 lg:col-span-3">
        <Label htmlFor="article_id">Артикул</Label>
        <Select name="article_id">
          <SelectTrigger>
            <SelectValue placeholder="Выберите артикул" />
          </SelectTrigger>
          <SelectContent>
            {articles.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.code} · {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="lg:col-span-1">
        <Label htmlFor="cast_forms">Вид</Label>
        <Select name="cast_forms" defaultValue="none">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {CAST_FORMS_OPTIONS.map((n) => (
              <SelectItem key={n} value={String(n)}>
                {n}-парка
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="lg:col-span-1">
        <Label htmlFor="quantity">Пар</Label>
        <Input id="quantity" name="quantity" type="number" inputMode="numeric" min={1} required />
      </div>
      <div className="lg:col-span-1">
        <Label htmlFor="weight">Кг</Label>
        <Input id="weight" name="weight" type="number" inputMode="decimal" step="0.01" />
      </div>
      <div className="lg:col-span-1">
        <Label htmlFor="defect_qty">Брак</Label>
        <Input id="defect_qty" name="defect_qty" type="number" inputMode="numeric" min={0} defaultValue={0} />
      </div>
      <div className="col-span-2 md:col-span-2 lg:col-span-2">
        <Label htmlFor="machine">Машина</Label>
        <Select name="machine" defaultValue="none">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">—</SelectItem>
            {MACHINE_OPTIONS.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="lg:col-span-1">
        <Label htmlFor="downtime_min">Простой</Label>
        <Input id="downtime_min" name="downtime_min" type="number" inputMode="numeric" min={0} defaultValue={0} />
      </div>
      <div className="col-span-2 md:col-span-4 lg:col-span-2 flex items-end">
        <Button type="submit" disabled={pending} size="lg" className="w-full">
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
          Добавить
        </Button>
      </div>
    </form>
  );
}

export function AddWorkerOperationForm({
  shiftId,
  articles,
  employees,
}: {
  shiftId: string;
  articles: Article[];
  employees: Employee[];
}) {
  const [pending, start] = useTransition();
  const action = addWorkerOperationAction.bind(null, shiftId);

  return (
    <form
      action={(fd: FormData) =>
        start(async () => {
          await action(fd);
          const f = document.getElementById(`worker-form-${shiftId}`);
          if (f instanceof HTMLFormElement) f.reset();
        })
      }
      id={`worker-form-${shiftId}`}
      className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-12"
    >
      <div className="col-span-2 md:col-span-4 lg:col-span-4">
        <Label htmlFor="employee_id">Работник</Label>
        <Select name="employee_id" required>
          <SelectTrigger>
            <SelectValue placeholder="Выберите работника" />
          </SelectTrigger>
          <SelectContent>
            {employees.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.tab_number} · {e.full_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 md:col-span-2 lg:col-span-3">
        <Label htmlFor="op-article_id">Артикул</Label>
        <Select name="article_id" defaultValue="none">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Общая работа</SelectItem>
            {articles.map((a) => (
              <SelectItem key={a.id} value={a.id}>
                {a.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="col-span-2 md:col-span-2 lg:col-span-3">
        <Label htmlFor="operation">Операция</Label>
        <Input id="operation" name="operation" placeholder="литьё, пристрочка..." />
      </div>
      <div className="lg:col-span-1">
        <Label htmlFor="qty">Кол-во</Label>
        <Input id="qty" name="qty" type="number" inputMode="numeric" min={1} required />
      </div>
      <div className="lg:col-span-1 flex items-end">
        <Button type="submit" disabled={pending} size="lg" className="w-full">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          <span className="ml-1 lg:hidden">Добавить</span>
        </Button>
      </div>
    </form>
  );
}

export function DeleteIconForm({
  action,
  payload,
  title,
}: {
  action: (formData: FormData) => Promise<void> | void;
  payload: Record<string, string | number>;
  title: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm("Удалить?")) e.preventDefault();
      }}
    >
      {Object.entries(payload).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        title={title}
        className="text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}

export function CloseShiftButton({ shiftId }: { shiftId: string }) {
  const [pending, start] = useTransition();
  return (
    <form
      action={async (fd: FormData) => {
        start(async () => {
          const { closeShiftAction } = await import("../actions");
          await closeShiftAction(fd);
        });
      }}
      onSubmit={(e) => {
        if (
          !confirm(
            "Закрыть смену? Будет рассчитана зарплата и списано сырьё по нормам. Это необратимо.",
          )
        )
          e.preventDefault();
      }}
    >
      <input type="hidden" name="shift_id" value={shiftId} />
      <Button type="submit" disabled={pending} size="lg" variant="default">
        {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Закрыть смену
      </Button>
    </form>
  );
}
