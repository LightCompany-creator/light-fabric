"use client";

// История смен цеха. Документы живут в 1С, поэтому список запрашивается оттуда,
// а не собирается из того, что помнит планшет.
//
// Сверху текущий месяц, ниже «Архив»: прошлые месяцы свёрнуты по одному,
// раскрываются касанием. Архивирование автоматическое, по дате смены:
// хранить у себя приложению нечего, документы остаются в 1С.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { describeError, useApi1C } from "@/lib/api1c/provider";
import { formatDay, localDate } from "@/lib/api1c";
import type { ShiftHead } from "@/lib/api1c";
import { cn } from "@/lib/utils";
import { StatusBadge } from "../status-badge";

/** Сколько месяцев истории показываем, включая текущий. */
const MONTHS = 12;
const PAGE_SIZE = 500;

function monthKey(date: string): string {
  return date.slice(0, 7);
}

function monthTitle(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const name = new Date(y, m - 1, 1).toLocaleDateString("ru-RU", { month: "long" });
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${y}`;
}

/** Первый день месяца, отстоящего на `back` месяцев от текущего. */
function monthStart(back: number): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - back, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function plural(n: number, forms: [string, string, string]): string {
  const abs = n % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}

type Month = { key: string; items: ShiftHead[]; produced: number; defect: number };

function groupByMonth(items: ShiftHead[]): Month[] {
  const map = new Map<string, Month>();
  for (const s of items) {
    const key = monthKey(s.date);
    const m = map.get(key) ?? { key, items: [], produced: 0, defect: 0 };
    m.items.push(s);
    m.produced += s.produced_total ?? 0;
    m.defect += s.defect_total ?? 0;
    map.set(key, m);
  }
  return Array.from(map.values()).sort((a, b) => b.key.localeCompare(a.key));
}

export function ShiftsHistoryScreen() {
  const { workshop, api, status } = useApi1C();
  const [items, setItems] = useState<ShiftHead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!workshop) return;
    setLoading(true);
    setError(null);
    try {
      const page = await api.listShifts({
        workshop: workshop.id,
        from: monthStart(MONTHS - 1),
        status: "all",
        page_size: PAGE_SIZE,
      });
      setItems(page.items);
      setTotal(page.total);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setLoading(false);
    }
  }, [api, workshop]);

  useEffect(() => {
    void load();
  }, [load]);

  const current = monthKey(localDate());
  const months = useMemo(() => groupByMonth(items), [items]);
  const thisMonth = months.find((m) => m.key === current) ?? { key: current, items: [], produced: 0, defect: 0 };
  const archive = months.filter((m) => m.key !== current);

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  if (status !== "ready") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Загрузка
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/w" aria-label="Назад">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">История смен</h1>
          <p className="text-sm text-muted-foreground">{workshop?.name}</p>
        </div>
      </header>

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка</p>
      ) : (
        <>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {monthTitle(thisMonth.key)}
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {thisMonth.items.length} {plural(thisMonth.items.length, ["смена", "смены", "смен"])}
                  {thisMonth.items.length ? ` · выпуск ${thisMonth.produced} · брак ${thisMonth.defect}` : ""}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {thisMonth.items.length === 0 ? (
                <p className="text-sm text-muted-foreground">В этом месяце смен нет.</p>
              ) : (
                thisMonth.items.map((s) => <ShiftRow key={s.id} shift={s} />)
              )}
            </CardContent>
          </Card>

          {archive.length > 0 ? (
            <section className="space-y-2">
              <h2 className="px-1 text-sm font-semibold uppercase tracking-wide text-muted-foreground">Архив</h2>
              {archive.map((m) => {
                const open = expanded.has(m.key);
                return (
                  <Card key={m.key}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => toggle(m.key)}
                      className="flex min-h-14 w-full items-center justify-between gap-3 px-4 py-3 text-left"
                    >
                      <span className="min-w-0">
                        <span className="block text-[15px] font-semibold">{monthTitle(m.key)}</span>
                        <span className="block text-sm text-muted-foreground">
                          {m.items.length} {plural(m.items.length, ["смена", "смены", "смен"])} · выпуск{" "}
                          {m.produced} · брак {m.defect}
                        </span>
                      </span>
                      <ChevronDown
                        className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
                        aria-hidden="true"
                      />
                    </button>
                    {open ? (
                      <CardContent className="space-y-2 pt-0">
                        {m.items.map((s) => (
                          <ShiftRow key={s.id} shift={s} />
                        ))}
                      </CardContent>
                    ) : null}
                  </Card>
                );
              })}
            </section>
          ) : null}

          {total > items.length ? (
            <p className="text-center text-xs text-muted-foreground">
              Показаны последние {items.length} из {total}.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

function ShiftRow({ shift: s }: { shift: ShiftHead }) {
  const stale = s.status === "open" && s.date < localDate();
  return (
    <Link
      href={`/w/shift?id=${s.id}`}
      className="flex min-h-14 items-center justify-between gap-3 rounded-md border px-3 py-2 transition-colors hover:bg-muted/60"
    >
      <span className="min-w-0">
        <span className="block truncate text-[15px] font-semibold">
          {formatDay(s.date)}, {s.shift_no} смена
        </span>
        <span className="block truncate text-sm text-muted-foreground">
          {s.number}
          {s.responsible ? ` · ${s.responsible}` : ""}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <span className="text-[15px] tabular-nums">
          {s.produced_total ?? 0}
          {s.defect_total ? `, брак ${s.defect_total}` : ""}
        </span>
        {s.accounting_status === "pending" ? <StatusBadge kind="pending" /> : null}
        <StatusBadge kind={s.status === "closed" ? "closed" : stale ? "unclosed" : "open"} />
      </span>
    </Link>
  );
}
