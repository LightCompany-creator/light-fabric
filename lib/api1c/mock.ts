// Заглушка 1С по разделу 6 контракта: данные в памяти, те же ответы и те же ошибки.
// Нужна, пока dev-база Арсена не опубликована: на ней разрабатываются все экраны.
//
// Демо-данные повторяют реальную цепочку фабрики: Литьё делает галоши, Швейка носки,
// Обшив шьёт из того и другого, Маркировка упаковывает. Покупное сырьё есть только
// в начале цепочки, дальше всё движется перемещениями между цехами.
//
// Специально воспроизводит и неприятные случаи: смену, которая закрылась, но не
// отразилась в учёте (нехватка остатка, закрытый период), конфликт версий, ошибки
// ввода списком, сброс подтверждений при правке перемещения. Поведение по контракту v0.2.

import type { Api1C } from "./api";
import { Api1CError, Api1COfflineError } from "./client";
import { daysAgo, localDate } from "./dates";
import type {
  CloseShiftResult,
  ConfirmSide,
  Employee1C,
  Id,
  Material1C,
  Me,
  NewTransfer,
  Page,
  Product1C,
  Shift,
  ShiftAccounting,
  ShiftHead,
  ShiftState,
  ShiftsQuery,
  StockLine,
  Transfer,
  TransferHead,
  TransfersQuery,
  ValidationDetail,
  WorkType,
  WorkshopContext,
  WorkshopRef,
} from "./types";

const uid = () => crypto.randomUUID();
const today = () => localDate();
const now = () => new Date().toISOString().slice(0, 19);
const round = (n: number) => Math.round(n * 1000) / 1000;

// ---------- справочники ----------

const WORKSHOPS: WorkshopRef[] = [
  { id: "w-lit", code: "00-000004", name: "Литьё", warehouse: { id: "s-lit", name: "Литейный ЦЕХ ЭВА" } },
  { id: "w-cut", code: "00-000005", name: "Крой", warehouse: { id: "s-cut", name: "Материалы для кроя" } },
  { id: "w-sew", code: "00-000006", name: "Швейка", warehouse: { id: "s-sew", name: "Швейное производство" } },
  { id: "w-assy", code: "00-000007", name: "Обшив", warehouse: { id: "s-assy", name: "Склад Обшив" } },
  { id: "w-glu", code: "00-000008", name: "Клеевая", warehouse: { id: "s-glu", name: "Склад Клеевая" } },
  { id: "w-mark", code: "00-000009", name: "Маркировка", warehouse: { id: "s-mark", name: "Склад Маркировка" } },
  { id: "w-ship", code: "00-000011", name: "Склад ГП", warehouse: { id: "s-ship", name: "Готовая продукция" } },
];

/** Единый справочник номенклатуры: и покупное сырьё, и полуфабрикаты, и готовое. */
const ITEMS: Record<Id, { code: string; name: string; unit: string }> = {
  "i-eva": { code: "00-00000501", name: "Пластикат ЭВА чёрный", unit: "кг" },
  "i-eva-2": { code: "00-00000503", name: "Пластикат ЭВА чёрный 2 сорт", unit: "кг" },
  "i-cloth": { code: "00-00000502", name: "Ткань подкладочная", unit: "м" },
  "i-galosh": { code: "00-00001001", name: "Галоша ЭВА 112", unit: "пар" },
  "i-galosh-137": { code: "00-00001004", name: "Галоша ЭВА 137 купальная", unit: "пар" },
  "i-sock": { code: "00-00001002", name: "Носок утеплённый 112", unit: "пар" },
  "i-boot": { code: "00-00001234", name: "Сапоги женские ЭВА с манжетой", unit: "пар" },
  "i-boot-packed": { code: "00-00001235", name: "Сапоги 112 упакованные", unit: "пар" },
  "i-blank": { code: "00-00001003", name: "Заготовка верха 112", unit: "пар" },
  "i-glued": { code: "00-00001236", name: "Кроксы 205 с лейблом", unit: "пар" },
};

const item = (id: Id) => ITEMS[id] ?? { code: "", name: id, unit: "" };

type WorkshopData = {
  employees: Employee1C[];
  work_types: WorkType[];
  products: Product1C[];
};

const idle = (code: string): WorkType => ({
  id: `wt-idle-${code}`,
  code: "ВР-099",
  name: "Простой",
  unit: "ч",
  requires_product: false,
});

const product = (
  itemId: Id,
  article: string,
  spec: { item_id: Id; qty_per_unit: number }[],
): Product1C => ({
  id: itemId,
  code: item(itemId).code,
  article,
  name: item(itemId).name,
  unit: item(itemId).unit,
  spec,
});

