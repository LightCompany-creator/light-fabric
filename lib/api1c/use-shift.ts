"use client";

// Работа с документом смены: локальное состояние, автосохранение в 1С,
// черновик на устройстве и разбор расхождений.
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
//
// При расхождении побеждает 1С (правило согласовано с 1С-программистом):
// приложение ничего не затирает в 1С, берёт её версию в работу, а локальную
// копию показывает рядом, чтобы человек перенёс своё вручную.

import { useCallback, useEffect, useRef, useState } from "react";
import { Api1CError, Api1COfflineError } from "./index";
import type { Shift, ShiftAccounting, ShiftState } from "./index";
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

// ---------- хранение на планшете ----------

/** Черновик помнит версию 1С, от которой он отсчитан: по ней ловим расхождение. */
type Draft = { base?: string; state: ShiftState };

const draftKey = (shiftId: string) => `lf.1c.shift.${shiftId}`;
const mineKey = (shiftId: string) => `lf.1c.shift.${shiftId}.mine`;

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Хранилище недоступно: работаем в памяти, это не повод останавливать смену.
  }
}

function dropKey(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

function readDraft(shiftId: string): Draft | null {
  const raw = readJson<Draft | ShiftState>(draftKey(shiftId));
  if (!raw) return null;
  // Черновики до v0.2 лежали голым состоянием, без версии.
  return "state" in raw ? raw : { state: raw };
}

// ---------- хук ----------

export type UseShift = {
  shift: Shift | null;
  state: ShiftState;
  sync: SyncStatus;
  error: string | null;
  /** Версия документа в 1С, по которой мы работаем. */
  version: string | undefined;
  /**
   * Локальная копия, оставшаяся после расхождения с 1С. В работе версия 1С,
   * а эта показывается рядом только для чтения, пока человек её не уберёт.
   */
  mine: ShiftState | null;
  dismissMine: () => void;
  /** Правка любой части документа: уходит в 1С сама. */
  update: (patch: Partial<ShiftState>) => void;
  /** Отправить прямо сейчас, не дожидаясь паузы. */
  saveNow: () => Promise<void>;
  /** Закрыть смену. Возвращает состояние учёта: отражена или ждёт отражения. */
  close: () => Promise<ShiftAccounting>;
  /** Перечитать документ из 1С: так обновляется состояние учёта у закрытой смены. */
  refresh: () => Promise<void>;
  /** Переоткрыть закрытую смену. Только администратор. */
  reopen: (reason: string) => Promise<void>;
  /** Повторить получение версии 1С, если при расхождении не было связи. */
  retryConflict: () => Promise<void>;
};

export function useShift(shiftId: string, opts: { knownVersion?: string } = {}): UseShift {
  const { api, status } = useApi1C();
  const [shift, setShift] = useState<Shift | null>(null);
  const [state, setState] = useState<ShiftState>(EMPTY_STATE);
  const [version, setVersion] = useState<string | undefined>();
  const [sync, setSync] = useState<SyncStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [mine, setMine] = useState<ShiftState | null>(null);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Последнее состояние документа, всегда совпадает со state. */
  const latest = useRef<ShiftState>(EMPTY_STATE);
  /** Версия в 1С на момент отправки, а не на момент постановки таймера. */
  const versionRef = useRef<string | undefined>(undefined);
  const saving = useRef(false);
  /** Были правки после начала последней отправки: их нужно дослать. */
  const dirty = useRef(false);
  /** Расхождение не разобрано: автоотправка стоит, пока не получим версию 1С. */
  const blocked = useRef(false);
  /** Версия из кэша контекста цеха: нужна, если смену открыли без связи. */
  const knownVersion = useRef(opts.knownVersion);
  knownVersion.current = opts.knownVersion;
  const pushRef = useRef<() => Promise<unknown>>(async () => null);
  const retryConflictRef = useRef<() => Promise<void>>(async () => {});

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void pushRef.current(), SAVE_DELAY_MS);
  }, []);

  const commitVersion = useCallback((next: string | undefined) => {
    versionRef.current = next;
    setVersion(next);
  }, []);

  const applyState = useCallback((next: ShiftState) => {
    latest.current = next;
    setState(next);
  }, []);

  /** Версия 1С идёт в работу, своя копия откладывается в сторону. */
  const adoptServer = useCallback(
    (doc: Shift, local: ShiftState) => {
      writeJson(mineKey(shiftId), local);
      dropKey(draftKey(shiftId));
      setMine(local);
      setShift(doc);
      applyState(pickState(doc));
      commitVersion(doc.version);
      dirty.current = false;
      blocked.current = false;
      setError(null);
      setSync("saved");
    },
    [shiftId, applyState, commitVersion],
  );

  // ---------- первая загрузка ----------

  useEffect(() => {
    // Пока сеанс не восстановлен, клиент без учётных данных: ждём, иначе первый
    // запрос уйдёт впустую и мигнёт ошибкой до настоящей загрузки.
    if (status !== "ready") return;
    let cancelled = false;

    async function load() {
      setSync("loading");
      setMine(readJson<ShiftState>(mineKey(shiftId)));
      try {
        const doc = await api.getShift(shiftId);
        if (cancelled) return;

        const draft = doc.status === "open" ? readDraft(shiftId) : null;
        if (draft && draft.base && draft.base !== doc.version) {
          // Пока планшет был без связи, документ изменили в 1С. Побеждает 1С.
          adoptServer(doc, draft.state);
          return;
        }

        // Черновик на планшете новее того, что успело уйти в 1С: продолжаем с него.
        setShift(doc);
        applyState(draft?.state ?? pickState(doc));
        commitVersion(doc.version);
        dirty.current = Boolean(draft);
        setSync(draft ? "pending" : "saved");
        if (draft) schedule();
      } catch (e) {
        if (cancelled) return;
        if (e instanceof Api1COfflineError) {
          // Связи нет: продолжаем с того, что лежит на планшете. Если черновика ещё
          // нет, начинаем с чистого документа: всё уйдёт в 1С, когда сеть вернётся.
          const draft = readDraft(shiftId);
          applyState(draft?.state ?? EMPTY_STATE);
          commitVersion(draft?.base ?? knownVersion.current);
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
  }, [api, shiftId, status, applyState, commitVersion, adoptServer, schedule]);

  // ---------- отправка ----------

  /** Отправить состояние. Возвращает ошибку, если не получилось, иначе null. */
  const push = useCallback(async (): Promise<unknown> => {
    // Уже летит запрос: правки отмечены в dirty и уйдут следующей отправкой.
    if (saving.current || blocked.current) return null;
    saving.current = true;
    dirty.current = false;
    let failed = false;
    setSync("saving");
    try {
      const newVersion = await api.saveShift(shiftId, latest.current, versionRef.current);
      commitVersion(newVersion);
      setError(null);
      if (dirty.current) {
        // Пока запрос летел, человек продолжал вводить: черновик новее, его нельзя
        // удалять. Но отсчитан он теперь от новой версии, иначе после перезагрузки
        // приложение приняло бы собственное сохранение за чужую правку.
        writeJson(draftKey(shiftId), { base: newVersion, state: latest.current });
        setSync("pending");
      } else {
        dropKey(draftKey(shiftId));
        setSync("saved");
      }
      return null;
    } catch (e) {
      // Не ушло: правки по-прежнему только на планшете (черновик записан при вводе).
      failed = true;
      dirty.current = true;
      if (e instanceof Api1COfflineError) {
        setSync("offline");
      } else if (e instanceof Api1CError && e.code === "conflict") {
        blocked.current = true;
        setSync("conflict");
        setError("Смену изменили с другого устройства.");
        void retryConflictRef.current();
      } else {
        setError(describeError(e));
        setSync("error");
      }
      return e;
    } finally {
      saving.current = false;
      // Досылаем только правки, сделанные во время удачной отправки. После ошибки
      // повтор по таймеру бессмыслен: ждём возврата сети или правки человека.
      if (dirty.current && !blocked.current && !failed) schedule();
    }
  }, [api, shiftId, schedule, commitVersion]);

  useEffect(() => {
    pushRef.current = push;
  }, [push]);

  const update = useCallback(
    (patch: Partial<ShiftState>) => {
      const next = { ...latest.current, ...patch };
      applyState(next);
      writeJson(draftKey(shiftId), { base: versionRef.current, state: next });
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

  // ---------- расхождение с 1С ----------

  const retryConflict = useCallback(async () => {
    try {
      const fresh = await api.getShift(shiftId);
      adoptServer(fresh, latest.current);
    } catch (e) {
      // Версию 1С получить не удалось: остаёмся в расхождении, своё лежит в черновике.
      setError(
        e instanceof Api1COfflineError
          ? "Смену изменили с другого устройства. Нет связи, чтобы получить версию 1С."
          : describeError(e),
      );
      setSync("conflict");
    }
  }, [api, shiftId, adoptServer]);

  useEffect(() => {
    retryConflictRef.current = retryConflict;
  }, [retryConflict]);

  const dismissMine = useCallback(() => {
    dropKey(mineKey(shiftId));
    setMine(null);
  }, [shiftId]);

  // ---------- закрытие ----------

  const close = useCallback(async () => {
    if (timer.current) clearTimeout(timer.current);
    // Дожидаемся отправки, которая уже летит, и досылаем несохранённое. Закрывать
    // можно только то, что 1С приняла: иначе закроется документ без последних правок.
    while (saving.current) await new Promise((r) => setTimeout(r, 100));
    if (dirty.current) {
      const failure = await pushRef.current();
      if (failure) throw failure;
    }

    const result = await api.closeShift(shiftId, { version: versionRef.current });
    dropKey(draftKey(shiftId));
    dirty.current = false;

    // Ответ close краткий, а версия при закрытии меняется дважды и материалы 1С
    // заполняет сама. Поэтому перечитываем документ целиком; если связь пропала
    // ровно сейчас, обходимся тем, что пришло в ответе.
    try {
      const full = await api.getShift(shiftId);
      setShift(full);
      applyState(pickState(full));
      commitVersion(full.version);
      setSync("saved");
      return full.accounting ?? result.accounting;
    } catch {
      setShift((prev) => ({
        ...(prev as Shift),
        ...result.shift,
        ...latest.current,
        accounting: result.accounting,
      }));
      commitVersion(result.shift.version);
      setSync("saved");
      return result.accounting;
    }
  }, [api, shiftId, applyState, commitVersion]);

  const refresh = useCallback(async () => {
    const fresh = await api.getShift(shiftId);
    setShift(fresh);
    applyState(pickState(fresh));
    commitVersion(fresh.version);
  }, [api, shiftId, applyState, commitVersion]);

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

  return {
    shift,
    state,
    sync,
    error,
    version,
    mine,
    dismissMine,
    update,
    saveNow,
    close,
    refresh,
    reopen,
    retryConflict,
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
