// Расчёт сделки за смену.
// Для каждого работника проходим по списку операций (`shift_workers.operations`),
// находим действующую расценку и считаем `qty × rate_per_unit`.

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Tables } from "@/lib/supabase/types";

export type WorkerOperation = {
  article_id: string | null;
  operation: string | null;
  qty: number;
};

export type PayBreakdown = {
  articleId: string | null;
  operation: string | null;
  qty: number;
  rate: number | null;
  unitType: string | null;
  subtotal: number;
  warning?: string;
};

export type WorkerPay = {
  workerId: string;
  employeeId: string;
  totalPay: number;
  breakdown: PayBreakdown[];
};

type RateRow = Tables<"rates">;

function normalizeOperation(value: string | null | undefined): string | null {
  const normalized = value?.trim().toLowerCase().replace(/\u0451/g, "\u0435");
  return normalized ? normalized : null;
}

/**
 * Подбирает наиболее специфичную действующую расценку под операцию работника.
 * Порядок специфичности (по убыванию):
 *  1) article + operation совпали;
 *  2) article совпал, operation в расценке = null;
 *  3) расценка без article (общецеховая) с совпадающей operation;
 *  4) расценка без article и без operation (общая ставка цеха).
 */
function pickRate(
  rates: RateRow[],
  articleId: string | null,
  operation: string | null,
): RateRow | null {
  const candidates: { rate: RateRow; score: number }[] = [];
  const normalizedOperation = normalizeOperation(operation);
  for (const r of rates) {
    const normalizedRateOperation = normalizeOperation(r.operation);
    let score = 0;
    if (r.article_id && r.article_id === articleId) score += 10;
    else if (!r.article_id) score += 1;
    else continue;

    if (
      normalizedOperation &&
      normalizedRateOperation &&
      normalizedRateOperation === normalizedOperation
    )
      score += 5;
    else if (!r.operation) score += 0;
    else continue;

    candidates.push({ rate: r, score });
  }
  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.rate ?? null;
}

/**
 * Считает сделку для всех работников смены и сохраняет в `shift_workers.calculated_pay`.
 * Возвращает разбивку для аудита и отображения в UI.
 */
export async function calculateShiftPay(
  client: SupabaseClient<Database>,
  shiftId: string,
): Promise<WorkerPay[]> {
  // 1. Смена
  const { data: shiftRaw, error: shiftErr } = await client
    .from("shifts")
    .select("id, workshop_id, shift_date")
    .eq("id", shiftId)
    .maybeSingle();
  if (shiftErr) throw shiftErr;
  const shift = shiftRaw as Pick<
    Tables<"shifts">,
    "id" | "workshop_id" | "shift_date"
  > | null;
  if (!shift) throw new Error("Смена не найдена");

  // 2. Работники смены
  const { data: workersRaw, error: wErr } = await client
    .from("shift_workers")
    .select("id, employee_id, operations")
    .eq("shift_id", shiftId);
  if (wErr) throw wErr;
  const workers = (workersRaw ?? []) as Pick<
    Tables<"shift_workers">,
    "id" | "employee_id" | "operations"
  >[];

  // 3. Все расценки цеха, действующие на дату смены
  const { data: ratesRaw, error: rErr } = await client
    .from("rates")
    .select("*")
    .eq("workshop_id", shift.workshop_id)
    .lte("valid_from", shift.shift_date)
    .or(`valid_to.is.null,valid_to.gte.${shift.shift_date}`);
  if (rErr) throw rErr;
  const rates = (ratesRaw ?? []) as RateRow[];

  // 4. Подсчёт по каждому работнику
  const results: WorkerPay[] = [];
  for (const w of workers) {
    const operations: WorkerOperation[] = Array.isArray(w.operations)
      ? (w.operations as unknown as WorkerOperation[])
      : [];

    let total = 0;
    const breakdown: PayBreakdown[] = [];

    for (const op of operations) {
      const qty = Number(op.qty ?? 0);
      if (!qty) continue;

      const matched = pickRate(rates, op.article_id ?? null, op.operation ?? null);
      if (!matched) {
        breakdown.push({
          articleId: op.article_id ?? null,
          operation: op.operation ?? null,
          qty,
          rate: null,
          unitType: null,
          subtotal: 0,
          warning: "Расценка не найдена",
        });
        continue;
      }

      const rate = Number(matched.rate_per_unit);
      const subtotal = qty * rate;
      total += subtotal;
      breakdown.push({
        articleId: op.article_id ?? null,
        operation: op.operation ?? null,
        qty,
        rate,
        unitType: matched.unit_type,
        subtotal,
      });
    }

    // Сохраняем сумму на работника и явно ловим случаи, когда RLS не дала обновить строку.
    const { data: updatedWorker, error: updateErr } = await client
      .from("shift_workers")
      .update({ calculated_pay: total } as never)
      .eq("id", w.id)
      .select("id")
      .maybeSingle();
    if (updateErr) throw updateErr;
    if (!updatedWorker) {
      throw new Error("Не удалось сохранить расчёт ЗП для работника смены");
    }

    results.push({
      workerId: w.id,
      employeeId: w.employee_id,
      totalPay: total,
      breakdown,
    });
  }

  return results;
}
