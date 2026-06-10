// Заводит реалистичные тестовые смены за последние 2 недели
// чтобы дашборд директора показывал живые цифры на демонстрации.
//
// ОСТОРОЖНО: при перезапуске удаляет ранее созданные тестовые смены
// (с notes='[demo-seed]'), новые с тем же notes-тегом.
//
// Запуск: node --env-file=.env.local scripts/seed-demo-shifts.mjs

import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const DEMO_TAG = "[demo-seed]";

// Утилита: дата N дней назад в YYYY-MM-DD
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

// План смен. Каждая = реалистичный рабочий день одного цеха.
const PLAN = [
  // ============ Литейный цех ============
  {
    daysBack: 13,
    type: "день",
    workshop: "LIT",
    foremanTab: "F-LIT",
    outputs: [
      { code: "022/1", qty: 180, machine: "Шестёрка", cast_forms: 6, defect: 4 },
      { code: "007", qty: 240, machine: "KCLKA 1", cast_forms: 6, defect: 6 },
      { code: "905", qty: 120, machine: "Четвёрка", cast_forms: 4, defect: 2 },
    ],
    workers: [
      { tab: "W-LIT-01", ops: [{ code: "022/1", op: "литьё", qty: 180 }, { code: "905", op: "литьё", qty: 60 }] },
      { tab: "W-LIT-02", ops: [{ code: "007", op: "литьё", qty: 240 }] },
      { tab: "W-LIT-03", ops: [{ code: "905", op: "литьё", qty: 60 }] },
    ],
  },
  {
    daysBack: 11,
    type: "день",
    workshop: "LIT",
    foremanTab: "F-LIT",
    outputs: [
      { code: "112/н", qty: 80, machine: "KCLKA 2", cast_forms: 4, defect: 1 },
      { code: "184/н", qty: 60, machine: "Четвёрка", cast_forms: 4, defect: 0 },
    ],
    workers: [
      { tab: "W-LIT-04", ops: [{ code: "112/н", op: "литьё", qty: 80 }] },
      { tab: "W-LIT-05", ops: [{ code: "184/н", op: "литьё", qty: 60 }] },
    ],
  },
  {
    daysBack: 9,
    type: "ночь",
    workshop: "LIT",
    foremanTab: "F-LIT",
    outputs: [
      { code: "022/1", qty: 150, machine: "Шестёрка", cast_forms: 6, defect: 3 },
      { code: "907", qty: 100, machine: "Четвёрка", cast_forms: 4, defect: 1 },
    ],
    workers: [
      { tab: "W-LIT-01", ops: [{ code: "022/1", op: "литьё", qty: 150 }] },
      { tab: "W-LIT-03", ops: [{ code: "907", op: "литьё", qty: 100 }] },
    ],
  },
  {
    daysBack: 6,
    type: "день",
    workshop: "LIT",
    foremanTab: "F-LIT",
    outputs: [
      { code: "007", qty: 300, machine: "KCLKA 3", cast_forms: 6, defect: 5 },
      { code: "1027", qty: 80, machine: "Восьмёрка", cast_forms: 4, defect: 1 },
    ],
    workers: [
      { tab: "W-LIT-02", ops: [{ code: "007", op: "литьё", qty: 300 }] },
      { tab: "W-LIT-06", ops: [{ code: "1027", op: "литьё", qty: 80 }] },
    ],
  },
  {
    daysBack: 3,
    type: "день",
    workshop: "LIT",
    foremanTab: "F-LIT",
    outputs: [
      { code: "112/н", qty: 70, machine: "Четвёрка", cast_forms: 4, defect: 2 },
      { code: "022/1", qty: 200, machine: "Шестёрка", cast_forms: 6, defect: 4 },
      { code: "905", qty: 100, machine: "KCLKA 2", cast_forms: 4, defect: 0 },
    ],
    workers: [
      { tab: "W-LIT-05", ops: [{ code: "112/н", op: "литьё", qty: 70 }] },
      { tab: "W-LIT-01", ops: [{ code: "022/1", op: "литьё", qty: 200 }] },
      { tab: "W-LIT-03", ops: [{ code: "905", op: "литьё", qty: 100 }] },
    ],
  },

  // ============ Упаковка ============
  {
    daysBack: 12,
    type: "день",
    workshop: "PACK",
    foremanTab: "F-PACK",
    outputs: [
      { code: "022/1", qty: 180, defect: 1 },
      { code: "007", qty: 240, defect: 2 },
    ],
    workers: [
      { tab: "W-PACK-01", ops: [{ code: "022/1", op: "обрезка", qty: 180 }] },
      { tab: "W-PACK-02", ops: [{ code: "007", op: "обрезка", qty: 240 }] },
      { tab: "W-PACK-03", ops: [{ code: "007", op: "упаковка без носка", qty: 240 }] },
      { tab: "W-PACK-04", ops: [{ code: "022/1", op: "упаковка без носка", qty: 180 }] },
    ],
  },
  {
    daysBack: 8,
    type: "день",
    workshop: "PACK",
    foremanTab: "F-PACK",
    outputs: [
      { code: "112/н", qty: 80, defect: 0 },
      { code: "184/н", qty: 60, defect: 0 },
    ],
    workers: [
      { tab: "W-PACK-01", ops: [{ code: "112/н", op: "обрезка", qty: 80 }, { code: "184/н", op: "обрезка", qty: 60 }] },
      { tab: "W-PACK-05", ops: [{ code: "112/н", op: "упаковка с носком", qty: 80 }] },
      { tab: "W-PACK-06", ops: [{ code: "184/н", op: "упаковка с носком", qty: 60 }] },
    ],
  },
  {
    daysBack: 5,
    type: "день",
    workshop: "PACK",
    foremanTab: "F-PACK",
    outputs: [
      { code: "022/1", qty: 150, defect: 1 },
      { code: "907", qty: 100, defect: 2 },
    ],
    workers: [
      { tab: "W-PACK-01", ops: [{ code: "022/1", op: "обрезка", qty: 150 }] },
      { tab: "W-PACK-02", ops: [{ code: "907", op: "обрезка", qty: 100 }] },
    ],
  },

  // ============ Клеевой ============
  {
    daysBack: 7,
    type: "день",
    workshop: "GLU",
    foremanTab: "F-GLU",
    outputs: [
      { code: "112/н", qty: 80, defect: 0 },
      { code: "184/н", qty: 60, defect: 1 },
    ],
    workers: [
      { tab: "W-GLU-01", ops: [{ code: "112/н", op: "клеёжка", qty: 80 }] },
      { tab: "W-GLU-02", ops: [{ code: "184/н", op: "клеёжка", qty: 60 }] },
      { tab: "W-GLU-03", ops: [{ code: null, op: "вставка", qty: 140 }] },
    ],
  },

  // ============ Обшив ============
  {
    daysBack: 4,
    type: "день",
    workshop: "ASSY",
    foremanTab: "F-ASSY",
    outputs: [
      { code: "112/н", qty: 70, defect: 0 },
      { code: "184/н", qty: 50, defect: 0 },
    ],
    workers: [
      { tab: "W-ASSY-01", ops: [{ code: "112/н", op: "обшив", qty: 70 }, { code: "184/н", op: "обшив", qty: 50 }] },
    ],
  },

  // ============ Маркировка ============
  {
    daysBack: 2,
    type: "день",
    workshop: "MARK",
    foremanTab: "F-MARK",
    outputs: [
      { code: "022/1", qty: 180, defect: 0 },
      { code: "007", qty: 240, defect: 0 },
      { code: "905", qty: 120, defect: 0 },
    ],
    workers: [
      { tab: "W-MARK-01", ops: [{ code: "022/1", op: "маркировка", qty: 180 }] },
      { tab: "W-MARK-02", ops: [{ code: "007", op: "маркировка", qty: 240 }] },
      { tab: "W-MARK-03", ops: [{ code: "905", op: "маркировка", qty: 120 }] },
    ],
  },
];

