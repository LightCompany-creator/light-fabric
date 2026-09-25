"use client";

// Карточка передачи. Пока обе стороны не подтвердили, товар числится за отправителем:
// именно это и защищает цех от «я отправил, а ты не получал».
// Правка строк любой стороной сбрасывает оба подтверждения, поэтому предупреждаем заранее.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { describeError, useApi1C } from "@/lib/api1c/provider";
import { invalidateWorkshopContext } from "@/lib/api1c/use-workshop-context";
import type { Transfer } from "@/lib/api1c";

export function TransferScreen({ transferId }: { transferId: string }) {
  const router = useRouter();
  const { workshop, api, status } = useApi1C();
  const [doc, setDoc] = useState<Transfer | null>(null);
  const [edited, setEdited] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    // До восстановления сеанса клиент без учётных данных: запрос ушёл бы впустую.
    if (status !== "ready") return;
    setError(null);
    try {
      const fresh = await api.getTransfer(transferId);
      setDoc(fresh);
      setEdited(Object.fromEntries(fresh.lines.map((l) => [l.item_id, String(l.qty)])));
    } catch (e) {
      setError(describeError(e));
    }
  }, [api, transferId, status]);

  useEffect(() => {
    void load();
  }, [load]);

  if (status !== "ready" || !doc) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Загрузка
      </div>
    );
  }

  const iAmSender = doc.from.workshop_id === workshop?.id;
  const posted = doc.status === "posted";
  const myMark = iAmSender ? doc.sender_confirmed : doc.receiver_confirmed;
  const otherMark = iAmSender ? doc.receiver_confirmed : doc.sender_confirmed;

  const changed = doc.lines.some(
    (l) => Number((edited[l.item_id] ?? "").replace(",", ".")) !== l.qty,
  );

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      invalidateWorkshopContext(workshop?.id);
    } catch (e) {
      setError(describeError(e));
      await load();
    } finally {
      setBusy(false);
    }
  }

  const confirm = () =>
    run(async () => {
      const fresh = await api.confirmTransfer(doc.id, {
        version: doc.version,
        side: iAmSender ? "sender" : "receiver",
      });
      setDoc(fresh);
    });

  const saveLines = () => {
    // Ноль в строке означает «убрать позицию», а не «передать ноль».
    const lines = doc.lines
      .map((l) => ({
        item_id: l.item_id,
        qty: Number((edited[l.item_id] ?? "0").replace(",", ".")) || 0,
      }))
      .filter((l) => l.qty > 0);
    if (lines.length === 0) {
      setError("Передача без позиций не нужна. Чтобы отменить её, удалите документ.");
      return;
    }
    return run(async () => {
      const fresh = await api.updateTransfer(doc.id, { lines }, doc.version);
      setDoc(fresh);
      setEdited(Object.fromEntries(fresh.lines.map((l) => [l.item_id, String(l.qty)])));
    });
  };

  const remove = () =>
    run(async () => {
      await api.deleteTransfer(doc.id);
      router.replace("/w/transfers");
    });

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-24">
      <header className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/w/transfers" aria-label="Назад">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">
            {doc.from.name} → {doc.to.name}
            {posted ? <Badge className="ml-2">проведено</Badge> : null}
          </h1>
          <p className="text-sm text-muted-foreground">
            {doc.number} · {doc.date.slice(0, 10)} · {iAmSender ? "вы отправитель" : "вы получатель"}
          </p>
        </div>
      </header>

      {error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Позиции</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {doc.lines.map((line) => (
            <div key={line.item_id} className="grid gap-2 sm:grid-cols-[1fr_9rem]">
              <div className="self-center text-sm">
                <p className="font-medium">{line.name ?? line.item_id}</p>
                <p className="text-muted-foreground">{line.unit}</p>
              </div>
              <Input
                inputMode="decimal"
                disabled={posted || busy}
                value={edited[line.item_id] ?? ""}
                onChange={(e) =>
                  setEdited((prev) => ({ ...prev, [line.item_id]: e.target.value }))
                }
              />
            </div>
          ))}

          {doc.comment ? (
            <p className="text-sm text-muted-foreground">Комментарий: {doc.comment}</p>
          ) : null}

          {changed && !posted ? (
            <div className="space-y-2 rounded-md border border-dashed p-3">
              <p className="text-sm">
                Количество изменено. После сохранения обе подписи снимаются, подтверждать
                придётся заново.
              </p>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => void saveLines()} disabled={busy}>
                  Сохранить количество
                </Button>
                <Button size="sm" variant="outline" onClick={() => void load()} disabled={busy}>
                  Вернуть как было
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Подтверждения</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ConfirmRow label={`Отправитель, ${doc.from.name}`} mark={doc.sender_confirmed} />
          <ConfirmRow label={`Получатель, ${doc.to.name}`} mark={doc.receiver_confirmed} />

          {posted ? (
            <p className="text-muted-foreground">
              Обе стороны подтвердили, 1С провела документ: у отправителя списано,
              у получателя оприходовано.
            </p>
          ) : (
            <>
              {!myMark ? (
                <Button className="w-full" onClick={() => void confirm()} disabled={busy || changed}>
                  {busy ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Подтвердить
                </Button>
              ) : (
                <p className="text-muted-foreground">
                  Вы подтвердили. {otherMark ? "" : "Ждём вторую сторону."}
                </p>
              )}

              {iAmSender ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() => void remove()}
                  disabled={busy}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Удалить передачу
                </Button>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ConfirmRow({ label, mark }: { label: string; mark: Transfer["sender_confirmed"] }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      {mark ? (
        <Badge variant="secondary">
          {mark.by}, {mark.at.slice(11, 16)}
        </Badge>
      ) : (
        <Badge variant="outline">не подтверждено</Badge>
      )}
    </div>
  );
}