const CATALOG: Record<Id, WorkshopData> = {
  "w-lit": {
    employees: [
      { id: "e-lit-1", code: "0000056", name: "Работник Л-01", position: "Литейщик", default_work_type_id: "wt-cast6" },
      { id: "e-lit-2", code: "0000057", name: "Работник Л-02", position: "Литейщик", default_work_type_id: "wt-cast4" },
      { id: "e-lit-3", code: "0000058", name: "Работник Л-03", position: "Литейщик", default_work_type_id: null },
    ],
    work_types: [
      { id: "wt-cast6", code: "ВР-006", name: "Литьё 6-парка", unit: "пар", requires_product: true },
      { id: "wt-cast4", code: "ВР-004", name: "Литьё 4-парка", unit: "пар", requires_product: true },
      // Работа без продукции бывает не только простоем.
      { id: "wt-clean", code: "ВР-098", name: "Чистка форм", unit: "ч", requires_product: false },
      idle("lit"),
    ],
    // Две позиции, чтобы итог выпуска по нескольким продуктам было на чем проверять.
    products: [
      product("i-galosh", "112-г", [{ item_id: "i-eva", qty_per_unit: 0.42 }]),
      product("i-galosh-137", "137-г", [{ item_id: "i-eva", qty_per_unit: 0.18 }]),
    ],
  },
  "w-cut": {
    employees: [
      { id: "e-cut-1", code: "0000061", name: "Работник К-01", position: "Раскройщик", default_work_type_id: "wt-cut" },
      { id: "e-cut-2", code: "0000062", name: "Работник К-02", position: "Раскройщик", default_work_type_id: "wt-cut" },
    ],
    work_types: [
      { id: "wt-cut", code: "ВР-015", name: "Раскрой верха", unit: "пар", requires_product: true },
      idle("cut"),
    ],
    products: [product("i-blank", "112-з", [{ item_id: "i-cloth", qty_per_unit: 0.35 }])],
  },
  "w-sew": {
    employees: [
      { id: "e-sew-1", code: "0000071", name: "Работник Ш-01", position: "Швея", default_work_type_id: "wt-sew" },
      { id: "e-sew-2", code: "0000072", name: "Работник Ш-02", position: "Швея", default_work_type_id: "wt-sew" },
    ],
    work_types: [
      { id: "wt-sew", code: "ВР-020", name: "Пошив носка", unit: "пар", requires_product: true },
      idle("sew"),
    ],
    // Швейка шьёт из заготовок Кроя, а не из ткани напрямую.
    products: [product("i-sock", "112-н", [{ item_id: "i-blank", qty_per_unit: 1 }])],
  },
  "w-assy": {
    employees: [
      { id: "e-assy-1", code: "0000081", name: "Работник О-01", position: "Обшивщик", default_work_type_id: "wt-assy" },
      { id: "e-assy-2", code: "0000082", name: "Работник О-02", position: "Обшивщик", default_work_type_id: "wt-assy" },
    ],
    work_types: [
      { id: "wt-assy", code: "ВР-030", name: "Обшив сапога", unit: "пар", requires_product: true },
      idle("assy"),
    ],
    // Сырьё Обшива это продукция соседей: галоши из Литья и носки из Швейки.
    products: [
      product("i-boot", "112/н", [
        { item_id: "i-galosh", qty_per_unit: 1 },
        { item_id: "i-sock", qty_per_unit: 1 },
      ]),
    ],
  },
  "w-glu": {
    employees: [
      { id: "e-glu-1", code: "0000085", name: "Работник Г-01", position: "Клеевар", default_work_type_id: "wt-glue" },
    ],
    work_types: [
      { id: "wt-glue", code: "ВР-035", name: "Проклейка и лейбл", unit: "пар", requires_product: true },
      idle("glu"),
    ],
    // Клеевая получает полуфабрикат с Литья, клеит лейблы.
    products: [product("i-glued", "205-к", [{ item_id: "i-galosh", qty_per_unit: 1 }])],
  },
  "w-mark": {
    employees: [
      { id: "e-mark-1", code: "0000091", name: "Работник М-01", position: "Упаковщик", default_work_type_id: "wt-pack" },
    ],
    work_types: [
      { id: "wt-pack", code: "ВР-010", name: "Упаковка", unit: "пар", requires_product: true },
      idle("mark"),
    ],
    products: [product("i-boot-packed", "112/у", [{ item_id: "i-boot", qty_per_unit: 1 }])],
    // Упаковка принимает и сапоги от Обшива, и клеевую обувь: остатки обоих видов
    // лежат на её складе, поэтому попадут в материалы через остаток.
  },
  "w-ship": {
    employees: [
      { id: "e-ship-1", code: "0000101", name: "Работник С-01", position: "Кладовщик", default_work_type_id: null },
    ],
    work_types: [idle("ship")],
    products: [],
  },
};

