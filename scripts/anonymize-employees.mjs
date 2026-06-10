// Удаляет всех реальных сотрудников Light Company и заводит чистый
// тестовый персонал: для каждого цеха — 1 начальник + 10 рабочих.
//
// СОХРАНЯЕТ: 5 системных тестовых аккаунтов TST-0001..TST-0005
// (они привязаны к auth-пользователям для демо-логина).
//
// УДАЛЯЕТ: всех остальных сотрудников + все существующие смены
// (они ссылаются на удаляемых работников; пересоздаём отдельно через
// scripts/seed-demo-shifts.mjs).
//
// Запуск: node --env-file=.env.local scripts/anonymize-employees.mjs

import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

// Цеха для штатки — все производственные + админка и листы.
const WORKSHOPS = [
  { code: "ANG", labelGen: "Ангара", labelNom: "Ангар" },
  { code: "LIT", labelGen: "Литейки", labelNom: "Литейка" },
  { code: "PACK", labelGen: "Упаковки", labelNom: "Упаковка" },
  { code: "CUT", labelGen: "Кроя", labelNom: "Крой" },
  { code: "SEW", labelGen: "Швейки", labelNom: "Швейка" },
  { code: "GLU", labelGen: "Клеевого", labelNom: "Клеевой" },
  { code: "ASSY", labelGen: "Обшива", labelNom: "Обшив" },
  { code: "MARK", labelGen: "Маркировки", labelNom: "Маркировка" },
  { code: "SHIP", labelGen: "Склада", labelNom: "Склад" },
  { code: "ADM", labelGen: "Администрации", labelNom: "Администрация" },
  { code: "LST", labelGen: "Листов", labelNom: "Листы" },
];

async function main() {
  console.log("📊 До начала:");
  const { count: empBefore } = await s
    .from("employees")
    .select("*", { count: "exact", head: true });
  const { count: shiftsBefore } = await s
    .from("shifts")
    .select("*", { count: "exact", head: true });
  console.log(`   сотрудников: ${empBefore}, смен: ${shiftsBefore}`);

  // ============ 1. Очистка смен ============
  // Удаляем ВСЕ смены — они ссылаются на работников через FK,
  // прямое удаление сотрудников упадёт. Демо-смены пересоздадим скриптом.
  console.log("\n🧹 Удаляю все смены (cascade в shift_outputs/shift_workers)...");
  const { error: e1 } = await s.from("shifts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (e1) throw e1;

  // ============ 2. Удаление не-TST сотрудников ============
  console.log("\n🧹 Удаляю всех сотрудников кроме TST-*...");
  const { error: e2 } = await s
    .from("employees")
    .delete()
    .not("tab_number", "like", "TST-%");
  if (e2) throw e2;

  // ============ 3. Маппинг workshop code → id ============
  const { data: wsRows } = await s.from("workshops").select("id, code");
  const wsId = new Map(wsRows.map((w) => [w.code, w.id]));

  // ============ 4. Создание тестовых сотрудников ============
  console.log("\n👥 Создаю тестовых сотрудников...");
  const newEmployees = [];

  for (const ws of WORKSHOPS) {
    // 1 начальник цеха
    newEmployees.push({
      tab_number: `F-${ws.code}`,
      full_name: `Начальник ${ws.labelGen}`,
      workshop_id: wsId.get(ws.code),
      position: ws.code === "ADM" ? "Главный администратор" : "Начальник цеха",
      role: "foreman",
      is_active: true,
    });

    // 10 рабочих
    for (let i = 1; i <= 10; i++) {
      const num = String(i).padStart(2, "0");
      newEmployees.push({
        tab_number: `W-${ws.code}-${num}`,
        full_name: `Работник ${ws.labelGen} ${num}`,
        workshop_id: wsId.get(ws.code),
        position:
          ws.code === "ADM" ? "Сотрудник администрации" : "Производственный работник",
        role: null,
        is_active: true,
      });
    }
  }

  // Вставляем батчами по 200
  for (let i = 0; i < newEmployees.length; i += 200) {
    const chunk = newEmployees.slice(i, i + 200);
    const { error } = await s.from("employees").insert(chunk);
    if (error) throw error;
  }
  console.log(`   создано: ${newEmployees.length}`);

  // ============ 5. Сводка ============
  console.log("\n📊 После:");
  const { count: empAfter } = await s
    .from("employees")
    .select("*", { count: "exact", head: true });
  const { count: shiftsAfter } = await s
    .from("shifts")
    .select("*", { count: "exact", head: true });
  console.log(`   сотрудников: ${empAfter} (${WORKSHOPS.length} начальников + ${WORKSHOPS.length * 10} рабочих + 5 TST)`);
  console.log(`   смен: ${shiftsAfter}`);

  console.log(
    "\n✓ Готово. Дальше: node --env-file=.env.local scripts/seed-demo-shifts.mjs — пересоздаст демо-смены с новыми работниками.",
  );
}

main().catch((e) => {
  console.error("✗", e.message);
  if (e.details) console.error("  details:", e.details);
  process.exit(1);
});
