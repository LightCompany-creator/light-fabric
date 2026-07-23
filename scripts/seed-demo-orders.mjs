// Заводит 3 демо-заказа на разных стадиях жизненного цикла — чтобы на
// демонстрации сразу было видно весь функционал заказов на производство,
// не создавая ничего руками.
//
// Идемпотентен: проверяет по тегу в comment, пропускает уже созданные
// примеры (не удаляет и не дублирует). Если нужно пересоздать — удалить
// заказ руками в интерфейсе (админом) и перезапустить скрипт.
//
// Запуск: node --env-file=.env.local scripts/seed-demo-orders.mjs

import { createClient } from "@supabase/supabase-js";

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

function daysFromNow(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}
const iso = (d) => d.toISOString().slice(0, 10);
const isoDateTime = (d) => d.toISOString();

async function orderExists(tag) {
  const { data } = await s
    .from("production_orders")
    .select("id")
    .eq("comment", tag)
    .maybeSingle();
  return data?.id ?? null;
}

async function main() {
  console.log("📚 Загрузка справочников...");
  const { data: workshops } = await s.from("workshops").select("id, code");
  const wsMap = new Map(workshops.map((w) => [w.code, w.id]));

  const { data: articles } = await s
    .from("articles")
    .select("id, code")
    .in("code", ["022/1", "007", "112/н"]);
  const artMap = new Map(articles.map((a) => [a.code, a.id]));

  const { data: cdRows } = await s
    .from("employees")
    .select("id")
    .eq("role", "commercial_director")
    .limit(1);
  const { data: pmRows } = await s
    .from("employees")
    .select("id")
    .eq("role", "production_manager")
    .limit(1);
  const { data: foremenRows } = await s
    .from("employees")
    .select("id, tab_number")
    .in("tab_number", ["F-LIT", "F-CUT", "F-MARK", "F-SEW"]);

  const commercialId = cdRows?.[0]?.id;
  const pmId = pmRows?.[0]?.id;
  const foremen = new Map(foremenRows.map((f) => [f.tab_number, f.id]));

  if (!commercialId || !pmId) {
    console.error("✗ Не найдены employees с ролью commercial_director/production_manager — запусти scripts/seed-users.mjs");
    process.exit(1);
  }
  for (const tab of ["F-LIT", "F-CUT", "F-MARK", "F-SEW"]) {
    if (!foremen.get(tab)) {
      console.error(`✗ Не найден начальник цеха ${tab} — запусти scripts/seed-workshop-foremen.mjs`);
      process.exit(1);
    }
  }

  // =====================================================
  // Пример 1 — черновик, ждёт приёма начальником производства
  // =====================================================
  const TAG_1 = "[demo-example] 1. Черновик — ждёт приёма начальником производства";
  if (await orderExists(TAG_1)) {
    console.log("↺ Пример 1 уже существует, пропускаю");
  } else {
    const { data: order1, error: e1 } = await s
      .from("production_orders")
      .insert({
        comment: TAG_1,
        status: "draft",
        order_date: iso(daysFromNow(0)),
        due_date: iso(daysFromNow(12)),
        created_by: commercialId,
      })
      .select("id, doc_number")
      .single();
    if (e1) throw e1;
    await s.from("production_order_lines").insert([
      { order_id: order1.id, article_id: artMap.get("022/1"), qty: 400 },
      { order_id: order1.id, article_id: artMap.get("007"), qty: 200 },
    ]);
    console.log(`✓ Пример 1: заказ ${order1.doc_number} (draft, без подзаказов)`);
  }

  // =====================================================
  // Пример 2 — в работе, три подзаказа на разных стадиях
  // =====================================================
  const TAG_2 = "[demo-example] 2. В работе — подзаказы на разных стадиях";
  if (await orderExists(TAG_2)) {
    console.log("↺ Пример 2 уже существует, пропускаю");
  } else {
    const { data: order2, error: e2 } = await s
      .from("production_orders")
      .insert({
        comment: TAG_2,
        status: "in_progress",
        order_date: iso(daysFromNow(-2)),
        due_date: iso(daysFromNow(8)),
        created_by: commercialId,
        accepted_by: pmId,
        accepted_at: isoDateTime(daysFromNow(-2)),
      })
      .select("id, doc_number")
      .single();
    if (e2) throw e2;
    await s.from("production_order_lines").insert([
      { order_id: order2.id, article_id: artMap.get("022/1"), qty: 300 },
      { order_id: order2.id, article_id: artMap.get("112/н"), qty: 200 },
      { order_id: order2.id, article_id: artMap.get("007"), qty: 200 },
    ]);

    // 2а. Литейка — свежий, ещё не принят (у начальника цеха загорится бейдж)
    const { data: subLit } = await s
      .from("production_suborders")
      .insert({
        order_id: order2.id,
        workshop_id: wsMap.get("LIT"),
        status: "assigned",
        due_date: iso(daysFromNow(7)),
      })
      .select("id, doc_number")
      .single();
    await s.from("production_suborder_lines").insert({
      suborder_id: subLit.id,
      article_id: artMap.get("022/1"),
      qty: 300,
    });
    console.log(`  · подзаказ ${subLit.doc_number} · Литейка · assigned`);

    // 2б. Крой — попросил корректировку срока
    const { data: subCut } = await s
      .from("production_suborders")
      .insert({
        order_id: order2.id,
        workshop_id: wsMap.get("CUT"),
        status: "correction_requested",
        due_date: iso(daysFromNow(3)),
        correction_comment: "Не успеваем к сроку — очередь на рубку с другого заказа, нужно +3 дня",
      })
      .select("id, doc_number")
      .single();
    await s.from("production_suborder_lines").insert({
      suborder_id: subCut.id,
      article_id: artMap.get("112/н"),
      qty: 200,
    });
    console.log(`  · подзаказ ${subCut.doc_number} · Крой · correction_requested`);

    // 2в. Маркировка — принят, частично выполнен, цех уже подтвердил
    //     (у начальника производства загорится бейдж «ждёт проверки»)
    const { data: subMark } = await s
      .from("production_suborders")
      .insert({
        order_id: order2.id,
        workshop_id: wsMap.get("MARK"),
        status: "in_progress",
        due_date: iso(daysFromNow(3)),
        accepted_by: foremen.get("F-MARK"),
        accepted_at: isoDateTime(daysFromNow(-2)),
        workshop_confirmed_by: foremen.get("F-MARK"),
        workshop_confirmed_at: isoDateTime(daysFromNow(0)),
      })
      .select("id, doc_number")
      .single();
    await s.from("production_suborder_lines").insert({
      suborder_id: subMark.id,
      article_id: artMap.get("007"),
      qty: 200,
    });
    const { data: shiftMark } = await s
      .from("shifts")
      .insert({
        workshop_id: wsMap.get("MARK"),
        foreman_id: foremen.get("F-MARK"),
        shift_date: iso(daysFromNow(-1)),
        shift_type: "день",
        status: "closed",
        closed_at: isoDateTime(daysFromNow(-1)),
        suborder_id: subMark.id,
      })
      .select("id")
      .single();
    await s.from("shift_outputs").insert({
      shift_id: shiftMark.id,
      article_id: artMap.get("007"),
      quantity: 180,
      defect_qty: 5,
    });
    console.log(`  · подзаказ ${subMark.doc_number} · Маркировка · in_progress, факт 175/200, цех подтвердил`);
    console.log(`✓ Пример 2: заказ ${order2.doc_number} (in_progress, 3 подзаказа)`);
  }

  // =====================================================
  // Пример 3 — полностью закрыт (можно потренироваться переоткрывать)
  // =====================================================
  const TAG_3 = "[demo-example] 3. Полностью закрыт — весь цикл выполнен";
  if (await orderExists(TAG_3)) {
    console.log("↺ Пример 3 уже существует, пропускаю");
  } else {
    const { data: order3, error: e3 } = await s
      .from("production_orders")
      .insert({
        comment: TAG_3,
        status: "closed",
        order_date: iso(daysFromNow(-8)),
        due_date: iso(daysFromNow(-3)),
        created_by: pmId, // сам начальник производства, без приёма
        closed_by: pmId,
        closed_at: isoDateTime(daysFromNow(-1)),
      })
      .select("id, doc_number")
      .single();
    if (e3) throw e3;
    await s.from("production_order_lines").insert({
      order_id: order3.id,
      article_id: artMap.get("112/н"),
      qty: 150,
    });

    const { data: subSew } = await s
      .from("production_suborders")
      .insert({
        order_id: order3.id,
        workshop_id: wsMap.get("SEW"),
        status: "closed",
        due_date: iso(daysFromNow(-4)),
        accepted_by: foremen.get("F-SEW"),
        accepted_at: isoDateTime(daysFromNow(-7)),
        workshop_confirmed_by: foremen.get("F-SEW"),
        workshop_confirmed_at: isoDateTime(daysFromNow(-2)),
        production_confirmed_by: pmId,
        production_confirmed_at: isoDateTime(daysFromNow(-1)),
      })
      .select("id, doc_number")
      .single();
    await s.from("production_suborder_lines").insert({
      suborder_id: subSew.id,
      article_id: artMap.get("112/н"),
      qty: 150,
    });
    const { data: shiftSew } = await s
      .from("shifts")
      .insert({
        workshop_id: wsMap.get("SEW"),
        foreman_id: foremen.get("F-SEW"),
        shift_date: iso(daysFromNow(-3)),
        shift_type: "день",
        status: "closed",
        closed_at: isoDateTime(daysFromNow(-3)),
        suborder_id: subSew.id,
      })
      .select("id")
      .single();
    await s.from("shift_outputs").insert({
      shift_id: shiftSew.id,
      article_id: artMap.get("112/н"),
      quantity: 153,
      defect_qty: 3,
    });
    console.log(`✓ Пример 3: заказ ${order3.doc_number} (closed, подзаказ ${subSew.doc_number} тоже closed)`);
  }

  console.log("\nГотово. Проверить: /orders (production@lightflow.test или commercial@lightflow.test)");
}

main().catch((e) => {
  console.error("✗", e.message);
  if (e.details) console.error("  details:", e.details);
  process.exit(1);
});
