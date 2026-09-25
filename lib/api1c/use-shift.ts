"use client";

// Работа с документом смены: локальное состояние, автосохранение в 1С,
// черновик на устройстве и разбор конфликтов.
//
// Почему так. По контракту PUT шлёт документ целиком и повтор запроса
// безопасен, поэтому в цеху можно писать в любом порядке и сколько угодно раз:
// последнее состояние побеждает. Пока связи нет, всё копится в черновике
// на планшете и уходит, когда сеть вернётся.
//
// Всё, что нужно отправке, лежит в ref, а не в state: версия документа,
// последнее состояние, признак правок. Иначе таймер, поставленный до ответа 1С,
// уносил бы устаревшую версию, и 1С отвечала бы «изменено с другого устройства»
// на правки с того же самого планшета.

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
  /** Переоткрыть закрытую смену. Только администратор. */
  reopen: (reason: string) => Promise<void>;
  /** Конфликт: оставить своё (перезаписать) или взять версию из 1С. */
  resolveKeepMine: () => Promise<void>;
  resolveTakeTheirs: () => Promise<void>;
};

export function useShift(shiftId: string): UseShift {
  const { api, status } = useApi1C();
  const [shift, setShift] = useState<Shift | null>(null);
  const [state, setState] = useState<ShiftState>(EMPTY_STATE);
  const [version, setVersion] = useState<string | undefined>();
  const [sync, setSync] = useState<SyncStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Последнее состояние документа, всегда совпадает со state. */
  const latest = useRef<ShiftState>(EMPTY_STATE);
  /** Версия в 1С на момент отправки, а не на момент постановки таймера. */
  const versionRef = useRef<string | undefined>(undefined);
  const saving = useRef(false);
  /** Были правки после начала последней отправки: их нужно дослать. */
  const dirty = useRef(false);
  /** Конфликт не разрешён: автоотправка стоит, пока человек не выберет версию. */
  const blocked = useRef(false);
  const pushRef = useRef<() => Promise<void>>(async () => {});

  const commitVersion = useCallback((next: string | undefined) => {
    versionRef.current = next;
    setVersion(next);
  }, []);

  const applyState = useCallback((next: ShiftState) => {
    latest.current = next;
    setState(next);
  }, []);

  // ---------- первая загрузка ----------

  useEffect(() => {
    // Пока сеанс не восстановлен, клиент без учётных данных: ждём, иначе первый
    // запрос уйдёт впустую и мигнёт ошибкой до настоящей загрузки.
    if (status !== "ready") return;
    let cancelled = false;

    async function load() {
      setSync("loading");
      try {
        const doc = await api.getShift(shiftId);
        if (cancelled) return;

        const draft = readDraft(shiftId);
        // Черновик на планшете новее того, что успело уйти в 1С: продолжаем с него.
        setShift(doc);
        applyState(draft ?? pickState(doc));
        commitVersion(doc.version);
        dirty.current = Boolean(draft);
        setSync(draft ? "pending" : "saved");
      } catch (e) {
        if (cancelled) return;
        if (e instanceof Api1COfflineError) {
          // Связи нет: продолжаем с того, что лежит на планшете. Если черновика ещё
          // нет, начинаем с чистого документа: всё уйдёт в 1С, когда сеть вернётся.
          const draft = readDraft(shiftId);
          applyState(draft ?? EMPTY_STATE);
          dirty.current = Boolean(draft);
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
  }, [api, shiftId, status, applyState, commitVersion]);

  // ---------- отправка ----------

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void pushRef.current(), SAVE_DELAY_MS);
  }, []);

  const push = useCallback(async () => {
    // Уже летит запрос: правки отмечены в dirty и уйдут следующей отправкой.
    if (saving.current || blocked.current) return;
    saving.current = true;
    dirty.current = false;
    setSync("saving");
    try {
      const newVersion = await api.saveShift(shiftId, latest.current, versionRef.current);
      commitVersion(newVersion);
      setError(null);
      if (dirty.current) {
        // Пока запрос летел, человек продолжал вводить: черновик уже новее,
        // его нельзя удалять, а статус остаётся «не сохранено».
        setSync("pending");
      } else {
        dropDraft(shiftId);
        setSync("saved");
      }
    } catch (e) {
      writeDraft(shiftId, latest.current);
      if (e instanceof Api1COfflineError) {
        setSync("offline");
      } else if (e instanceof Api1CError && e.code === "conflict") {
        blocked.current = true;
        setSync("conflict");
        setError("Смену изменили с другого устройства. Выберите, какую версию оставить.");
      } else {
        setError(describeError(e));
        setSync("error");
      }
    } finally {
      saving.current = false;
      if (dirty.current && !blocked.current) schedule();
    }
  }, [api, shiftId, schedule, commitVersion]);

  useEffect(() => {
    pushRef.current = push;
  }, [push]);

  const update = useCallback(
    (patch: Partial<ShiftState>) => {
      const next = { ...latest.current, ...patch };
      applyState(next);
      writeDraft(shiftId, next);
      dirty.current = true;
      setSync((prev) => (prev === "conflict" ? prev : "pending"));
      schedule();
    },
    [applyState, schedule, shiftId],
  );

  const saveNow = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    await pushRef.current();
  }, []);

  // Повторная попытка, когда сеть вернулась.
  useEffect(() => {
    function onOnline() {
      if (sync === "offline" || sync === "pending") void pushRef.current();
    }
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [sync]);

  // Таймер не должен пережить экран.
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  // ---------- закрытие ----------

  const close = useCallback(
    async (comment?: string) => {
      if (timer.current) clearTimeout(timer.current);
      await pushRef.current();
      const result = await api.closeShift(shiftId, {
        version: versionRef.current,
        idempotencyKey: newIdempotencyKey(),
        comment,
      });
      dropDraft(shiftId);
      dirty.current = false;
      setShift(result.shift);
      commitVersion(result.shift.version);
      setSync("saved");
      return result.shift;
    },
    [api, shiftId, commitVersion],
  );

  const reopen = useCallback(
    async (reason: string) => {
      const result = await api.reopenShift(shiftId, reason);
      setShift(result.shift);
      applyState(pickState(result.shift));
      commitVersion(result.shift.version);
      dirty.current = false;
      setError(null);
      setSync("saved");
    },
    [api, shiftId, applyState, commitVersion],
  );

  // ---------- конфликты ----------

  const resolveKeepMine = useCallback(async () => {
    const fresh = await api.getShift(shiftId);
    setShift(fresh);
    commitVersion(fresh.version);
    setError(null);
    setSync("saving");
    try {
      const saved = await api.saveShift(shiftId, latest.current, fresh.version);
      commitVersion(saved);
      dropDraft(shiftId);
      dirty.current = false;
      blocked.current = false;
      setSync("saved");
    } catch (e) {
      setError(describeError(e));
      setSync("error");
    }
  }, [api, shiftId, commitVersion]);

  const resolveTakeTheirs = useCallback(async () => {
    const fresh = await api.getShift(shiftId);
    setShift(fresh);
    applyState(pickState(fresh));
    commitVersion(fresh.version);
    dropDraft(shiftId);
    dirty.current = false;
    blocked.current = false;
    setError(null);
    setSync("saved");
  }, [api, shiftId, applyState, commitVersion]);

  return {
    shift,
    state,
    sync,
    error,
    version,
    update,
    saveNow,
    close,
    reopen,
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
