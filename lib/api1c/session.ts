"use client";

// Сеанс работы с 1С на устройстве. Своего механизма пользователей у приложения
// больше нет: логин и пароль пользователя 1С вводятся при входе и остаются
// на планшете, потому что нужны в заголовке каждого запроса (Basic Auth).
//
// Открытый вопрос к Арсену (Н-2 в ответе на контракт): планшет в цеху общий,
// в ночную смену за ним другой человек. Пока храним до явного выхода,
// после его ответа заменим на токен сеанса, если он появится.

import type { Credentials, Me } from "./index";

const KEY = "lf.1c.session";

export type StoredSession = Credentials & {
  /** Цех, выбранный при входе: с ним работает вся смена. */
  workshopId?: string;
  userName?: string;
  /**
   * Ответ 1С о пользователе и его цехах с прошлого входа.
   * Нужен, чтобы планшет, перезапущенный без связи, всё равно пустил человека
   * к смене: заново спрашивать логин, когда сети нет, значит остановить цех.
   */
  me?: Me;
};

function storage(): Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage;
  } catch {
    return null; // приватный режим или запрет хранилища
  }
}

export function loadSession(): StoredSession | null {
  const raw = storage()?.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

export function saveSession(session: StoredSession): void {
  storage()?.setItem(KEY, JSON.stringify(session));
}

export function updateSession(patch: Partial<StoredSession>): StoredSession | null {
  const current = loadSession();
  if (!current) return null;
  const next = { ...current, ...patch };
  saveSession(next);
  return next;
}

export function clearSession(): void {
  storage()?.removeItem(KEY);
}