/** Остатки складов цехов: покупное сырьё лежит только в начале цепочки. */
const stock: Record<Id, Record<Id, number>> = {
  // Второй сорт лежит на складе, но в спецификации его нет: чтобы было чем заменить.
  "w-lit": { "i-eva": 1250.5, "i-eva-2": 400, "i-galosh": 320 },
  "w-cut": { "i-cloth": 900, "i-blank": 180 },
  "w-sew": { "i-blank": 120, "i-sock": 210 },
  "w-assy": { "i-galosh": 40, "i-sock": 40 },
  "w-glu": { "i-galosh": 90, "i-glued": 55 },
  "w-mark": { "i-boot": 60, "i-glued": 30 },
  "w-ship": { "i-boot-packed": 500 },
};

const shifts = new Map<Id, Shift>();
const transfers = new Map<Id, Transfer>();
const idempotency = new Map<string, unknown>();
let docNo = 123;

// ---------- память между перезагрузками ----------

// Настоящая 1С помнит документы между запусками, поэтому и заглушка должна:
// иначе после каждой перезагрузки страницы смена пропадает и проверить ничего нельзя.
const PERSIST_KEY = "lf.1c.mock.v5";
const OFFLINE_KEY = "lf.1c.mock.offline";
const LATENCY_KEY = "lf.1c.mock.latency";
let restored = false;

function persist(): void {
  try {
    window.localStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({
        shifts: Array.from(shifts.entries()),
        transfers: Array.from(transfers.entries()),
        stock,
        docNo,
      }),
    );
  } catch {
    /* хранилище недоступно: работаем в памяти */
  }
}

/** Несколько закрытых смен за прошлые дни, чтобы истории было что показывать. */
function seedHistory(): void {
  if (shifts.size > 0) return;
  const day = daysAgo;

  const past: { workshop: Id; date: string; shiftNo: 1 | 2; product: Id; qty: number; defect: number }[] = [
    { workshop: "w-lit", date: day(1), shiftNo: 1, product: "i-galosh", qty: 640, defect: 12 },
    { workshop: "w-lit", date: day(1), shiftNo: 2, product: "i-galosh", qty: 410, defect: 4 },
    { workshop: "w-lit", date: day(2), shiftNo: 1, product: "i-galosh", qty: 580, defect: 9 },
    { workshop: "w-cut", date: day(1), shiftNo: 1, product: "i-blank", qty: 340, defect: 5 },
    { workshop: "w-sew", date: day(1), shiftNo: 1, product: "i-sock", qty: 300, defect: 2 },
    { workshop: "w-glu", date: day(1), shiftNo: 1, product: "i-glued", qty: 150, defect: 3 },
    { workshop: "w-assy", date: day(2), shiftNo: 1, product: "i-boot", qty: 120, defect: 1 },
    // Смена прошлого месяца: месяц уже закрыт, тронуть её нельзя.
    { workshop: "w-lit", date: day(35), shiftNo: 1, product: "i-galosh", qty: 700, defect: 15 },
  ];

  for (const row of past) {
    const id = uid();
    const shift: ShiftWithWorkshop = {
      id,
      number: `ЛФ-${String(++docNo).padStart(6, "0")}`,
      date: row.date,
      shift_no: row.shiftNo,
      status: "closed",
      version: "3",
      responsible: "Размела",
      created_at: `${row.date}T08:00:00`,
      closed_at: `${row.date}T20:30:00`,
      comment: "",
      task_id: null,
      workers: [],
      outputs: [],
      products: [{ product_id: row.product, qty: row.qty, defect_qty: row.defect }],
      // Как и в жизни: при закрытии 1С списала материалы по спецификации.
      materials: (findProduct(row.product)?.spec ?? []).map((line) => ({
        item_id: line.item_id,
        product_id: row.product,
        qty: round(line.qty_per_unit * row.qty),
      })),
      accounting: {
        status: "done",
        message: "",
        documents: { production_report: newDocument(row.date), payroll: null },
      },
      workshop_id: row.workshop,
    };
    shifts.set(id, shift);

    // Движения этих смен уже прошли: продукция на складе, материалы списаны.
    // Без этого остатки не сходятся с историей, и переоткрыть смену нельзя.
    const target = stock[row.workshop];
    target[row.product] = round((target[row.product] ?? 0) + row.qty);
    for (const m of shift.materials) {
      target[m.item_id] = round((target[m.item_id] ?? 0) - m.qty);
    }
  }
}

function restore(): void {
  if (restored || typeof window === "undefined") return;
  restored = true;
  try {
    const raw = window.localStorage.getItem(PERSIST_KEY);
    if (!raw) {
      seedHistory();
      // Без сохранения смены истории получали бы новые номера при каждой
      // перезагрузке, и открытая из истории смена «пропадала» после обновления.
      persist();
      return;
    }
    const saved = JSON.parse(raw) as {
      shifts: [Id, Shift][];
      transfers: [Id, Transfer][];
      stock: Record<Id, Record<Id, number>>;
      docNo: number;
    };
    saved.shifts.forEach(([id, doc]) => shifts.set(id, doc));
    saved.transfers.forEach(([id, doc]) => transfers.set(id, doc));
    Object.assign(stock, saved.stock);
    docNo = saved.docNo ?? docNo;
  } catch {
    /* повреждённые данные заглушки не повод падать */
  }
}

