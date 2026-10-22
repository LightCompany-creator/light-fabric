"use client";

// Рабочее место цеха: точка входа после логина.
// Один запрос контекста при выборе цеха даёт всё для смены, как в контракте (п. 6.3).
// Первым делом здесь то, что нужно начальнику цеха за один взгляд: идёт ли смена,
// сколько сделано и ждёт ли кто-то его подписи (Д-4). Счётчики справочников убраны.

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Loader2, LogOut, Plus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { localDate } from "@/lib/api1c";
import type { StockLine, WarehouseRef, WorkshopRef } from "@/lib/api1c";
import { describeError, useApi1C } from "@/lib/api1c/provider";
import { invalidateWorkshopContext, useWorkshopContext } from "@/lib/api1c/use-workshop-context";
import { ChooseWorkshop } from "./choose-workshop";
import { StatusBadge } from "./status-badge";

/** Русское склонение по числу: plural(2, ["смена", "смены", "смен"]). */
function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

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
        const shift = await api.openShift(workshop.id, localDate(), shiftNo);
        // Вернувшись на рабочее место, человек должен увидеть новую смену, а не кэш до неё.
        invalidateWorkshopContext(workshop.id);
        router.push(`/w/shift?id=${shift.id}`);
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

  // Несколько цехов у одной учётной записи: сначала выбор цеха (Д-7).
  if (!workshop && me.workshops.length > 1) {
    return (
      <ChooseWorkshop
        workshops={me.workshops}
        userName={me.user.name}
        onPick={selectWorkshop}
        onSignOut={signOut}
      />
    );
  }

  const openShifts = context?.open_shifts ?? [];
  const isOpen = (no: 1 | 2) => openShifts.some((s) => s.shift_no === no);
  const pending = context?.pending_incoming_transfers ?? 0;
  const stockGroups = context ? groupStock(context.stock, context.workshop) : [];

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{workshop?.name ?? "Цех не выбран"}</h1>
          <p className="text-sm text-muted-foreground">
            {workshop?.parent ? `${workshop.parent.name} · ` : ""}
            {me.user.name}
            {me.is_admin ? " · администратор" : ""}
            {workshop ? ` · склад «${workshop.warehouse.name}»` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="h-11" onClick={() => void reload(true)} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Обновить
          </Button>
          <Button variant="ghost" className="h-11" onClick={signOut}>
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
              className="h-11"
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
          <Card className={openShifts.length > 0 ? "border-2 border-primary" : undefined}>
            <CardContent className="space-y-4 pt-6">
              {openShifts.length === 0 ? (
                <div>
                  <p className="text-xl font-bold">Открытых смен нет</p>
                  <p className="text-sm text-muted-foreground">{context.workshop.name}</p>
                </div>
              ) : (
                openShifts.map((s) => (
                  <div key={s.id} className="space-y-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xl font-bold">{s.shift_no} смена идёт</p>
                        <p className="truncate text-sm text-muted-foreground">
                          {s.number} · {s.date}
                          {s.responsible ? ` · ${s.responsible}` : ""}
                        </p>
                      </div>
                      <StatusBadge kind="open" className="h-8 shrink-0 text-sm" />
                    </div>
                    {/* Итоги по открытой смене в контракте необязательные: без них цифры не рисуем. */}
                    {s.produced_total != null ? (
                      <div className="grid grid-cols-2 gap-3">
                        <Figure value={s.produced_total} label="выпуск за смену" />
                        <Figure value={s.defect_total ?? 0} label="брак" />
                      </div>
                    ) : null}
                    <Button
                      className="h-[60px] w-full text-lg"
                      onClick={() => router.push(`/w/shift?id=${s.id}`)}
                    >
                      Продолжить {s.shift_no} смену
                    </Button>
                  </div>
                ))
              )}

              <div className="flex flex-wrap gap-2 border-t pt-3">
                {!isOpen(1) ? (
                  <Button
                    className="h-12 flex-1 sm:flex-none"
                    variant={openShifts.length === 0 ? "default" : "outline"}
                    onClick={() => void openShift(1)}
                    disabled={opening !== null}
                  >
                    {opening === 1 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Открыть 1 смену
                  </Button>
                ) : null}
                {!isOpen(2) ? (
                  <Button
                    className="h-12 flex-1 sm:flex-none"
                    variant="outline"
                    onClick={() => void openShift(2)}
                    disabled={opening !== null}
                  >
                    {opening === 2 ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Открыть 2 смену
                  </Button>
                ) : null}
                <Button className="h-12" variant="ghost" onClick={() => router.push("/w/shifts")}>
                  История смен
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <CardTitle className="text-base">Передачи</CardTitle>
                <Button className="h-11" onClick={() => router.push("/w/transfers/new")}>
                  <Plus className="mr-2 h-4 w-4" />
                  Передать в другой цех
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {pending > 0 ? (
                <button
                  type="button"
                  onClick={() => router.push("/w/transfers")}
                  className="flex h-14 w-full items-center gap-3 rounded-md border border-orange-300 bg-orange-50 px-3 text-left transition-colors hover:bg-orange-100"
                >
                  <StatusBadge kind="waiting-me" className="h-8 shrink-0 text-sm" />
                  <span className="min-w-0 flex-1 truncate text-[17px] font-semibold">
                    {pending} {plural(pending, ["входящая ждёт", "входящие ждут", "входящих ждут"])} вашей
                    подписи
                  </span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => router.push("/w/transfers")}
                className="flex h-12 w-full items-center justify-between gap-3 rounded-md border px-3 text-left text-[15px] font-medium transition-colors hover:bg-muted/60"
              >
                Входящие и исходящие
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Остатки склада</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {context.stock.length === 0 ? (
                <p className="text-muted-foreground">Склад пуст.</p>
              ) : (
                stockGroups.map((group) => (
                  <div key={group.id} className="space-y-1">
                    {group.title ? (
                      <p className="flex items-center gap-2 pt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        {group.title}
                        {group.role ? (
                          <span className="rounded-full bg-muted px-2 py-0.5 font-medium normal-case tracking-normal">
                            {group.role === "output" ? "выпуск" : "материалы"}
                          </span>
                        ) : null}
                      </p>
                    ) : null}
                    {group.lines.map((line) => (
                      <div key={line.item_id} className="flex items-center justify-between gap-4 py-1">
                        <span className="truncate text-[15px]">{line.name ?? line.item_id}</span>
                        <span className="shrink-0 text-[15px] font-medium tabular-nums">
                          {line.available} {line.unit}
                          {line.reserved > 0 ? (
                            <span className="font-normal text-muted-foreground"> (в передаче {line.reserved})</span>
                          ) : null}
                        </span>
                      </div>
                    ))}
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

type StockGroup = { id: string; title: string | null; role?: WarehouseRef["role"]; lines: StockLine[] };

/**
 * Остатки по складам (Д-8): склад выпуска первым, затем склады материалов.
 * Если 1С отдаёт один склад на цех (контракт v0.2), группа одна и без заголовка.
 */
function groupStock(stock: StockLine[], workshop: WorkshopRef): StockGroup[] {
  const warehouses = workshop.warehouses?.length ? workshop.warehouses : [workshop.warehouse];
  const several = warehouses.length > 1 || stock.some((l) => l.warehouse_id && l.warehouse_id !== workshop.warehouse.id);
  if (!several) return [{ id: "all", title: null, lines: stock }];

  const ordered = [...warehouses].sort((a, b) => Number(b.role === "output") - Number(a.role === "output"));
  const groups: StockGroup[] = ordered.map((w) => ({ id: w.id, title: w.name, role: w.role, lines: [] }));
  const other: StockGroup = { id: "other", title: "Другие склады", lines: [] };
  for (const line of stock) {
    const group = groups.find((g) => g.id === line.warehouse_id);
    if (group) group.lines.push(line);
    else if (line.warehouse_id) {
      other.title = line.warehouse_name ?? other.title;
      other.lines.push(line);
    } else groups[0].lines.push(line);
  }
  if (other.lines.length) groups.push(other);
  return groups.filter((g) => g.lines.length > 0);
}

function Figure({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-md bg-muted/60 p-3">
      <p className="text-2xl font-bold tabular-nums">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
