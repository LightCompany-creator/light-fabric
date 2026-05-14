// Локальная очередь мутаций для оффлайн-режима.
// Хранится в localStorage (до 5 МБ — для типичной смены этого хватает с запасом).
//
// Поток:
//  1. Форма пытается отправить мутацию через server action
//  2. Если сеть отвалилась (TypeError "Failed to fetch") — кладём в очередь
//  3. На событие 'online' и при загрузке страницы — QueueSyncer прогоняет очередь
//  4. Успешно отправленные удаляются, упавшие на 4xx помечаются 'failed'
//
// localStorage используется потому что: проще IndexedDB, синхронный (предсказуемый
// UX), достаточно ёмкий для одной смены. При больших объёмах переедем на IDB.

const KEY = "lf-offline-queue";

export type MutationType = "addOutput";

export type QueuedMutation = {
  id: string;
  type: MutationType;
  payload: Record<string, string | number | null>;
  context: Record<string, string>; // shiftId и т.п.
  createdAt: number;
  attempts: number;
  lastError: string | null;
  status: "pending" | "failed";
};

function safeRead(): QueuedMutation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function safeWrite(items: QueuedMutation[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(items));
    // Уведомить подписчиков
    window.dispatchEvent(new CustomEvent("lf-queue-changed"));
  } catch (e) {
    console.warn("offline queue: failed to write", e);
  }
}

export function queueList(): QueuedMutation[] {
  return safeRead();
}

export function queueCount(): { pending: number; failed: number } {
  const items = safeRead();
  return {
    pending: items.filter((i) => i.status === "pending").length,
    failed: items.filter((i) => i.status === "failed").length,
  };
}

export function queueAdd(
  type: MutationType,
  payload: QueuedMutation["payload"],
  context: QueuedMutation["context"],
): QueuedMutation {
  const items = safeRead();
  const item: QueuedMutation = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    context,
    createdAt: Date.now(),
    attempts: 0,
    lastError: null,
    status: "pending",
  };
  items.push(item);
  safeWrite(items);
  return item;
}

export function queueRemove(id: string): void {
  const items = safeRead().filter((i) => i.id !== id);
  safeWrite(items);
}

export function queueMarkFailed(id: string, error: string): void {
  const items = safeRead().map((i) =>
    i.id === id ? { ...i, status: "failed" as const, lastError: error } : i,
  );
  safeWrite(items);
}

export function queueIncrementAttempts(id: string): void {
  const items = safeRead().map((i) =>
    i.id === id ? { ...i, attempts: i.attempts + 1 } : i,
  );
  safeWrite(items);
}

export function queueRetryFailed(): void {
  const items = safeRead().map((i) =>
    i.status === "failed" ? { ...i, status: "pending" as const, lastError: null } : i,
  );
  safeWrite(items);
}

// Распознаём «сетевую» ошибку — её имеет смысл ставить в очередь.
// Остальное (4xx/5xx, validation, RLS) — реальная ошибка, не ретраить.
export function isNetworkError(e: unknown): boolean {
  if (e instanceof TypeError) return true; // fetch failed
  if (e instanceof Error) {
    const m = e.message.toLowerCase();
    return (
      m.includes("failed to fetch") ||
      m.includes("network") ||
      m.includes("offline") ||
      m.includes("load failed")
    );
  }
  return false;
}