// ---------- вспомогательное ----------

function bump(version: string): string {
  return String(Number(version || "0") + 1);
}

function findProduct(productId: Id): Product1C | undefined {
  for (const data of Object.values(CATALOG)) {
    const found = data.products.find((p) => p.id === productId);
    if (found) return found;
  }
  return undefined;
}

/** Материалы цеха: комплектующие его спецификаций плюс всё, что лежит на складе. */
function materialsFor(workshopId: Id): Material1C[] {
  const ids = new Set<Id>();
  for (const p of CATALOG[workshopId]?.products ?? []) {
    for (const line of p.spec) ids.add(line.item_id);
  }
  for (const id of Object.keys(stock[workshopId] ?? {})) ids.add(id);
  return Array.from(ids).map((id) => ({
    id,
    code: item(id).code,
    name: item(id).name,
    unit: item(id).unit,
  }));
}

/** Сколько позиции занято в неподтверждённых исходящих перемещениях цеха. */
function reservedFor(workshopId: Id, itemId: Id): number {
  let sum = 0;
  Array.from(transfers.values()).forEach((t) => {
    if (t.from.workshop_id !== workshopId || t.status !== "open") return;
    t.lines.forEach((line) => {
      if (line.item_id === itemId) sum += line.qty;
    });
  });
  return sum;
}

function stockLines(workshopId: Id): StockLine[] {
  const own = stock[workshopId] ?? {};
  return Object.entries(own).map(([item_id, qty]) => {
    const reserved = reservedFor(workshopId, item_id);
    return {
      item_id,
      name: item(item_id).name,
      unit: item(item_id).unit,
      qty: round(qty),
      reserved: round(reserved),
      available: round(qty - reserved),
    };
  });
}

/**
 * Месяц в 1С закрывают раз в месяц, после того как всё проверено.
 * Пока он открыт, администратор может переоткрыть смену и поправить.
 */
function isPeriodClosed(date: string): boolean {
  return date < `${localDate().slice(0, 7)}-01`;
}

function newDocument(date: string) {
  return { id: uid(), number: `0000-${String(++docNo).padStart(6, "0")}`, date };
}

/**
 * Проверка ввода цеха: единственное, что может не дать закрыть смену.
 * Как и 1С, собирает все нарушения разом, чтобы человек исправил их за один заход.
 */
function validateShift(shift: ShiftWithWorkshop): ValidationDetail[] {
  const data = CATALOG[shift.workshop_id ?? "w-lit"];
  const problems: ValidationDetail[] = [];
  const isEmployee = (id: Id) => data.employees.some((e) => e.id === id);
  const producedIds = new Set(shift.products.map((p) => p.product_id));
  const add = (section: string, row: number, field: string, message: string) =>
    problems.push({ section, row, field, message });

  shift.workers.forEach((w, i) => {
    if (!isEmployee(w.employee_id)) {
      add("workers", i + 1, "employee_id", `Состав смены, строка ${i + 1}: сотрудник не из этого цеха`);
    }
  });
  shift.outputs.forEach((o, i) => {
    const where = `Выработка, строка ${i + 1}`;
    const workType = data.work_types.find((w) => w.id === o.work_type_id);
    if (!isEmployee(o.employee_id)) {
      add("outputs", i + 1, "employee_id", `${where}: сотрудник не из этого цеха`);
    }
    if (!workType) {
      add("outputs", i + 1, "work_type_id", `${where}: вид работ не из этого цеха`);
    } else if (workType.requires_product && !o.product_id) {
      add("outputs", i + 1, "product_id", `${where}: не указана продукция`);
    } else if (o.product_id && !data.products.some((p) => p.id === o.product_id)) {
      add("outputs", i + 1, "product_id", `${where}: продукция не из этого цеха`);
    }
  });
  shift.materials.forEach((m, i) => {
    if (!m.product_id || !producedIds.has(m.product_id)) {
      add("materials", i + 1, "product_id", `Материалы, строка ${i + 1}: не указана продукция смены`);
    }
  });
  return problems;
}

/**
 * Второй шаг закрытия: отражение в учёте. Смену он не блокирует: при неудаче
 * возвращает pending с причиной, остатки при этом не меняются.
 */
