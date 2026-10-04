"use client";

// Контекст цеха: сотрудники, виды работ, продукция, материалы, остатки.
// По контракту это один запрос при входе в цех, дальше работа идёт с кэшем,
// поэтому держим последний ответ в памяти и не запрашиваем его на каждом экране.

import { useCallback, useEffect, useState } from "react";
import { Api1COfflineError } from "./index";
import type { WorkshopContext } from "./index";
import { describeError, useApi1C } from "./provider";

const cache = new Map<string, WorkshopContext>();
/** Цеха, у которых сохранённая копия заведомо устарела: закрыли смену, провели передачу. */
const outdated = new Set<string>();

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
      // Но не тогда, когда мы сами только что изменили данные: иначе на секунду
      // показалась бы закрытая смена как открытая или остаток до передачи.
      const saved = readStored(workshopId);
      if (saved && !outdated.has(workshopId)) setContext((prev) => prev ?? saved.context);
      setLoading(true);
      setError(null);
      try {
        const fresh = await api.workshopContext(workshopId);
        cache.set(workshopId, fresh);
        writeStored(workshopId, fresh);
        outdated.delete(workshopId);
        setContext(fresh);
        setStaleSince(null);
      } catch (e) {
        // Связи нет: работаем на том, что сохранили в прошлый раз, и говорим об этом.
        // При других отказах (нет прав, ошибка 1С) старые данные за свежие не выдаём.
        const stored = e instanceof Api1COfflineError ? readStored(workshopId) : null;
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
  if (workshopId) {
    cache.delete(workshopId);
    outdated.add(workshopId);
  } else {
    // Без номера цеха сбрасываем всё: передача меняет остатки сразу у двух цехов.
    Array.from(cache.keys()).forEach((id) => outdated.add(id));
    cache.clear();
    try {
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key?.startsWith(STORE_PREFIX)) outdated.add(key.slice(STORE_PREFIX.length));
      }
    } catch {
      /* хранилище недоступно */
    }
  }
}
