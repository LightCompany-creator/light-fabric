// Создаёт auth-аккаунты для начальников всех цехов (F-XXX) и привязывает
// их к существующим employees. Для теста перемещений между цехами в демо.
// Запуск (Node 20+):
//   node --env-file=.env.local scripts/seed-workshop-foremen.mjs
//
// Email: foreman-<код цеха в нижнем регистре>@lightflow.test, пароль Test123!
// Идемпотентен: повторный запуск обновляет пароль и связи.

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error(
    "Нужны NEXT_PUBLIC_SUPABASE_URL и SUPABASE_SERVICE_ROLE_KEY в .env.local",
  );
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PASSWORD = "Test123!";

async function findAuthUserByEmail(email, usersCache) {
  return usersCache.find((u) => u.email === email) ?? null;
}

async function getOrCreateAuthUser(email, usersCache) {
  const existing = await findAuthUserByEmail(email, usersCache);
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password: PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    return { user: data.user, created: false };
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
  });
  if (error) throw error;
  return { user: data.user, created: true };
}

async function main() {
  console.log("→ Сидинг начальников цехов...\n");

  // Все начальники цехов из тестового штата (F-XXX)
  const { data: chiefsRaw, error } = await supabase
    .from("employees")
    .select("id, tab_number, full_name, workshop:workshops(id, code, name)")
    .like("tab_number", "F-%")
    .order("tab_number");
  if (error) throw error;
  const chiefs = chiefsRaw ?? [];
  if (chiefs.length === 0) {
    console.error("Нет сотрудников F-XXX — сначала anonymize-employees.mjs");
    process.exit(1);
  }

  const { data: usersPage, error: luErr } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 500,
  });
  if (luErr) throw luErr;
  const usersCache = usersPage.users;

  for (const chief of chiefs) {
    const code = chief.workshop?.code;
    if (!code || code === "ADM") continue; // у администрации свой admin-аккаунт

    const email = `foreman-${code.toLowerCase()}@lightflow.test`;
    try {
      const { user, created } = await getOrCreateAuthUser(email, usersCache);
      const { error: updErr } = await supabase
        .from("employees")
        .update({ user_id: user.id, role: "foreman" })
        .eq("id", chief.id);
      if (updErr) throw updErr;
      console.log(
        `  ${created ? "✓ создан " : "↺ обновлён"}  ${email}  → ${chief.full_name} (${code})`,
      );
    } catch (e) {
      console.error(`  ✗ ${email}:`, e.message ?? e);
      process.exitCode = 1;
    }
  }

  console.log("\nПароль для всех:", PASSWORD);
  console.log("Готово.");
}

main();