function reflectInAccounting(shift: ShiftWithWorkshop): ShiftAccounting {
  const workshopId = shift.workshop_id ?? "w-lit";
  const pending = (message: string): ShiftAccounting => ({
    status: "pending",
    message,
    documents: { production_report: null, payroll: null },
  });

  if (isPeriodClosed(shift.date)) {
    return pending(`Дата смены ${shift.date} попадает в закрытый период`);
  }

  const need = new Map<Id, number>();
  for (const m of shift.materials) need.set(m.item_id, (need.get(m.item_id) ?? 0) + m.qty);
  const needed = Array.from(need.entries());
  const short = needed.find(([itemId, qty]) => (stock[workshopId]?.[itemId] ?? 0) < qty);
  if (short) {
    const [itemId, qty] = short;
    const have = round(stock[workshopId]?.[itemId] ?? 0);
    const unit = item(itemId).unit;
    return pending(
      `Недостаточно остатка: ${item(itemId).name}, доступно ${have} ${unit}, требуется ${round(qty)} ${unit}`,
    );
  }

  for (const [itemId, qty] of needed) {
    stock[workshopId][itemId] = round(stock[workshopId][itemId] - qty);
  }
  for (const p of shift.products) {
    stock[workshopId][p.product_id] = round((stock[workshopId][p.product_id] ?? 0) + p.qty);
  }

  // Строки с продукцией идут в отчёт производства, без продукции в начисление ЗП.
  const hasProduction = shift.products.length > 0 || shift.outputs.some((o) => o.product_id);
  const hasUnproductive = shift.outputs.some((o) => !o.product_id);
  return {
    status: "done",
    message: "",
    documents: {
      production_report: hasProduction ? newDocument(shift.date) : null,
      payroll: hasUnproductive ? newDocument(shift.date) : null,
    },
  };
}

function requireShift(id: Id): Shift {
  const shift = shifts.get(id);
  if (!shift) throw new Api1CError("not_found", "Смена не найдена", 404);
  return shift;
}

function checkVersion(current: string, sent: string | undefined, doc: unknown) {
  if (sent && sent !== current) {
    throw new Api1CError("conflict", "Документ изменён с другого устройства", 409, { current: doc });
  }
}

function shortageError(shortage: { item_id: Id; available: number; required: number }[]): never {
  const first = shortage[0];
  throw new Api1CError(
    "insufficient_stock",
    `Недостаточно остатка: ${item(first.item_id).name}, доступно ${round(first.available)}, требуется ${round(first.required)}`,
    422,
    shortage.map((s) => ({ ...s, item_name: item(s.item_id).name })),
  );
}

type ShiftWithWorkshop = Shift & { workshop_id?: Id };

// ---------- клиент ----------

export type Api1CMockOptions = {
  /** Задержка ответа, чтобы на экранах было видно загрузку. */
  latencyMs?: number;
  isAdmin?: boolean;
  userName?: string;
  /** Цеха пользователя. По умолчанию все: так удобнее проверять обе стороны передачи. */
  workshopIds?: Id[];
};

export class Api1CMock implements Api1C {
  private readonly opts: Required<Api1CMockOptions>;

  constructor(options: Api1CMockOptions = {}) {
    this.opts = {
      latencyMs: options.latencyMs ?? 120,
      isAdmin: options.isAdmin ?? false,
      userName: options.userName ?? "Размела",
      workshopIds: options.workshopIds ?? WORKSHOPS.map((w) => w.id),
    };
    restore();
  }

  private async wait() {
    // Медленную сеть можно изобразить из консоли планшета:
    // localStorage.setItem("lf.1c.mock.latency", "2000") — задержка в миллисекундах.
    let latency = this.opts.latencyMs;
    try {
      const forced = Number(window.localStorage.getItem(LATENCY_KEY));
      if (forced > 0) latency = forced;
    } catch {
      /* хранилище недоступно */
    }
    if (latency) await new Promise((r) => setTimeout(r, latency));
    // Режим «нет связи» для проверки офлайна: включается из консоли планшета
    // localStorage.setItem("lf.1c.mock.offline", "1")
    try {
      if (window.localStorage.getItem(OFFLINE_KEY)) throw new Api1COfflineError();
    } catch (e) {
      if (e instanceof Api1COfflineError) throw e;
    }
  }

  async ping() {
    await this.wait();
    return { ok: true as const, api: "1.0", config: "БП 3.0.74.76 (заглушка)", server_time: now() };
  }

  async me(): Promise<Me> {
    await this.wait();
    return {
      ok: true,
      user: { id: "u-1", name: this.opts.userName },
      is_admin: this.opts.isAdmin,
      workshops: WORKSHOPS.filter((w) => this.opts.workshopIds.includes(w.id)),
    };
  }

