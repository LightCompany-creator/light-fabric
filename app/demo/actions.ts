"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const DEMO_PASSWORD = "Test123!";

const DEMO_ACCOUNTS: Record<string, string> = {
  director: "director@lightflow.test",
  accountant: "accountant@lightflow.test",
  technologist: "tech@lightflow.test",
  foreman: "foreman@lightflow.test",
  admin: "admin@lightflow.test",
  production_manager: "production@lightflow.test",
  commercial_director: "commercial@lightflow.test",
};

// Карточки начальников цехов: ключ foreman-<КОД> → foreman-<код>@lightflow.test
// Аккаунты создаёт scripts/seed-workshop-foremen.mjs
const WORKSHOP_FOREMAN_KEY = /^foreman-([A-Z]{2,5})$/;

export type DemoLoginState = { error: string | null };

export async function demoLoginAction(
  _prev: DemoLoginState,
  formData: FormData,
): Promise<DemoLoginState> {
  const roleKey = String(formData.get("role") ?? "");
  const wsMatch = roleKey.match(WORKSHOP_FOREMAN_KEY);
  const email = wsMatch
    ? `foreman-${wsMatch[1].toLowerCase()}@lightflow.test`
    : DEMO_ACCOUNTS[roleKey];
  if (!email) return { error: "Неизвестная демо-роль" };

  const supabase = createClient();
  await supabase.auth.signOut();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: DEMO_PASSWORD,
  });
  if (error) {
    return {
      error:
        "Демо-аккаунт не найден. Запусти node --env-file=.env.local scripts/seed-users.mjs",
    };
  }
  redirect("/dashboard");
}
