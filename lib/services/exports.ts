// XLSX-выгрузки для 1С Бухгалтерии. Формат согласовать с бухгалтером —
// здесь стартовый шаблон.

import * as XLSX from "xlsx";
import type {
  MaterialUsage,
  PayrollEntry,
  ProductionEntry,
} from "./reports";

function workbookToBuffer(wb: XLSX.WorkBook): Buffer {
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

export function buildPayrollXlsx(args: {
  period: string;
  start: string;
  end: string;
  entries: PayrollEntry[];
}): Buffer {
  const header = [
    "Таб.№",
    "ФИО",
    "Цех (код)",
    "Цех",
    "Период",
    "Смен",
    "Сумма, ₽",
  ];
  const rows = args.entries.map((e) => [
    e.tabNumber,
    e.fullName,
    e.workshopCode,
    e.workshopName,
    args.period,
    e.shifts,
    Number(e.amount.toFixed(2)),
  ]);
  const total = args.entries.reduce((s, e) => s + e.amount, 0);
  rows.push(["", "ИТОГО", "", "", args.period, "", Number(total.toFixed(2))]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws["!cols"] = [
    { wch: 10 },
    { wch: 30 },
    { wch: 8 },
    { wch: 20 },
    { wch: 10 },
    { wch: 6 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, `Ведомость ${args.period}`);

  // Детализация — отдельным листом
  const detailHeader = ["Таб.№", "ФИО", "Цех", "Дата смены", "Смена", "Сумма, ₽"];
  const detailRows: (string | number)[][] = [];
  for (const e of args.entries) {
    for (const b of e.breakdown) {
      detailRows.push([
        e.tabNumber,
        e.fullName,
        b.workshopCode,
        b.shiftDate,
        b.shiftType,
        Number(b.amount.toFixed(2)),
      ]);
    }
  }
  const ws2 = XLSX.utils.aoa_to_sheet([detailHeader, ...detailRows]);
  ws2["!cols"] = [
    { wch: 10 },
    { wch: 30 },
    { wch: 8 },
    { wch: 12 },
    { wch: 8 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "Детализация");
  return workbookToBuffer(wb);
}

export function buildProductionXlsx(args: {
  start: string;
  end: string;
  entries: ProductionEntry[];
}): Buffer {
  const header = [
    "Код",
    "Наименование",
    "Материал",
    "Пар",
    "Вес, кг",
    "Брак, пар",
    "Сумма выпуска, ₽",
  ];
  const rows = args.entries.map((e) => [
    e.code,
    e.name,
    e.material,
    e.pairs,
    Number(e.weightKg.toFixed(2)),
    e.defect,
    Number(e.valueRub.toFixed(2)),
  ]);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    [`Выпуск продукции с ${args.start} по ${args.end}`],
    [],
    header,
    ...rows,
  ]);
  ws["!cols"] = [
    { wch: 14 },
    { wch: 32 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, "Выпуск");
  return workbookToBuffer(wb);
}

export function buildMaterialsXlsx(args: {
  start: string;
  end: string;
  entries: MaterialUsage[];
}): Buffer {
  const header = ["Код", "Наименование", "Ед.", "Использовано"];
  const rows = args.entries.map((e) => [
    e.code,
    e.name,
    e.unit,
    Number(e.qtyUsed.toFixed(3)),
  ]);
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    [`Расход сырья с ${args.start} по ${args.end}`],
    [],
    header,
    ...rows,
  ]);
  ws["!cols"] = [{ wch: 14 }, { wch: 36 }, { wch: 6 }, { wch: 14 }];
  XLSX.utils.book_append_sheet(wb, ws, "Расход");
  return workbookToBuffer(wb);
}
