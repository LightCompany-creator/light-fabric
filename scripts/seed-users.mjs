// Создаёт 4 тестовых аккаунта в Supabase Auth и связывает их с employees.
// Запуск (Node 20+):
//   node --env-file=.env.local scripts/seed-users.mjs
//
// Идемпотентен: повторный запуск не создаст дубликатов.

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

const USERS = [
  {
    email: "foreman@lightflow.test",
    role: "foreman",
    tab: "TST-0001",
    fullName: "Тестовый Начальник цеха (Литейка)",
    position: "Начальник цеха",
    workshopCode: "LIT",
  },
  {
    email: "tech@lightflow.test",
    role: "technologist",
    tab: "TST-0002",
    fullName: "Тестовый Технолог",
    position: "Технолог",
    workshopCode: null,
  },
  {
    email: "director@lightflow.test",
    role: "director",
    tab: "TST-0003",
    fullName: "Тестовый Директор",
    position: "Директор",
    workshopCode: null,
  },
  {
    email: "accountant@lightflow.test",
    role: "accountant",
    tab: "TST-0004",
    fullName: "Тестовый Бухгалтер",
    position: "Бухгалтер",
    workshopCode: null,
  },
  {
    email: "admin@lightflow.test",
    role: "admin",
    tab: "TST-0005",
    fullName: "Тестовый Администратор",
    position: "Администратор системы",
    workshopCode: null,
  },
  {
    email: "production@lightflow.test",
    role: "production_manager",
    tab: "TST-0006",
    fullName: "Тестовый Начальник производства",
    position: "Начальник производства",
    workshopCode: null,
  },
  {
    email: "commercial@lightflow.test",
    role: "commercial_director",
    tab: "TST-0007",
    fullName: "Тестовый Коммерческий директор",
    position: "Коммерческий директор",
    workshopCode: null,
  },
];

async function findAuthUserByEmail(email) {
  // listUsers пагинирован — для 4 тестовых хватит первой страницы.
  const { data, error } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  if (error) throw error;
  return data.users.find((u) => u.email === email) ?? null;
}

async function getOrCreateAuthUser(email) {
  const existing = await findAuthUserByEmail(email);
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

async function getWorkshopId(code) {
  if (!code) return null;
  const { data, error } = await supabase
    .from("workshops")
    .select("id")
    .eq("code", code)
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertEmployee({
  authUserId,
  tab,
  fullName,
  position,
  workshopId,
  role,
}) {
  const { error } = await supabase.from("employees").upsert(
    {
      tab_number: tab,
      full_name: fullName,
      position,
      workshop_id: workshopId,
      user_id: authUserId,
      role,
      is_active: true,
    },
    { onConflict: "tab_number" },
  );
  if (error) throw error;
}

async function main() {
  console.log("→ Сидинг тестовых пользователей...\n");
  for (const u of USERS) {
    try {
      const { user, created } = await getOrCreateAuthUser(u.email);
      const workshopId = await getWorkshopId(u.workshopCode);
      await upsertEmployee({
        authUserId: user.id,
        tab: u.tab,
        fullName: u.fullName,
        position: u.position,
        workshopId,
        role: u.role,
      });
      console.log(`  ${created ? "✓ создан " : "↺ обновлён"}  ${u.email}  (${u.role})`);
    } catch (e) {
      console.error(`  ✗ ${u.email}:`, e.message ?? e);
      process.exitCode = 1;
    }
  }
  console.log("\nПароль для всех:", PASSWORD);
  console.log("Готово.");
}

main();