  async workshopContext(workshopId: Id): Promise<WorkshopContext> {
    await this.wait();
    const workshop = WORKSHOPS.find((w) => w.id === workshopId);
    const data = CATALOG[workshopId];
    if (!workshop || !data) throw new Api1CError("forbidden", "Нет доступа к цеху", 403);

    return {
      ok: true,
      workshop,
      organization: { id: "org-1", name: "Хачатуров Арайр Владимирович ИП" },
      employees: data.employees,
      work_types: data.work_types,
      products: data.products,
      materials: materialsFor(workshopId),
      stock: stockLines(workshopId),
      open_shifts: Array.from(shifts.values())
        .filter((s) => s.status === "open" && (s as ShiftWithWorkshop).workshop_id === workshopId)
        .map(({ id, number, date, shift_no, status, version }) => ({
          id,
          number,
          date,
          shift_no,
          status,
          version,
        })),
      transfer_targets: WORKSHOPS.filter((w) => w.id !== workshopId),
      pending_incoming_transfers: Array.from(transfers.values()).filter(
        (t) => t.to.workshop_id === workshopId && t.status === "open",
      ).length,
    };
  }

  async workshopStock(workshopId: Id): Promise<StockLine[]> {
    await this.wait();
    return stockLines(workshopId);
  }

  // ---------- смены ----------

  async listShifts(query: ShiftsQuery): Promise<Page<ShiftHead>> {
    await this.wait();
    const items = Array.from(shifts.values())
      .filter((s) => (s as ShiftWithWorkshop).workshop_id === query.workshop)
      .filter((s) => (query.status && query.status !== "all" ? s.status === query.status : true))
      .filter((s) => (query.from ? s.date >= query.from : true))
      .filter((s) => (query.to ? s.date <= query.to : true))
      .sort((a, b) => (b.date + b.number).localeCompare(a.date + a.number))
      .map(
        (s): ShiftHead => ({
          id: s.id,
          number: s.number,
          date: s.date,
          shift_no: s.shift_no,
          status: s.status,
          version: s.version,
          responsible: s.responsible,
          produced_total: round(s.products.reduce((sum, p) => sum + p.qty, 0)),
          defect_total: round(s.products.reduce((sum, p) => sum + p.defect_qty, 0)),
          closed_at: s.closed_at ?? null,
          accounting_status: s.status === "closed" ? (s.accounting?.status ?? null) : null,
        }),
      );

    const page = query.page ?? 1;
    const size = query.page_size ?? 50;
    return {
      ok: true,
      total: items.length,
      page,
      page_size: size,
      items: items.slice((page - 1) * size, page * size),
    };
  }

  async getShift(shiftId: Id): Promise<Shift> {
    await this.wait();
    const shift = requireShift(shiftId) as ShiftWithWorkshop;
    // В жизни повторное отражение запускает бухгалтер, когда устранил причину.
    // Заглушка делает это сама при чтении: причина ушла, значит смена отразится.
    if (shift.status === "closed" && shift.accounting?.status === "pending") {
      const retried = reflectInAccounting(shift);
      if (retried.status === "done") {
        shift.accounting = retried;
        shift.version = bump(shift.version);
        persist();
      }
    }
    return structuredClone(shift);
  }

  async openShift(workshopId: Id, date: string, shiftNo: 1 | 2): Promise<Shift> {
    await this.wait();
    const existing = Array.from(shifts.values()).find(
      (s) =>
        s.status === "open" &&
        s.date === date &&
        s.shift_no === shiftNo &&
        (s as ShiftWithWorkshop).workshop_id === workshopId,
    );
    if (existing) return structuredClone(existing);

    const shift: ShiftWithWorkshop = {
      id: uid(),
      number: `ЛФ-${String(++docNo).padStart(6, "0")}`,
      date: date || today(),
      shift_no: shiftNo,
      status: "open",
      version: "1",
      responsible: this.opts.userName,
      created_at: now(),
      comment: "",
      task_id: null,
      workers: [],
      outputs: [],
      products: [],
      materials: [],
      accounting: null,
      // Заглушка держит цех прямо в документе: в 1С его знает сам документ.
      workshop_id: workshopId,
    };
    shifts.set(shift.id, shift);
    persist();
    return structuredClone(shift);
  }

  async saveShift(shiftId: Id, state: ShiftState, version?: string): Promise<string> {
    await this.wait();
    const shift = requireShift(shiftId);
    if (shift.status === "closed") {
      throw new Api1CError("state", "Смена закрыта, правка запрещена", 409);
    }
    checkVersion(shift.version, version, structuredClone(shift));
    Object.assign(shift, state, { version: bump(shift.version) });
    persist();
    return shift.version;
  }

