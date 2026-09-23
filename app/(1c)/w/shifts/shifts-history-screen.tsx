"use client";

// История смен цеха. Документы живут в 1С, поэтому список запрашивается оттуда,
// а не собирается из того, что помнит планшет.

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { describeError, useApi1C } from "@/lib/api1c/provider";
import type { ShiftHead } from "@/lib/api1c";

type Period = 7 | 30 | 0;

const PERIODS: { value: Period; label: string }[] = [
  { value: 7, label: "Неделя" },
  { value: 30, label: "Месяц" },
  { value: 0, label: "Всё" },
];

function since(days: Period): string | undefined {
  if (!days) return undefined;
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

export function ShiftsHistoryScreen() {
  const { workshop, api, status } = useApi1C();
  const [period, setPeriod] = useState<Period>(7);
  const [items, setItems] = useState<ShiftHead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workshop) return;
    setLoading(true);
    setError(null);
    try {
      const page = await api.listShifts({
        workshop: workshop.id,
        from: since(period),
        status: "all",
        page_size: 100,
      });
      setItems(page.items);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setLoading(false);
    }
  }, [api, period, workshop]);

  useEffect(() => {
    void load();
  }, [load]);

  // Итоги периода: то, о чём чаще всего спрашивают, глядя в историю.
  const totals = useMemo(
    () => ({
      produced: items.reduce((sum, s) => sum + (s.produced_total ?? 0), 0),
      defect: items.reduce((sum, s) => sum + (s.defect_total ?? 0), 0),
    }),
    [items],
  );

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

      <div className="flex gap-2">
        {PERIODS.map((p) => (
          <Button
            key={p.value}
            size="sm"
            variant={period === p.value ? "default" : "outline"}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      {loading ? (
        <p className="text-sm text-muted-foreground">Загрузка</p>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground">
            За этот период смен нет.
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardContent className="flex flex-wrap gap-x-8 gap-y-2 py-4 text-sm">
              <span>
                Смен: <span className="font-medium tabular-nums">{items.length}</span>
              </span>
              <span>
                Выпуск: <span className="font-medium tabular-nums">{totals.produced}</span>
              </span>
              <span>
                Брак: <span className="font-medium tabular-nums">{totals.defect}</span>
              </span>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {items.map((s) => (
              <Link key={s.id} href={`/w/shift/${s.id}`} className="block">
                <Card>
                  <CardContent className="flex items-center justify-between gap-3 py-4 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {s.date}, {s.shift_no} смена
                      </p>
                      <p className="truncate text-muted-foreground">
                        {s.number}
                        {s.responsible ? ` · ${s.responsible}` : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <span className="tabular-nums">
                        {s.produced_total ?? 0}
                        {s.defect_total ? `, брак ${s.defect_total}` : ""}
                      </span>
                      <Badge variant={s.status === "closed" ? "secondary" : "default"}>
                        {s.status === "closed" ? "закрыта" : "открыта"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
