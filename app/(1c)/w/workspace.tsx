"use client";

// Рабочее место цеха: точка входа после логина.
// Один запрос контекста при выборе цеха даёт всё для смены, как в контракте (п. 6.3).
// Экраны смены и перемещений добавляются сюда следующими шагами.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogOut, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { describeError, useApi1C } from "@/lib/api1c/provider";
import { useWorkshopContext } from "@/lib/api1c/use-workshop-context";

export function Workspace() {
  const router = useRouter();
  const { status, me, workshop, api, isMock, signOut, selectWorkshop } = useApi1C();
  const { context, loading, error: contextError, staleSince, reload } = useWorkshopContext(workshop?.id);
  const [error, setError] = useState<string | null>(null);
  const [opening, setOpening] = useState<1 | 2 | null>(null);

  /** Открыть смену на сегодня. Если такая уже открыта, 1С вернёт её же. */
  const openShift = useCallback(
    async (shiftNo: 1 | 2) => {
      if (!workshop) return;
      setOpening(shiftNo);
      setError(null);
      try {
        const shift = await api.openShift(workshop.id, new Date().toISOString().slice(0, 10), shiftNo);
        router.push(`/w/shift/${shift.id}`);
      } catch (e) {
        setError(describeError(e));
      } finally {
        setOpening(null);
      }
    },
    [api, router, workshop],
  );

  useEffect(() => {
    if (status === "anonymous") router.replace("/enter");
  }, [status, router]);


  if (status !== "ready") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Загрузка
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{workshop?.name ?? "Цех не выбран"}</h1>
          <p className="text-sm text-muted-foreground">
            {me.user.name}
            {me.is_admin ? " · администратор" : ""}
            {workshop ? ` · склад «${workshop.warehouse.name}»` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => void reload(true)} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Выйти
          </Button>
        </div>
      </header>

      {isMock ? (
        <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
          Данные из заглушки по контракту этапа 1. Когда Арсен опубликует сервис,
          останется задать адрес в NEXT_PUBLIC_API_1C_URL.
        </p>
      ) : null}

      {staleSince ? (
        <p className="rounded-md border border-destructive p-3 text-sm text-destructive">
          Нет связи с 1С. Данные от {new Date(staleSince).toLocaleString("ru-RU", {
            day: "numeric",
            month: "long",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      ) : null}

      {me.workshops.length > 1 ? (
        <div className="flex flex-wrap gap-2">
          {me.workshops.map((w) => (
            <Button
              key={w.id}
              size="sm"
              variant={w.id === workshop?.id ? "default" : "outline"}
              onClick={() => selectWorkshop(w.id)}
            >
              {w.name}
            </Button>
          ))}
        </div>
      ) : null}

      {error || contextError ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm text-destructive">{error ?? contextError}</CardContent>
        </Card>
      ) : null}

      {context ? (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label="Сотрудники" value={context.employees.length} />
            <Stat label="Виды работ" value={context.work_types.length} />
            <Stat label="Продукция" value={context.products.length} />
            <Stat label="Материалы" value={context.materials.length} />
          </div>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Смены</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {context.open_shifts.length === 0 ? (
                <p className="text-muted-foreground">Открытых смен нет.</p>
              ) : (
                context.open_shifts.map((s) => (
                  <div key={s.id} className="flex items-center justify-between gap-3">
                    <span>
                      {s.number} · {s.date} · {s.shift_no} смена
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">открыта</Badge>
                      <Button size="sm" variant="outline" onClick={() => router.push(`/w/shift/${s.id}`)}>
                        Продолжить
                      </Button>
                    </div>
                  </div>
                ))
              )}

              <div className="flex flex-wrap gap-2 border-t pt-3">
                <Button size="sm" onClick={() => void openShift(1)} disabled={opening !== null}>
                  {opening === 1 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Открыть 1 смену
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => void openShift(2)}
                  disabled={opening !== null}
                >
                  {opening === 2 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Открыть 2 смену
                </Button>
                <Button size="sm" variant="ghost" onClick={() => router.push("/w/shifts")}>
                  История
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className={context.pending_incoming_transfers > 0 ? "border-primary" : undefined}>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Перемещения
                {context.pending_incoming_transfers > 0 ? (
                  <Badge className="ml-2">
                    вас ждут: {context.pending_incoming_transfers}
                  </Badge>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => router.push("/w/transfers")}>
                Входящие и исходящие
              </Button>
              <Button size="sm" onClick={() => router.push("/w/transfers/new")}>
                Передать в другой цех
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Остатки склада</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {context.stock.length === 0 ? (
                <p className="text-muted-foreground">Склад пуст.</p>
              ) : (
                context.stock.map((line) => (
                  <div key={line.item_id} className="flex items-center justify-between gap-4">
                    <span className="truncate">{line.name ?? line.item_id}</span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {line.available} {line.unit}
                      {line.reserved > 0 ? ` (в передаче ${line.reserved})` : ""}
                    </span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-2xl font-bold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}