  async closeShift(shiftId: Id, opts: { version?: string } = {}): Promise<CloseShiftResult> {
    await this.wait();
    const shift = requireShift(shiftId) as ShiftWithWorkshop;
    const brief = () => ({
      id: shift.id,
      status: shift.status,
      closed_at: shift.closed_at,
      version: shift.version,
    });

    // Повтор по закрытой смене возвращает её текущее состояние, дубль невозможен.
    if (shift.status === "closed" && shift.accounting) {
      return { ok: true, shift: brief(), accounting: structuredClone(shift.accounting) };
    }
    checkVersion(shift.version, opts.version, structuredClone(shift));

    // Шаг 1. Закрытие: проверяется только ввод цеха.
    const problems = validateShift(shift);
    if (problems.length) {
      throw new Api1CError("validation", problems[0].message, 400, problems);
    }

    // Материалы не вводили: 1С заполняет их сама по спецификации, с привязкой к продукции.
    const warnings: string[] = [];
    if (shift.materials.length === 0) {
      shift.materials = shift.products.flatMap((p) =>
        (findProduct(p.product_id)?.spec ?? []).map((line) => ({
          item_id: line.item_id,
          product_id: p.product_id,
          qty: round(line.qty_per_unit * p.qty),
        })),
      );
      if (shift.materials.length) {
        warnings.push(`Материалы заполнены по спецификации: ${shift.materials.length} поз.`);
      }
    }

    shift.status = "closed";
    shift.closed_at = now();
    shift.version = bump(shift.version);

    // Шаг 2. Отражение в учёте: при неудаче смена всё равно остаётся закрытой.
    shift.accounting = reflectInAccounting(shift);
    if (shift.accounting.status === "done") shift.version = bump(shift.version);

    persist();
    return { ok: true, shift: brief(), accounting: structuredClone(shift.accounting), warnings };
  }

  async reopenShift(shiftId: Id, reason: string) {
    await this.wait();
    if (!this.opts.isAdmin) {
      // Как в 1С: отказ платформы по правам на метод сервиса.
      throw new Api1CError("forbidden", "Недостаточно прав для этого действия", 403);
    }
    const shift = requireShift(shiftId) as ShiftWithWorkshop;
    if (shift.status !== "closed") throw new Api1CError("state", "Смена и так открыта", 409);
    if (isPeriodClosed(shift.date)) {
      // Закрытый период при переоткрытии 1С отдаёт как posting_failed со своим текстом.
      throw new Api1CError(
        "posting_failed",
        `Изменение запрещено: дата смены ${shift.date} попадает в закрытый период`,
        422,
      );
    }
    const workshopId = shift.workshop_id ?? "w-lit";

    // Если смена была отражена в учёте, 1С отменяет проведение. Остатки при этом
    // она НЕ проверяет: если продукцию уже передали дальше, склад уйдёт в минус.
    // Так ведёт себя типовая Бухгалтерия, приложение предупреждает об этом само.
    if (shift.accounting?.status === "done") {
      for (const p of shift.products) {
        stock[workshopId][p.product_id] = round((stock[workshopId][p.product_id] ?? 0) - p.qty);
      }
      for (const m of shift.materials) {
        stock[workshopId][m.item_id] = round((stock[workshopId][m.item_id] ?? 0) + m.qty);
      }
    }

    // В 1С причина уходит в документ, здесь просто дописываем к комментарию.
    if (reason) shift.comment = shift.comment ? `${shift.comment}. ${reason}` : reason;
    shift.status = "open";
    shift.closed_at = null;
    shift.accounting = null;
    // Материалы после переоткрытия снова считает 1С: выпуск могут поправить.
    shift.materials = [];
    shift.version = bump(shift.version);
    persist();
    return { ok: true as const, shift: structuredClone(shift) as Shift };
  }

  // ---------- перемещения ----------

  async listTransfers(query: TransfersQuery): Promise<Page<TransferHead>> {
    await this.wait();
    const items = Array.from(transfers.values())
      .filter((t) => {
        if (query.direction === "in") return t.to.workshop_id === query.workshop;
        if (query.direction === "out") return t.from.workshop_id === query.workshop;
        return t.from.workshop_id === query.workshop || t.to.workshop_id === query.workshop;
      })
      .filter((t) => (query.status && query.status !== "all" ? t.status === query.status : true))
      .sort((a, b) => b.date.localeCompare(a.date))
      .map(
        (t): TransferHead => ({
          id: t.id,
          number: t.number,
          date: t.date,
          from: t.from,
          to: t.to,
          status: t.status,
          sender_confirmed: t.sender_confirmed,
          receiver_confirmed: t.receiver_confirmed,
          version: t.version,
          lines_count: t.lines.length,
          qty_total: round(t.lines.reduce((sum, line) => sum + line.qty, 0)),
        }),
      );
    return { ok: true, total: items.length, page: 1, page_size: items.length || 1, items };
  }

  async getTransfer(transferId: Id): Promise<Transfer> {
    await this.wait();
    const doc = transfers.get(transferId);
    if (!doc) throw new Api1CError("not_found", "Перемещение не найдено", 404);
    return structuredClone(doc);
  }

