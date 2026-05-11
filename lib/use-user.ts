"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Enums } from "@/lib/supabase/types";

export type ClientEmployee = Tables<"employees"> & {
  workshop: Pick<Tables<"workshops">, "id" | "code" | "name"> | null;
};

export type ClientUser = {
  authUser: User;
  employee: ClientEmployee | null;
  role: Enums<"user_role"> | null;
};

type State =
  | { status: "loading"; user: null }
  | { status: "ready"; user: ClientUser | null };

/**
 * Хук для Client Components. Возвращает текущего пользователя + employee.
 * Слушает onAuthStateChange — при логауте/логине обновляется автоматически.
 */
export function useUser(): State {
  const [state, setState] = useState<State>({ status: "loading", user: null });

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function load(authUser: User | null) {
      if (!authUser) {
        if (!cancelled) setState({ status: "ready", user: null });
        return;
      }
      const { data } = await supabase
        .from("employees")
        .select("*, workshop:workshops(id, code, name)")
        .eq("user_id", authUser.id)
        .maybeSingle();
      if (cancelled) return;
      const employee = data as ClientEmployee | null;
      setState({
        status: "ready",
        user: {
          authUser,
          employee,
          role: employee?.role ?? null,
        },
      });
    }

    supabase.auth.getUser().then(({ data }) => load(data.user));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      load(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}
