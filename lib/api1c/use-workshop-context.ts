"use client";

// Контекст цеха: сотрудники, виды работ, продукция, материалы, остатки.
// По контракту это один запрос при входе в цех, дальше работа идёт с кэшем,
// поэтому держим последний ответ в памяти и не запрашиваем его на каждом экране.

import { useCallback, useEffect, useState } from "react";
import type { WorkshopContext } from "./index";
import { describeError, useApi1C } from "./provider";

const cache = new Map<string, WorkshopContext>();

// Кэш сеанса, как в контракте: справочники должны пережить перезагрузку планшета
// без сети, иначе утром в цеху с плохим вайфаем работать будет нечем.
const STORE_PREFIX = "lf.1c.context.";

type StoredContext = { at: string; context: WorkshopContext };

function readStored(workshopId: string): StoredContext | null {
  try {
    const raw = window.localStorage.getItem(STORE_PREFIX + workshopId);
    return raw ? (JSON.parse(raw) as StoredContext) : null;
  } catch {
    return null;
  }
}

function writeStored(workshopId: string, context: WorkshopContext): void {
  try {
    const payload: StoredContext = { at: new Date().toISOString(), context };
    window.localStorage.setItem(STORE_PREFIX + workshopId, JSON.stringify(payload));
  } catch {
    /* хранилище недоступно: останемся с кэшем в памяти */
  }
}

export function useWorkshopContext(workshopId: string | undefined) {
  const { api } = useApi1C();
  const [context, setContext] = useState<WorkshopContext | null>(
    workshopId ? cache.get(workshopId) ?? null : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Когда справочники были получены, если сейчас работаем без связи. */
  const [staleSince, setStaleSince] = useState<string | null>(null);

  const reload = useCallback(
    async (force = false) => {
      if (!workshopId) return;
      if (!force && cache.has(workshopId)) {
        setContext(cache.get(workshopId)!);
        return;
      }
      // Показываем сохранённое сразу, чтобы экран не мигал пустотой, пока идёт запрос.
      const stored = readStored(workshopId);
      if (stored) setContext((prev) => prev ?? stored.context);
      setLoading(true);
      setError(null);
      try {
        const fresh = await api.workshopContext(workshopId);
        cache.set(workshopId, fresh);
        writeStored(workshopId, fresh);
        setContext(fresh);
        setStaleSince(null);
      } catch (e) {
        // Связи нет: работаем на том, что сохранили в прошлый раз, и говорим об этом.
        const stored = readStored(workshopId);
        if (stored) {
          cache.set(workshopId, stored.context);
          setContext(stored.context);
          setStaleSince(stored.at);
        } else {
          setError(describeError(e));
        }
      } finally {
        setLoading(false);
      }
    },
    [api, workshopId],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return { context, loading, error, staleSince, reload };
}

/** Сбросить кэш цеха: после закрытия смены остатки уже другие. */
export function invalidateWorkshopContext(workshopId?: string): void {
  if (workshopId) cache.delete(workshopId);
  else cache.clear();
}