  /** Доступный остаток отправителя: остаток минус занятое другими открытыми документами. */
  private checkAvailable(fromWorkshop: Id, lines: NewTransfer["lines"], ignoreTransferId?: Id) {
    const shortage = lines
      .map((line) => {
        const qty = stock[fromWorkshop]?.[line.item_id] ?? 0;
        let reserved = reservedFor(fromWorkshop, line.item_id);
        if (ignoreTransferId) {
          const own = transfers.get(ignoreTransferId)?.lines.find((l) => l.item_id === line.item_id);
          if (own) reserved -= own.qty;
        }
        return { item_id: line.item_id, available: qty - reserved, required: line.qty };
      })
      .filter((x) => x.required > x.available);
    if (shortage.length) shortageError(shortage);
  }

  private withNames(lines: NewTransfer["lines"]) {
    return lines.map((l) => ({ ...l, name: item(l.item_id).name, unit: item(l.item_id).unit }));
  }

  async createTransfer(doc: NewTransfer, idempotencyKey: string): Promise<Transfer> {
    await this.wait();
    const cached = idempotency.get(idempotencyKey);
    if (cached) return cached as Transfer;

    const from = WORKSHOPS.find((w) => w.id === doc.from_workshop_id);
    const to = WORKSHOPS.find((w) => w.id === doc.to_workshop_id);
    if (!from || !to) throw new Api1CError("validation", "Неизвестный цех", 400);
    if (doc.lines.length === 0) throw new Api1CError("validation", "Нет строк для передачи", 400);
    this.checkAvailable(doc.from_workshop_id, doc.lines);

    const transfer: Transfer = {
      id: uid(),
      number: `0000-${String(++docNo).padStart(6, "0")}`,
      date: now(),
      from: { workshop_id: from.id, name: from.name },
      to: { workshop_id: to.id, name: to.name },
      status: "open",
      sender_confirmed: { by: this.opts.userName, at: now() },
      receiver_confirmed: null,
      version: "1",
      comment: doc.comment ?? "",
      lines: this.withNames(doc.lines),
    };
    transfers.set(transfer.id, transfer);
    idempotency.set(idempotencyKey, transfer);
    persist();
    return structuredClone(transfer);
  }

  async updateTransfer(
    transferId: Id,
    patch: { comment?: string; lines: NewTransfer["lines"] },
    version?: string,
  ): Promise<Transfer> {
    await this.wait();
    const live = transfers.get(transferId);
    if (!live) throw new Api1CError("not_found", "Перемещение не найдено", 404);
    if (live.status === "posted") {
      throw new Api1CError("state", "Документ проведён, правка запрещена", 409);
    }
    checkVersion(live.version, version, structuredClone(live));
    this.checkAvailable(live.from.workshop_id, patch.lines, transferId);

    live.lines = this.withNames(patch.lines);
    if (patch.comment !== undefined) live.comment = patch.comment;
    // Правка любой стороной сбрасывает оба подтверждения.
    live.sender_confirmed = null;
    live.receiver_confirmed = null;
    live.version = bump(live.version);
    persist();
    return structuredClone(live);
  }

  async confirmTransfer(
    transferId: Id,
    opts: { version?: string; side?: ConfirmSide } = {},
  ): Promise<Transfer> {
    await this.wait();
    const live = transfers.get(transferId);
    if (!live) throw new Api1CError("not_found", "Перемещение не найдено", 404);
    if (live.status === "posted") throw new Api1CError("state", "Документ уже проведён", 409);
    checkVersion(live.version, opts.version, structuredClone(live));

    const side: ConfirmSide = opts.side ?? (live.sender_confirmed ? "receiver" : "sender");
    const mark = { by: this.opts.userName, at: now() };
    if (side === "sender") live.sender_confirmed = mark;
    else live.receiver_confirmed = mark;

    if (live.sender_confirmed && live.receiver_confirmed) {
      // Оба подтверждения: 1С проводит документ, остаток уходит получателю.
      this.checkAvailable(live.from.workshop_id, live.lines, transferId);
      for (const line of live.lines) {
        stock[live.from.workshop_id][line.item_id] = round(
          (stock[live.from.workshop_id][line.item_id] ?? 0) - line.qty,
        );
        stock[live.to.workshop_id][line.item_id] = round(
          (stock[live.to.workshop_id][line.item_id] ?? 0) + line.qty,
        );
      }
      live.status = "posted";
    }
    live.version = bump(live.version);
    persist();
    return structuredClone(live);
  }

  async deleteTransfer(transferId: Id) {
    await this.wait();
    const live = transfers.get(transferId);
    if (!live) throw new Api1CError("not_found", "Перемещение не найдено", 404);
    if (live.status === "posted") {
      throw new Api1CError("state", "Проведённый документ удалить нельзя", 409);
    }
    transfers.delete(transferId);
    persist();
    return { ok: true as const };
  }
}
