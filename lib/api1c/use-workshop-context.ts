"use client";

// Контекст цеха: сотрудники, виды работ, продукция, материалы, остатки.
// По контракту это один запрос при входе в цех, дальше работа идёт с кэшем,
// поэтому держим последний ответ в памяти и не запрашиваем его на каждом экране.

import { useCallback, useEffect, useState } from "react";
import type { WorkshopContext } from "./index";
import { describeError, useApi1C } from "./provider";

const cache = new Map<string, WorkshopContext>();

export function useWorkshopContext(workshopId: string | undefined) {
  const { api } = useApi1C();
  const [context, setContext] = useState<WorkshopContext | null>(
    workshopId ? cache.get(workshopId) ?? null : null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(
    async (force = false) => {
      if (!workshopId) return;
      if (!force && cache.has(workshopId)) {
        setContext(cache.get(workshopId)!);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const fresh = await api.workshopContext(workshopId);
        cache.set(workshopId, fresh);
        setContext(fresh);
      } catch (e) {
        setError(describeError(e));
      } finally {
        setLoading(false);
      }
    },
    [api, workshopId],
  );

  useEffect(() => {
    void reload();
  }, [reload]);

  return { context, loading, error, reload };
}

/** Сбросить кэш цеха: после закрытия смены остатки уже другие. */
export function invalidateWorkshopContext(workshopId?: string): void {
  if (workshopId) cache.delete(workshopId);
  else cache.clear();
}
