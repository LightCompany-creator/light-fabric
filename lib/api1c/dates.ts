// Даты для документов считаются по местному времени планшета, а не по UTC.
// Иначе ночная смена, открытая в час ночи по Кисловодску, попадёт во вчерашний день:
// toISOString() отдаёт дату по Гринвичу, а это минус три часа.

/** Дата в формате 2026-09-25 по местному времени. */
export function localDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Дата n дней назад, тоже по местному времени. */
export function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDate(d);
}

/** «28 октября» из даты вида 2026-10-28, по местному времени. */
export function formatDay(isoDate: string): string {
  const [y, m, day] = isoDate.slice(0, 10).split("-").map(Number);
  if (!y || !m || !day) return isoDate;
  return new Date(y, m - 1, day).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}
