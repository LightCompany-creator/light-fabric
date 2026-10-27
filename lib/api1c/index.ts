// Единая точка входа в обмен с 1С.
// Пока не задан NEXT_PUBLIC_API_1C_URL, приложение работает на заглушке (mock.ts),
// поэтому экраны можно писать и проверять до публикации сервиса Арсена.

import type { Api1C } from "./api";
import { Api1CClient, Api1CError, basicAuthHeader } from "./client";
import { Api1CMock, MOCK_PRODUCTION_SHOP } from "./mock";

export type { Api1C } from "./api";
export * from "./types";
export { Api1CClient, Api1CError, Api1COfflineError, basicAuthHeader } from "./client";
export { Api1CMock } from "./mock";
export { localDate, daysAgo } from "./dates";

export type Credentials = { login: string; password: string };

/**
 * Клиент для текущего окружения.
 * Учётные данные пользователя 1С приходят из формы входа: своего механизма
 * пользователей у приложения больше нет.
 */
export function createApi1C(credentials?: Credentials): Api1C {
  const baseUrl = process.env.NEXT_PUBLIC_API_1C_URL;
  if (!baseUrl) {
    // В заглушке права администратора даёт сам логин: войдите как «админ»,
    // чтобы проверить переоткрытие смены. В 1С это решает сам пользователь.
    const login = (credentials?.login ?? "").toLowerCase();
    const isAdmin = login.includes("админ") || login.includes("admin");
    const manager = login.includes("производ") || login.includes("proizv") || login.includes("manager");
    return new Api1CMock({
      isAdmin,
      userName: isAdmin ? "Администратор" : manager ? "Начальник производства" : undefined,
      workshopIds: isAdmin ? undefined : mockWorkshopsFor(login),
      // Начальник четырёх участков привязан к производственному цеху (v0.4).
      productionShop: !isAdmin && mockWorkshopsFor(login)?.length === 4 ? MOCK_PRODUCTION_SHOP : null,
    });
  }
  if (!credentials) {
    // До входа клиент существует, но любой запрос честно отвечает «нужен вход».
    // Бросать исключение здесь нельзя: провайдер создаёт клиент ещё на экране
    // логина, и приложение падало бы до того, как человек ввёл пароль.
    return new Api1CClient({
      baseUrl,
      getAuthHeader: () => {
        throw new Api1CError("forbidden", "Нужен вход по учётной записи 1С", 401);
      },
    });
  }

  return new Api1CClient({
    baseUrl,
    getAuthHeader: () => basicAuthHeader(credentials.login, credentials.password),
  });
}

/**
 * Цеха пользователя заглушки по логину. В 1С это решает привязка учётной записи
 * к подразделениям: у начальника цеха один цех, у начальника производства
 * несколько (Литейка ЭВА и ПВХ, Упаковка ЭВА и ПВХ), у прочих логинов все,
 * чтобы на демо видеть обе стороны передачи.
 */
function mockWorkshopsFor(login: string): string[] | undefined {
  // Латиница тоже: на планшете часто нет русской раскладки. Литейка ведёт четыре
  // участка Литейного цеха одной учётной записью (lit), как у Арсена в 1С.
  const fourSections = ["производ", "proizv", "manager", "лит", "lit"];
  if (fourSections.some((k) => login.includes(k))) {
    return ["w-lit", "w-lit-pvc", "w-pack-eva", "w-pack-pvc"];
  }
  const byKeyword: [string, string][] = [
    ["упак", "w-pack-eva"],
    ["pack", "w-pack-eva"],
    ["upak", "w-pack-eva"],
    ["крой", "w-cut"],
    ["kroy", "w-cut"],
    ["cut", "w-cut"],
    ["швей", "w-sew"],
    ["shv", "w-sew"],
    ["sew", "w-sew"],
    ["обшив", "w-assy"],
    ["obsh", "w-assy"],
    ["кле", "w-glu"],
    ["kle", "w-glu"],
    ["glue", "w-glu"],
    ["марк", "w-mark"],
    ["mark", "w-mark"],
    ["склад", "w-ship"],
    ["sklad", "w-ship"],
  ];
  const hit = byKeyword.find(([keyword]) => login.includes(keyword));
  return hit ? [hit[1]] : undefined;
}

/**
 * Ключ идемпотентности для запросов, создающих документ.
 * crypto.randomUUID браузер даёт только по HTTPS и на localhost; на сервере
 * фабрики приложение может открываться по http://, поэтому без него обходимся:
 * по контракту годится любая уникальная строка до 36 символов.
 */
export function newIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  const bytes = new Uint8Array(8);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  const random = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  return `${Date.now().toString(36)}-${random}`;
}
