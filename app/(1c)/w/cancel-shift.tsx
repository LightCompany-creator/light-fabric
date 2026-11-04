"use client";

// «Отменить смену» на карточке рабочего места: для смены, открытой по ошибке
// (просьба Наиры 04.11). Это та же пометка на удаление, что внизу экрана смены,
// но только для пустой смены. Если в ней что-то внесено, в 1С или на этом
// планшете, отменять нужно изнутри, чтобы не потерять работу одним касанием.

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDay, isNotSupported } from "@/lib/api1c";
import type { ShiftHead } from "@/lib/api1c";
import { describeError, useApi1C } from "@/lib/api1c/provider";
import { hasLocalShiftData, isEmptyShiftState } from "@/lib/api1c/use-shift";

export function CancelShift({ shift, onDone }: { shift: ShiftHead; onDone: () => void }) {
  const { api } = useApi1C();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function handleCancel() {
    setBusy(true);
    setFailure(null);
    try {
      // Карточка знает только итоги, поэтому перед отменой смотрим смену целиком.
      const full = await api.getShift(shift.id);
      if (!isEmptyShiftState(full) || hasLocalShiftData(shift.id)) {
        setFailure("В смене уже есть данные. Пометить её на удаление можно внизу смены.");
        return;
      }
      await api.markShiftDeletion(shift.id, true, { version: full.version });
      setAsking(false);
      onDone();
    } catch (e) {
      setFailure(
        isNotSupported(e) ? "1С не пометила смену на удаление: на стороне 1С это ещё не включено." : describeError(e),
      );
    } finally {
      setBusy(false);
    }
  }

  if (!asking) {
    return (
      <Button
        variant="ghost"
        className="h-11 w-full text-destructive hover:text-destructive"
        onClick={() => setAsking(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Отменить смену
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
      <p className="font-medium">
        Отменить {shift.shift_no} смену за {formatDay(shift.date)}? Смена {shift.number} будет помечена
        на удаление.
      </p>
      {failure ? <p className="text-destructive">{failure}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="destructive" className="h-11" onClick={() => void handleCancel()} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Да, отменить
        </Button>
        <Button
          variant="outline"
          className="h-11"
          onClick={() => {
            setAsking(false);
            setFailure(null);
          }}
          disabled={busy}
        >
          Нет
        </Button>
      </div>
    </div>
  );
}
