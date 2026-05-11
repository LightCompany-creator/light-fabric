// Отчёты для бухгалтерии и директора. Период задаётся как [start, end] включительно.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/types";

export type PayrollEntry = {
  employeeId: string;
  tabNumber: string;
  fullName: string;
  workshopId: string;
  workshopCode: string;
  workshopName: string;
  amount: number;
  shifts: number;
  breakdown: PayrollBreakdownRow[];
};

export type PayrollBreakdownRow = {
  shiftDate: string;
  shiftType: "день" | "ночь";
  workshopCode: string;
  amount: number;
};

/**
 * Сводная ведомость по работникам за период. Идёт из shift_workers закрытых смен.
 */
export async function getPayrollByPeriod(
  client: SupabaseClient<Database>,
  start: string,
  end: string,
): Promise<PayrollEntry[]> {
  const { data, error } = await client
    .from("shift_workers")
    .select(
      "calculated_pay, employee:employees(id, tab_number, full_name), shift:shifts!inner(shift_date, shift_type, status, workshop:workshops(id, code, name))",
    )
    .gte("shift.shift_date", start)
    .lte("shift.shift_date", end)
    .eq("shift.status", "closed");
  if (error) throw error;

  type Row = {
    calculated_pay: number | null;
    employee: { id: string; tab_number: string; full_name: string } | null;
    shift: {
      shift_date: string;
      shift_type: "день" | "ночь";
      workshop: { id: string; code: string; name: string } | null;
    };
  };
  const rows = (data ?? []) as unknown as Row[];

  // Группируем по (employeeId, workshopId)
  const grouped = new Map<string, PayrollEntry>();
  for (const r of rows) {
    if (!r.employee || !r.shift.workshop) continue;
    const key = `${r.employee.id}::${r.shift.workshop.id}`;
    const cur =
      grouped.get(key) ?? {
        employeeId: r.employee.id,
        tabNumber: r.employee.tab_number,
        fullName: r.employee.full_name,
        workshopId: r.shift.workshop.id,
        workshopCode: r.shift.workshop.code,
        workshopName: r.shift.workshop.name,
        amount: 0,
        shifts: 0,
        breakdown: [] as PayrollBreakdownRow[],
      };
    const pay = Number(r.calculated_pay ?? 0);
    cur.amount += pay;
    cur.shifts += 1;
    cur.breakdown.push({
      shiftDate: r.shift.shift_date,
      shiftType: r.shift.shift_type,
      workshopCode: r.shift.workshop.code,
      amount: pay,
    });
    grouped.set(key, cur);
  }

  return Array.from(grouped.values()).sort((a, b) => {
    const ws = a.workshopCode.localeCompare(b.workshopCode);
    if (ws !== 0) return ws;
    return a.fullName.localeCompare(b.fullName);
  });
}

/**
 * Сохраняет ведомость в payroll_lines для последующей выгрузки в 1С.
 * period — строка вида "2026-05".
 */
export async function createPayrollLines(
  client: SupabaseClient<Database>,
  period: string,
  start: string,
  end: string,
): Promise<number> {
  const entries = await getPayrollByPeriod(client, start, end);

  let saved = 0;
  for (const e of entries) {
    const { error } = await client.from("payroll_lines").upsert(
      {
        period,
        employee_id: e.employeeId,
        workshop_id: e.workshopId,
        amount: e.amount,
        breakdown: e.breakdown as unknown as Tables<"payroll_lines">["breakdown"],
      } as never,
      { onConflict: "period,employee_id,workshop_id" },
    );
    if (!error) saved += 1;
  }
  return saved;
}

export type ProductionEntry = {
  articleId: string;
  code: string;
  name: string;
  material: string;
  pairs: number;
  weightKg: number;
  defect: number;
  valueRub: number;
};

export async function getProductionReport(
  client: SupabaseClient<Database>,
  start: string,
  end: string,
): Promise<ProductionEntry[]> {
  const { data, error } = await client
    .from("shift_outputs")
    .select(
      "quantity, weight, defect_qty, article:articles(id, code, name, material, wholesale_price), shift:shifts!inner(shift_date, status)",
    )
    .gte("shift.shift_date", start)
    .lte("shift.shift_date", end)
    .eq("shift.status", "closed");
  if (error) throw error;

  type Row = {
    quantity: number;
    weight: number | null;
    defect_qty: number | null;
    article: {
      id: string;
      code: string;
      name: string;
      material: string;
      wholesale_price: number | null;
    } | null;
  };
  const rows = (data ?? []) as unknown as Row[];

  const grouped = new Map<string, ProductionEntry>();
  for (const r of rows) {
    if (!r.article) continue;
    const cur =
      grouped.get(r.article.id) ?? {
        articleId: r.article.id,
        code: r.article.code,
        name: r.article.name,
        material: r.article.material,
        pairs: 0,
        weightKg: 0,
        defect: 0,
        valueRub: 0,
      };
    cur.pairs += r.quantity;
    cur.weightKg += Number(r.weight ?? 0);
    cur.defect += r.defect_qty ?? 0;
    cur.valueRub += r.quantity * Number(r.article.wholesale_price ?? 0);
    grouped.set(r.article.id, cur);
  }
  return Array.from(grouped.values()).sort((a, b) => b.pairs - a.pairs);
}

export type MaterialUsage = {
  materialId: string;
  code: string;
  name: string;
  unit: string;
  qtyUsed: number;
};

export async function getMaterialsReport(
  client: SupabaseClient<Database>,
  start: string,
  end: string,
): Promise<MaterialUsage[]> {
  const { data, error } = await client
    .from("material_consumption")
    .select(
      "qty_used, material:materials(id, code, name, unit), shift:shifts!inner(shift_date, status)",
    )
    .gte("shift.shift_date", start)
    .lte("shift.shift_date", end)
    .eq("shift.status", "closed");
  if (error) throw error;

  type Row = {
    qty_used: number;
    material: { id: string; code: string; name: string; unit: string } | null;
  };
  const rows = (data ?? []) as unknown as Row[];

  const grouped = new Map<string, MaterialUsage>();
  for (const r of rows) {
    if (!r.material) continue;
    const cur =
      grouped.get(r.material.id) ?? {
        materialId: r.material.id,
        code: r.material.code,
        name: r.material.name,
        unit: r.material.unit,
        qtyUsed: 0,
      };
    cur.qtyUsed += Number(r.qty_used);
    grouped.set(r.material.id, cur);
  }
  return Array.from(grouped.values()).sort((a, b) => b.qtyUsed - a.qtyUsed);
}
