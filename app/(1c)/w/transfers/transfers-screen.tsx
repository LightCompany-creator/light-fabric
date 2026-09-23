"use client";

// Список перемещений цеха: входящие и исходящие.
// Для цеха это основной способ получить сырьё, поэтому входящие открываются первыми.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { describeError, useApi1C } from "@/lib/api1c/provider";
import type { TransferHead } from "@/lib/api1c";

type Direction = "in" | "out";

/** Что документ ждёт от человека прямо сейчас. */
export function transferState(doc: TransferHead, myWorkshopId: string | undefined) {
  if (doc.status === "posted") return { text: "проведено", mine: false, variant: "secondary" as const };

  const iAmSender = doc.from.workshop_id === myWorkshopId;
  const mySide = iAmSender ? doc.sender_confirmed : doc.receiver_confirmed;
  if (!mySide) return { text: "ждёт вашего подтверждения", mine: true, variant: "default" as const };

  return { text: "ждёт вторую сторону", mine: false, variant: "outline" as const };
}

export function TransfersScreen() {
  const { workshop, api, status } = useApi1C();
  const [direction, setDirection] = useState<Direction>("in");
  const [items, setItems] = useState<TransferHead[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!workshop) return;
    setLoading(true);
    setError(null);
    try {
      const page = await api.listTransfers({ workshop: workshop.id, direction, status: "all" });
      setItems(page.items);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setLoading(false);
    }
  }, [api, direction, workshop]);

  useEffect(() => {
    void load();
  }, [load]);

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
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/w" aria-label="Назад">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">Перемещения</h1>
            <p className="text-sm text-muted-foreground">{workshop?.name}</p>
          </div>
        </div>
        <Button size="sm" asChild>
          <Link href="/w/transfers/new">
            <Plus className="mr-2 h-4 w-4" />
            Передать
          </Link>
        </Button>
      </header>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={direction === "in" ? "default" : "outline"}
          onClick={() => setDirection("in")}
        >
          Входящие
        </Button>
        <Button
          size="sm"
          variant={direction === "out" ? "default" : "outline"}
          onClick={() => setDirection("out")}
        >
          Исходящие
        </Button>
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
            {direction === "in" ? "Входящих передач нет." : "Исходящих передач нет."}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((doc) => {
            const state = transferState(doc, workshop?.id);
            return (
              <Link key={doc.id} href={`/w/transfers/${doc.id}`} className="block">
                <Card className={state.mine ? "border-primary" : undefined}>
                  <CardContent className="flex items-center justify-between gap-3 py-4 text-sm">
                    <div className="min-w-0">
                      <p className="font-medium">
                        {doc.from.name} → {doc.to.name}
                      </p>
                      <p className="text-muted-foreground">
                        {doc.number} · {doc.date.slice(0, 10)} · позиций {doc.lines_count ?? 0}
                        {doc.qty_total ? ` · всего ${doc.qty_total}` : ""}
                      </p>
                    </div>
                    <Badge variant={state.variant} className="shrink-0">
                      {state.text}
                    </Badge>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
