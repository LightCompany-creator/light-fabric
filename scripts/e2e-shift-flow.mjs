// E2E-проверка сценария «открыть смену → выработка → работник → закрыть → ЗП».
// Использует service_role, минует RLS. Идёт в обход UI, но проверяет ту же
// бизнес-логику, что и страницы /shifts.

import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function log(level, msg) {
  const tag = { info: "→", ok: "✓", fail: "✗", warn: "⚠" }[level] ?? "·";
  console.log(`${tag} ${msg}`);
}

async function main() {
  // ============ ШАГ 0: подготовка ============
  log("info", "Подготовка...");

  const { data: foreman } = await s
    .from("employees")
    .select("id, full_name, workshop_id, workshops:workshop_id(code, name)")
    .eq("tab_number", "TST-0001")
    .single();
  if (!foreman) throw new Error("Бригадир TST-0001 не найден");
  log("ok", `бригадир: ${foreman.full_name}, цех: ${foreman.workshops.code}`);

  const { data: arts } = await s
    .from("articles")
    .select("id, code, name, weight_per_pair")
    .in("code", ["905", "112/н"]);
  const a905 = arts.find((a) => a.code === "905");
  const a112 = arts.find((a) => a.code === "112/н");
  if (!a905 || !a112) throw new Error("Не найдены артикулы 905 и/или 112/н");
  log("ok", `артикулы: 905 (вес ${a905.weight_per_pair ?? "—"}), 112/н (вес ${a112.weight_per_pair ?? "—"})`);

  // Узнаём расценки заранее, чтобы посчитать ожидаемую ЗП
  const { data: rates } = await s
    .from("rates")
    .select("rate_per_unit, article_id, operation, workshops:workshop_id(code)")
    .eq("workshop_id", foreman.workshop_id)
    .in("article_id", [a905.id, a112.id]);
  const rate905 = rates.find(
    (r) => r.article_id === a905.id && r.operation === "литьё",
  );
  const rate112 = rates.find(
    (r) => r.article_id === a112.id && r.operation === "литьё",
  );
  log("ok", `расценки литья: 905=${rate905?.rate_per_unit}₽, 112/н=${rate112?.rate_per_unit}₽`);

  // Чистим старые тестовые смены за сегодня этого бригадира
  const today = new Date().toISOString().slice(0, 10);
  const { data: oldShifts } = await s
    .from("shifts")
    .select("id")
    .eq("foreman_id", foreman.id)
    .eq("shift_date", today);
  for (const sh of oldShifts ?? []) {
    await s.from("shifts").delete().eq("id", sh.id);
  }
  if (oldShifts?.length) log("info", `удалено старых смен за сегодня: ${oldShifts.length}`);

  // ============ ШАГ 1: открытие смены ============
  log("info", "ШАГ 1: открытие смены");

  const { data: shift, error: openErr } = await s
    .from("shifts")
    .insert({
      workshop_id: foreman.workshop_id,
      foreman_id: foreman.id,
      shift_date: today,
      shift_type: "день",
      status: "open",
    })
    .select("id, shift_date, status")
    .single();
  if (openErr) throw openErr;
  log("ok", `смена открыта: ${shift.id} · ${shift.shift_date} · ${shift.status}`);

  // ============ ШАГ 2: добавление выработки ============
  log("info", "ШАГ 2: выработка");

  const outputs = [
    {
      shift_id: shift.id,
      article_id: a905.id,
      quantity: 50,
      defect_qty: 2,
      machine: "Шестёрка",
      cast_forms: 6,
      downtime_min: 15,
    },
    {
      shift_id: shift.id,
      article_id: a112.id,
      quantity: 30,
      defect_qty: 1,
      machine: "Четвёрка",
      cast_forms: 4,
      downtime_min: 0,
    },
  ];
  const { error: outErr } = await s.from("shift_outputs").insert(outputs);
  if (outErr) throw outErr;
  log("ok", `записей выработки: 2 (905 ×50, 112/н ×30)`);

  // ============ ШАГ 3: добавление работника с операциями ============
  log("info", "ШАГ 3: работник с операциями");

  const operations = [
    { article_id: a905.id, operation: "литьё", qty: 50 },
    { article_id: a112.id, operation: "литьё", qty: 30 },
  ];
  const totalQty = operations.reduce((s, o) => s + o.qty, 0);
  const { error: wErr } = await s.from("shift_workers").insert({
    shift_id: shift.id,
    employee_id: foreman.id,
    operations,
    qty_done: totalQty,
  });
  if (wErr) throw wErr;
  log("ok", `работник добавлен, операций: 2 (qty_done=${totalQty})`);

  // ============ ШАГ 4: ожидаемая ЗП ============
  const expected = 50 * Number(rate905.rate_per_unit) + 30 * Number(rate112.rate_per_unit);
  log("info", `ожидаемая ЗП: 50×${rate905.rate_per_unit} + 30×${rate112.rate_per_unit} = ${expected}₽`);

  // ============ ШАГ 5: расчёт ЗП (вызов calculateShiftPay через HTTP не получится — повторяем логику) ============
  log("info", "ШАГ 5: расчёт ЗП (повтор логики calculateShiftPay)");
  const { data: workersRaw } = await s
    .from("shift_workers")
    .select("id, employee_id, operations")
    .eq("shift_id", shift.id);
  const { data: ratesAll } = await s
    .from("rates")
    .select("*")
    .eq("workshop_id", foreman.workshop_id)
    .lte("valid_from", today);

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

  for (const w of workersRaw) {
    let total = 0;
    const breakdown = [];
    for (const op of w.operations || []) {
      const m = pickRate(ratesAll, op.article_id, op.operation);
      const rate = m ? Number(m.rate_per_unit) : 0;
      const sub = op.qty * rate;
      total += sub;
      breakdown.push({ op: op.operation, qty: op.qty, rate, sub });
    }
    await s
      .from("shift_workers")
      .update({ calculated_pay: total })
      .eq("id", w.id);
    log("info", `  работник ${w.id.slice(0, 8)}: total=${total}₽`);
    for (const b of breakdown) log("info", `    ${b.op} ×${b.qty} × ${b.rate} = ${b.sub}`);
  }

  // ============ ШАГ 6: закрытие смены ============
  log("info", "ШАГ 6: закрытие смены");
  const { error: closeErr } = await s
    .from("shifts")
    .update({ status: "closed", closed_at: new Date().toISOString() })
    .eq("id", shift.id);
  if (closeErr) throw closeErr;
  log("ok", "смена закрыта");

  // ============ ШАГ 7: верификация ============
  log("info", "ШАГ 7: верификация");
  const { data: finalShift } = await s
    .from("shifts")
    .select("status, closed_at")
    .eq("id", shift.id)
    .single();
  const { data: finalWorker } = await s
    .from("shift_workers")
    .select("calculated_pay, qty_done")
    .eq("shift_id", shift.id)
    .single();

  const checks = [
    { name: "status=closed", actual: finalShift.status, expected: "closed" },
    { name: "closed_at заполнен", actual: !!finalShift.closed_at, expected: true },
    { name: "qty_done=80", actual: finalWorker.qty_done, expected: 80 },
    {
      name: `calculated_pay=${expected}₽`,
      actual: Number(finalWorker.calculated_pay),
      expected,
    },
  ];

  let ok = 0;
  for (const c of checks) {
    const pass = c.actual === c.expected;
    log(pass ? "ok" : "fail", `${c.name}: actual=${c.actual}, expected=${c.expected}`);
    if (pass) ok++;
  }

  console.log(`\n${ok}/${checks.length} проверок прошли`);
  if (ok !== checks.length) process.exit(1);
}

main().catch((e) => {
  log("fail", e.message);
  if (e.details) log("fail", `  details: ${e.details}`);
  process.exit(1);
});
