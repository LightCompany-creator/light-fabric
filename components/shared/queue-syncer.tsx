"use client";

import { useEffect, useRef } from "react";
import {
  isNetworkError,
  queueIncrementAttempts,
  queueList,
  queueMarkFailed,
  queueRemove,
} from "@/lib/offline-queue";
import { REPLAYERS } from "@/lib/offline-replay";

const MAX_ATTEMPTS = 5;

// Прогон очереди раз в N секунд если есть pending элементы и сеть.
const POLL_INTERVAL_MS = 30_000;

export function QueueSyncer() {
  const syncing = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const sync = async () => {
      if (syncing.current) return;
      if (!navigator.onLine) return;
      const items = queueList().filter((i) => i.status === "pending");
      if (items.length === 0) return;

      syncing.current = true;
      try {
        for (const item of items) {
          const replayer = REPLAYERS[item.type];
          if (!replayer) {
            queueMarkFailed(item.id, `Неизвестный тип мутации: ${item.type}`);
            continue;
          }
          try {
            queueIncrementAttempts(item.id);
            await replayer(item);
            queueRemove(item.id);
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            if (isNetworkError(e)) {
              // сеть снова упала — стоп, попробуем позже
              break;
            }
            if (item.attempts + 1 >= MAX_ATTEMPTS) {
              queueMarkFailed(item.id, msg);
            } else {
              // оставляем pending, в следующий цикл повторим
              console.warn("queue replay failed (will retry):", msg);
            }
          }
        }
      } finally {
        syncing.current = false;
      }
    };

    // Прогон при загрузке + при возврате сети
    sync();
    window.addEventListener("online", sync);

    // Периодический прогон (на случай если 'online' не выстрелил)
    const t = setInterval(sync, POLL_INTERVAL_MS);

    // Прогон при изменении очереди извне
    const onChange = () => sync();
    window.addEventListener("lf-queue-changed", onChange as EventListener);

    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("lf-queue-changed", onChange as EventListener);
      clearInterval(t);
    };
  }, []);

  return null;
}
