// Единая точка входа в обмен с 1С.
// Пока не задан NEXT_PUBLIC_API_1C_URL, приложение работает на заглушке (mock.ts),
// поэтому экраны можно писать и проверять до публикации сервиса Арсена.

import type { Api1C } from "./api";
import { Api1CClient, basicAuthHeader } from "./client";
import { Api1CMock } from "./mock";

export type { Api1C } from "./api";
export * from "./types";
export { Api1CClient, Api1CError, Api1COfflineError, basicAuthHeader } from "./client";
export { Api1CMock } from "./mock";

export type Credentials = { login: string; password: string };

/**
 * Клиент для текущего окружения.
 * Учётные данные пользователя 1С приходят из формы входа: своего механизма
 * пользователей у приложения больше нет.
 */
export function createApi1C(credentials?: Credentials): Api1C {
  const baseUrl = process.env.NEXT_PUBLIC_API_1C_URL;
  if (!baseUrl) return new Api1CMock();
  if (!credentials) throw new Error("Нужны логин и пароль пользователя 1С");

  return new Api1CClient({
    baseUrl,
    getAuthHeader: () => basicAuthHeader(credentials.login, credentials.password),
  });
}

/** Ключ идемпотентности для запросов, создающих или проводящих документ. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID();
}
