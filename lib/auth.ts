import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { Tables, Enums } from "@/lib/supabase/types";

export type EmployeeProfile = Tables<"employees"> & {
  workshop: Pick<Tables<"workshops">, "id" | "code" | "name"> | null;
};

export type CurrentUser = {
  authId: string;
  email: string | null;
  employee: EmployeeProfile | null;
  role: Enums<"user_role"> | null;
};

/**
 * Возвращает текущего пользователя для Server Components / Server Actions.
 * Кеширован на запрос (React `cache`) — несколько вызовов внутри одного рендера
 * сходят в одну сессию Supabase.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("employees")
    .select("*, workshop:workshops(id, code, name)")
    .eq("user_id", user.id)
    .maybeSingle();
  const employee = data as EmployeeProfile | null;

  return {
    authId: user.id,
    email: user.email ?? null,
    employee,
    role: employee?.role ?? null,
  };
});

/**
 * Жёсткий вариант — если пользователя нет, бросает.
 * Используй внутри роутов под middleware-защитой, где user гарантирован.
 */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized — middleware должно было перенаправить на /login");
  }
  return user;
}
