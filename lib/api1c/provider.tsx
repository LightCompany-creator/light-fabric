"use client";

// Контекст работы с 1С для всех экранов цеха: кто вошёл, какие у него цеха,
// какой выбран сейчас. Экраны берут клиента отсюда и не знают, настоящая это
// 1С или заглушка: решает NEXT_PUBLIC_API_1C_URL.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { Api1CError, Api1COfflineError, createApi1C } from "./index";
import type { Api1C, Me, WorkshopRef } from "./index";
import { clearSession, loadSession, saveSession, updateSession } from "./session";

export type Session1C =
  | { status: "loading"; me: null; workshop: null; offline?: boolean }
  | { status: "anonymous"; me: null; workshop: null; offline?: boolean }
  | { status: "ready"; me: Me; workshop: WorkshopRef | null; offline?: boolean };

type Context1C = Session1C & {
  /** Клиент обмена: с учётными данными сеанса, если вход выполнен. */
  api: Api1C;
  /** Работаем на заглушке, а не на настоящей 1С. */
  isMock: boolean;
  signIn: (login: string, password: string) => Promise<void>;
  signOut: () => void;
  selectWorkshop: (workshopId: string) => void;
};

const Api1CContext = createContext<Context1C | null>(null);

export function isMockMode(): boolean {
  return !process.env.NEXT_PUBLIC_API_1C_URL;
}

/** Текст ошибки, который можно показать человеку как есть. */
export function describeError(error: unknown): string {
  if (error instanceof Api1COfflineError) {
    return "Нет связи с 1С. Проверьте сеть: введённое сохранено на планшете.";
  }
  if (error instanceof Api1CError) {
    if (error.httpStatus === 401) return "Неверный логин или пароль 1С.";
    return error.isUserFacing ? error.message : "Ошибка на стороне 1С. Сообщите администратору.";
  }
  return "Не получилось выполнить действие. Попробуйте ещё раз.";
}

export function Api1CProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session1C>({ status: "loading", me: null, workshop: null });
  const [credentials, setCredentials] = useState<{ login: string; password: string } | null>(null);

  const api = useMemo<Api1C>(() => createApi1C(credentials ?? undefined), [credentials]);

  // Восстановление сеанса при запуске: планшет перезагрузили, входить заново не нужно.
  useEffect(() => {
    const stored = loadSession();
    if (!stored) {
      setSession({ status: "anonymous", me: null, workshop: null });
      return;
    }
    setCredentials({ login: stored.login, password: stored.password });

    let cancelled = false;
    const pick = (me: Me) =>
      me.workshops.find((w) => w.id === stored.workshopId) ?? me.workshops[0] ?? null;

    createApi1C({ login: stored.login, password: stored.password })
      .me()
      .then((me) => {
        if (cancelled) return;
        saveSession({ ...stored, me, userName: me.user.name });
        setSession({ status: "ready", me, workshop: pick(me) });
      })
      .catch((e) => {
        if (cancelled) return;
        if (e instanceof Api1COfflineError && stored.me) {
          // Связи нет, но человек уже входил на этом планшете: пускаем работать.
          setSession({ status: "ready", me: stored.me, workshop: pick(stored.me), offline: true });
          return;
        }
        // Учётные данные больше не подходят: спрашиваем заново.
        clearSession();
        setSession({ status: "anonymous", me: null, workshop: null });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (login: string, password: string) => {
    const client = createApi1C({ login, password });
    const me = await client.me();
    const workshop = me.workshops[0] ?? null;
    saveSession({ login, password, workshopId: workshop?.id, userName: me.user.name, me });
    setCredentials({ login, password });
    setSession({ status: "ready", me, workshop });
  }, []);

  const signOut = useCallback(() => {
    clearSession();
    setCredentials(null);
    setSession({ status: "anonymous", me: null, workshop: null });
  }, []);

  const selectWorkshop = useCallback((workshopId: string) => {
    updateSession({ workshopId });
    setSession((prev) => {
      if (prev.status !== "ready") return prev;
      const workshop = prev.me.workshops.find((w) => w.id === workshopId) ?? prev.workshop;
      return { ...prev, workshop };
    });
  }, []);

  const value: Context1C = {
    ...session,
    api,
    isMock: isMockMode(),
    signIn,
    signOut,
    selectWorkshop,
  };

  return <Api1CContext.Provider value={value}>{children}</Api1CContext.Provider>;
}

export function useApi1C(): Context1C {
  const ctx = useContext(Api1CContext);
  if (!ctx) throw new Error("useApi1C вызван вне Api1CProvider");
  return ctx;
}
