"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
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
import { queueAdd, isNetworkError } from "@/lib/offline-queue";

type Article = {
  id: string;
  code: string;
  name: string;
  weight_per_pair?: number | null;
};
type Employee = { id: string; tab_number: string; full_name: string };
type OperationOption = { value: string; label: string };

export function AddOutputForm({
  shiftId,
  articles,
}: {
  shiftId: string;
  articles: Article[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [queueHint, setQueueHint] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string>("");
  const [quantity, setQuantity] = useState<string>("");
  const [weightOverridden, setWeightOverridden] = useState(false);
  const action = addOutputAction.bind(null, shiftId);

  // Автовес: weight_per_pair × quantity. Пользователь может переписать —
  // тогда автоподстановка перестаёт работать на эту запись.
  const selectedArticle = articles.find((a) => a.id === selectedArticleId);
  const wpp = Number(selectedArticle?.weight_per_pair ?? 0);
  const qty = Number(quantity || 0);
  const autoWeight =
    !weightOverridden && wpp > 0 && qty > 0 ? (wpp * qty).toFixed(2) : "";

  const resetForm = () => {
    setSelectedArticleId("");
    setQuantity("");
    setWeightOverridden(false);
    const f = document.getElementById(`output-form-${shiftId}`);
    if (f instanceof HTMLFormElement) f.reset();
  };

  const submit = (fd: FormData) => {
    // Если оффлайн или была сетевая ошибка — кладём в очередь сразу.
    const isOffline =
      typeof navigator !== "undefined" && navigator.onLine === false;
    if (isOffline) {
      const payload: Record<string, string> = {};
      fd.forEach((v, k) => {
        payload[k] = String(v);
      });
      queueAdd("addOutput", payload, { shiftId });
      setQueueHint("Сети нет — запись отложена. Отправлю как только связь появится.");
      resetForm();
      return;
    }

    start(async () => {
      try {
        await action(fd);
        setQueueHint(null);
        resetForm();
        router.refresh();
      } catch (e) {
        if (isNetworkError(e)) {
          const payload: Record<string, string> = {};
          fd.forEach((v, k) => {
            payload[k] = String(v);
          });
          queueAdd("addOutput", payload, { shiftId });
          setQueueHint("Связь оборвалась — запись отложена в очередь.");
          resetForm();
        } else {
          throw e;
        }
      }
    });
  };

  return (
    <form
      action={submit}
      id={`output-form-${shiftId}`}
      className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-12"
    >
      <div className="col-span-2 md:col-span-4 lg:col-span-3">
        <Label htmlFor="article_id">Артикул</Label>
        <Select
          name="article_id"
          value={selectedArticleId}
          onValueChange={(v) => {
            setSelectedArticleId(v);
            setWeightOverridden(false);
          }}
        >
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
        <Input
          id="quantity"
          name="quantity"
          type="number"
          inputMode="numeric"
          min={1}
          required
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
      </div>
      <div className="lg:col-span-1">
        <Label htmlFor="weight" className="flex items-center gap-1">
          Кг
          {autoWeight && !weightOverridden ? (
            <span className="text-[10px] font-normal text-muted-foreground">авто</span>
          ) : null}
        </Label>
        <Input
          id="weight"
          name="weight"
          type="number"
          inputMode="decimal"
          step="0.01"
          value={weightOverridden ? undefined : autoWeight}
          onChange={(e) => {
            // Если пользователь ввёл свой вес — отключаем автоподстановку.
            // Если стёр поле — снова берём авто.
            setWeightOverridden(e.target.value !== "" && e.target.value !== autoWeight);
          }}
          defaultValue={undefined}
        />
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
      {queueHint ? (
        <p className="col-span-2 md:col-span-4 lg:col-span-12 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent-foreground">
          {queueHint}
        </p>
      ) : null}
    </form>
  );
}

export function AddWorkerOperationForm({
  shiftId,
  articles,
  employees,
  operationOptions,
}: {
  shiftId: string;
  articles: Article[];
  employees: Employee[];
  operationOptions: OperationOption[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [queueHint, setQueueHint] = useState<string | null>(null);
  const action = addWorkerOperationAction.bind(null, shiftId);

  const submit = (fd: FormData) => {
    const isOffline =
      typeof navigator !== "undefined" && navigator.onLine === false;
    const queueIt = () => {
      const payload: Record<string, string> = {};
      fd.forEach((v, k) => {
        payload[k] = String(v);
      });
      queueAdd("addWorker", payload, { shiftId });
      const f = document.getElementById(`worker-form-${shiftId}`);
      if (f instanceof HTMLFormElement) f.reset();
    };

    if (isOffline) {
      queueIt();
      setQueueHint("Сети нет — операция отложена в очередь.");
      return;
    }

    start(async () => {
      try {
        await action(fd);
        setQueueHint(null);
        const f = document.getElementById(`worker-form-${shiftId}`);
        if (f instanceof HTMLFormElement) f.reset();
        router.refresh();
      } catch (e) {
        if (isNetworkError(e)) {
          queueIt();
          setQueueHint("Связь оборвалась — операция отложена в очередь.");
        } else {
          throw e;
        }
      }
    });
  };

  return (
    <form
      action={submit}
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
        <Select name="operation" defaultValue={operationOptions[0]?.value ?? "none"}>
          <SelectTrigger id="operation">
            <SelectValue placeholder="Выберите операцию" />
          </SelectTrigger>
          <SelectContent>
            {operationOptions.length === 0 ? (
              <SelectItem value="none">Общая работа</SelectItem>
            ) : (
              operationOptions.map((op) => (
                <SelectItem key={op.value} value={op.value}>
                  {op.label}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
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
      {queueHint ? (
        <p className="col-span-2 md:col-span-4 lg:col-span-12 rounded-md border border-accent/40 bg-accent/10 px-3 py-2 text-sm text-accent-foreground">
          {queueHint}
        </p>
      ) : null}
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
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <form
      action={async (fd: FormData) => {
        start(async () => {
          const { closeShiftAction } = await import("../actions");
          await closeShiftAction(fd);
          router.refresh();
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
