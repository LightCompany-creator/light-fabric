"use client";

// Работа с документом смены: локальное состояние, автосохранение в 1С,
// черновик на устройстве и разбор конфликтов.
//
// Почему так. По контракту PUT шлёт документ целиком и повтор запроса
// безопасен, поэтому в цеху можно писать в любом порядке и сколько угодно раз:
// последнее состояние побеждает. Пока связи нет, всё копится в черновике
// на планшете и уходит, когда сеть вернётся.

import { useCallback, useEffect, useRef, useState } from "react";
import { Api1CError, Api1COfflineError, newIdempotencyKey } from "./index";
import type { Shift, ShiftState } from "./index";
import { describeError, useApi1C } from "./provider";

/** Как сейчас обстоят дела с сохранением. Показывается человеку в шапке. */
export type SyncStatus =
  | "loading"
  | "saved"
  | "saving"
  | "pending"
  | "offline"
  | "conflict"
  | "error";

const EMPTY_STATE: ShiftState = {
  comment: "",
  task_id: null,
  workers: [],
  outputs: [],
  products: [],
  materials: [],
};

/** Пауза перед отправкой: контракт разрешает копить изменения. */
const SAVE_DELAY_MS = 4000;

const draftKey = (shiftId: string) => `lf.1c.shift.${shiftId}`;

function readDraft(shiftId: string): ShiftState | null {
  try {
    const raw = window.localStorage.getItem(draftKey(shiftId));
    return raw ? (JSON.parse(raw) as ShiftState) : null;
  } catch {
    return null;
  }
}

function writeDraft(shiftId: string, state: ShiftState): void {
  try {
    window.localStorage.setItem(draftKey(shiftId), JSON.stringify(state));
  } catch {
    // Хранилище недоступно: работаем в памяти, это не повод останавливать смену.
  }
}

function dropDraft(shiftId: string): void {
  try {
    window.localStorage.removeItem(draftKey(shiftId));
  } catch {
    /* ignore */
  }
}

export type UseShift = {
  shift: Shift | null;
  state: ShiftState;
  sync: SyncStatus;
  error: string | null;
  /** Версия документа в 1С, по которой мы работаем. */
  version: string | undefined;
  /** Правка любой части документа: уходит в 1С сама. */
  update: (patch: Partial<ShiftState>) => void;
  /** Отправить прямо сейчас, не дожидаясь паузы. */
  saveNow: () => Promise<void>;
  /** Закрыть смену: 1С проводит отчёт производства. */
  close: (comment?: string) => Promise<Shift>;
  /** Конфликт: оставить своё (перезаписать) или взять версию из 1С. */
  resolveKeepMine: () => Promise<void>;
  resolveTakeTheirs: () => Promise<void>;
};

export function useShift(shiftId: string): UseShift {
  const { api } = useApi1C();
  const [shift, setShift] = useState<Shift | null>(null);
  const [state, setState] = useState<ShiftState>(EMPTY_STATE);
  const [version, setVersion] = useState<string | undefined>();
  const [sync, setSync] = useState<SyncStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latest = useRef<ShiftState>(EMPTY_STATE);
  const saving = useRef(false);

  // ---------- первая загрузка ----------

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setSync("loading");
      try {
        const doc = await api.getShift(shiftId);
        if (cancelled) return;

        const draft = readDraft(shiftId);
        // Черновик на планшете новее того, что успело уйти в 1С: продолжаем с него.
        const next = draft ?? pickState(doc);
        setShift(doc);
        setState(next);
        latest.current = next;
        setVersion(doc.version);
        setSync(draft ? "pending" : "saved");
      } catch (e) {
        if (cancelled) return;
        const draft = readDraft(shiftId);
        if (draft && e instanceof Api1COfflineError) {
          // Связи нет, но смена уже открыта и лежит на планшете: работаем дальше.
          setState(draft);
          latest.current = draft;
          setSync("offline");
        } else {
          setError(describeError(e));
          setSync("error");
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [api, shiftId]);

  // ---------- отправка ----------

  const push = useCallback(async () => {
    if (saving.current) return;
    saving.current = true;
    setSync("saving");
    try {
      const newVersion = await api.saveShift(shiftId, latest.current, version);
      setVersion(newVersion);
      dropDraft(shiftId);
      setError(null);
      setSync("saved");
    } catch (e) {
      writeDraft(shiftId, latest.current);
      if (e instanceof Api1COfflineError) {
        setSync("offline");
      } else if (e instanceof Api1CError && e.code === "conflict") {
        setSync("conflict");
        setError("Смену изменили с другого устройства. Выберите, какую версию оставить.");
      } else {
        setError(describeError(e));
        setSync("error");
      }
    } finally {
      saving.current = false;
    }
  }, [api, shiftId, version]);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void push(), SAVE_DELAY_MS);
  }, [push]);

  const update = useCallback(
    (patch: Partial<ShiftState>) => {
      setState((prev) => {
        const next = { ...prev, ...patch };
        latest.current = next;
        writeDraft(shiftId, next);
        return next;
      });
      setSync((prev) => (prev === "conflict" ? prev : "pending"));
      schedule();
    },
    [schedule, shiftId],
  );

  const saveNow = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await push();
  }, [push]);

  // Повторная попытка, когда сеть вернулась.
  useEffect(() => {
    function onOnline() {
      if (latest.current && (sync === "offline" || sync === "pending")) void push();
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [push, sync]);

  // Не теряем несохранённое при уходе со страницы.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // ---------- закрытие ----------

  const close = useCallback(
    async (comment?: string) => {
      if (timer.current) clearTimeout(timer.current);
      await push();
      const result = await api.closeShift(shiftId, {
        version: undefined,
        idempotencyKey: newIdempotencyKey(),
        comment,
      });
      dropDraft(shiftId);
      setShift(result.shift);
      setVersion(result.shift.version);
      setSync("saved");
      return result.shift;
    },
    [api, push, shiftId],
  );

  // ---------- конфликты ----------

  const resolveKeepMine = useCallback(async () => {
    const fresh = await api.getShift(shiftId);
    setShift(fresh);
    setVersion(fresh.version);
    setSync("pending");
    setError(null);
    await api.saveShift(shiftId, latest.current, fresh.version).then((v) => {
      setVersion(v);
      dropDraft(shiftId);
      setSync("saved");
    });
  }, [api, shiftId]);

  const resolveTakeTheirs = useCallback(async () => {
    const fresh = await api.getShift(shiftId);
    const next = pickState(fresh);
    setShift(fresh);
    setState(next);
    latest.current = next;
    setVersion(fresh.version);
    dropDraft(shiftId);
    setError(null);
    setSync("saved");
  }, [api, shiftId]);

  return {
    shift,
    state,
    sync,
    error,
    version,
    update,
    saveNow,
    close,
    resolveKeepMine,
    resolveTakeTheirs,
  };
}

function pickState(doc: Shift): ShiftState {
  return {
    comment: doc.comment ?? "",
    task_id: doc.task_id ?? null,
    workers: doc.workers ?? [],
    outputs: doc.outputs ?? [],
    products: doc.products ?? [],
    materials: doc.materials ?? [],
  };
}
