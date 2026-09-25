"use client";

// Создание передачи в другой цех. Передавать можно только то, что лежит на складе,
// и не больше доступного остатка: 1С всё равно откажет, но человеку лучше увидеть
// границу сразу, прямо в поле ввода.

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { localDate, newIdempotencyKey } from "@/lib/api1c";
import { describeError, useApi1C } from "@/lib/api1c/provider";
import { invalidateWorkshopContext, useWorkshopContext } from "@/lib/api1c/use-workshop-context";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring";

export function NewTransferScreen() {
  const router = useRouter();
  const { workshop, api } = useApi1C();
  const { context } = useWorkshopContext(workshop?.id);

  const [targetId, setTargetId] = useState("");
  const [comment, setComment] = useState("");
  const [qtyByItem, setQtyByItem] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  // Передавать имеет смысл только то, что реально есть в наличии.
  const available = useMemo(
    () => (context?.stock ?? []).filter((line) => line.available > 0),
    [context],
  );

  const lines = useMemo(
    () =>
      Object.entries(qtyByItem)
        .map(([item_id, raw]) => ({ item_id, qty: Number(raw.replace(",", ".")) || 0 }))
        .filter((line) => line.qty > 0),
    [qtyByItem],
  );

  const tooMuch = lines.filter((line) => {
    const stock = available.find((s) => s.item_id === line.item_id);
    return stock ? line.qty > stock.available : false;
  });

  async function send() {
    if (!workshop || !targetId || lines.length === 0) return;
    setSending(true);
    setError(null);
    try {
      const doc = await api.createTransfer(
        {
          from_workshop_id: workshop.id,
          to_workshop_id: targetId,
          date: localDate(),
          comment,
          lines,
        },
        newIdempotencyKey(),
      );
      invalidateWorkshopContext(workshop.id);
      router.replace(`/w/transfer?id=${doc.id}`);
    } catch (e) {
      setError(describeError(e));
    } finally {
      setSending(false);
    }
  }

  if (!context) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Загрузка
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-24">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/w/transfers" aria-label="Назад">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Передать в другой цех</h1>
          <p className="text-sm text-muted-foreground">со склада «{workshop?.warehouse.name}»</p>
        </div>
      </header>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Кому</CardTitle>
        </CardHeader>
        <CardContent>
          <select
            className={selectClass}
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
          >
            <option value="">Выберите цех</option>
            {context.transfer_targets.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Что передаём</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground">На складе цеха пусто, передавать нечего.</p>
          ) : (
            available.map((line) => {
              const value = qtyByItem[line.item_id] ?? "";
              const qty = Number(value.replace(",", ".")) || 0;
              const over = qty > line.available;
              return (
                <div key={line.item_id} className="grid gap-2 sm:grid-cols-[1fr_9rem]">
                  <div className="self-center text-sm">
                    <p className="font-medium">{line.name}</p>
                    <p className="text-muted-foreground">
                      доступно {line.available} {line.unit}
                      {line.reserved > 0 ? ` (в передаче ${line.reserved})` : ""}
                    </p>
                  </div>
                  <Input
                    inputMode="decimal"
                    placeholder="0"
                    value={value}
                    className={over ? "border-destructive" : undefined}
                    onChange={(e) =>
                      setQtyByItem((prev) => ({ ...prev, [line.item_id]: e.target.value }))
                    }
                  />
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Комментарий, необязательно</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={comment} onChange={(e) => setComment(e.target.value)} />

          {tooMuch.length > 0 ? (
            <p className="text-sm text-destructive">
              Больше, чем есть на складе. Уменьшите количество.
            </p>
          ) : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button
            className="w-full"
            onClick={() => void send()}
            disabled={sending || !targetId || lines.length === 0 || tooMuch.length > 0}
          >
            {sending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Передать
          </Button>
          <p className="text-xs text-muted-foreground">
            Пока получатель не подтвердит приём, товар числится за вами.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