// pickRate как в payroll.ts
function pickRate(rates, articleId, operation) {
  const cand = [];
  for (const r of rates) {
    let score = 0;
    if (r.article_id && r.article_id === articleId) score += 10;
    else if (!r.article_id) score += 1;
    else continue;
    if (operation && r.operation && r.operation === operation) score += 5;
    else if (!r.operation) score += 0;
    else continue;
    cand.push({ r, score });
  }
  cand.sort((a, b) => b.score - a.score);
  return cand[0]?.r ?? null;
}

async function main() {
  console.log("📋 Очистка старых демо-смен...");
  // Удаляем смены с тегом
  const { data: existing } = await s
    .from("shifts")
    .select("id")
    .eq("notes", DEMO_TAG);
  if (existing?.length) {
    await s.from("shifts").delete().eq("notes", DEMO_TAG);
    console.log(`   удалено: ${existing.length}`);
  }

  // Кэшируем справочники
  console.log("📚 Загрузка справочников...");
  const { data: ws } = await s.from("workshops").select("id, code");
  const wsMap = new Map(ws.map((w) => [w.code, w.id]));

  const { data: arts } = await s.from("articles").select("id, code").limit(2000);
  const artMap = new Map(arts.map((a) => [a.code, a.id]));

  const { data: emps } = await s
    .from("employees")
    .select("id, tab_number, workshop_id")
    .limit(2000);
  const empMap = new Map(emps.map((e) => [e.tab_number, e]));

  let totalShifts = 0;
  let totalOutputs = 0;
  let totalWorkers = 0;
  let totalPay = 0;

  for (const plan of PLAN) {
    const wsId = wsMap.get(plan.workshop);
    const foreman = empMap.get(plan.foremanTab);
    if (!wsId || !foreman) {
      console.warn(`⚠ Пропускаю: цех ${plan.workshop} или бригадир ${plan.foremanTab} не найден`);
      continue;
    }
    const shiftDate = daysAgo(plan.daysBack);

    // 1. Открываем смену
    const { data: shift, error: e1 } = await s
      .from("shifts")
      .insert({
        workshop_id: wsId,
        foreman_id: foreman.id,
        shift_date: shiftDate,
        shift_type: plan.type,
        status: "open",
        notes: DEMO_TAG,
      })
      .select("id")
      .single();
    if (e1) throw e1;
    totalShifts++;

    // 2. Записи выработки
    const outputs = [];
    for (const o of plan.outputs) {
      const artId = artMap.get(o.code);
      if (!artId) {
        console.warn(`  ⚠ артикул ${o.code} не найден`);
        continue;
      }
      const { data: art } = await s
        .from("articles")
        .select("weight_per_pair")
        .eq("id", artId)
        .single();
      const weight = art?.weight_per_pair ? Number(art.weight_per_pair) * o.qty : null;
      outputs.push({
        shift_id: shift.id,
        article_id: artId,
        quantity: o.qty,
        weight,
        defect_qty: o.defect || 0,
        machine: o.machine || null,
        cast_forms: o.cast_forms || null,
        downtime_min: 0,
      });
    }
    if (outputs.length) {
      await s.from("shift_outputs").insert(outputs);
      totalOutputs += outputs.length;
    }

    // 3. Расценки этого цеха
    const { data: rates } = await s
      .from("rates")
      .select("*")
      .eq("workshop_id", wsId)
      .lte("valid_from", shiftDate);

    // 4. Работники с операциями + расчёт ЗП
    for (const w of plan.workers) {
      const emp = empMap.get(w.tab);
      if (!emp) {
        console.warn(`  ⚠ работник ${w.tab} не найден`);
        continue;
      }
      const operations = w.ops.map((op) => ({
        article_id: op.code ? artMap.get(op.code) ?? null : null,
        operation: op.op,
        qty: op.qty,
      }));
      const qtyDone = operations.reduce((a, o) => a + o.qty, 0);
      let pay = 0;
      for (const op of operations) {
        const r = pickRate(rates, op.article_id, op.operation);
        if (r) pay += op.qty * Number(r.rate_per_unit);
      }
      await s.from("shift_workers").insert({
        shift_id: shift.id,
        employee_id: emp.id,
        operations,
        qty_done: qtyDone,
        calculated_pay: pay,
      });
      totalWorkers++;
      totalPay += pay;
    }

    // 5. Закрываем смену
    const closedAt = new Date();
    closedAt.setDate(closedAt.getDate() - plan.daysBack);
    closedAt.setHours(plan.type === "ночь" ? 7 : 19, 0, 0);
    await s
      .from("shifts")
      .update({ status: "closed", closed_at: closedAt.toISOString() })
      .eq("id", shift.id);

    console.log(
      `✓ ${shiftDate} ${plan.type.padEnd(5)} ${plan.workshop.padEnd(4)} · ${outputs.length} вырб · ${plan.workers.length} раб · ${Math.round(plan.workers.reduce((s, w) => s + w.ops.reduce((s2, o) => s2 + o.qty, 0), 0))} пар`,
    );
  }

  console.log("\n📊 Итого:");
  console.log(`   Смен: ${totalShifts}`);
  console.log(`   Записей выработки: ${totalOutputs}`);
  console.log(`   Записей работников: ${totalWorkers}`);
  console.log(`   Расчётный ФОТ: ${totalPay.toFixed(2)} ₽`);
}

main().catch((e) => {
  console.error("✗", e.message);
  if (e.details) console.error("  details:", e.details);
  process.exit(1);
});
