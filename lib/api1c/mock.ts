// Заглушка 1С по разделу 6 контракта: данные в памяти, те же ответы и те же ошибки.
// Нужна, пока dev-база Арсена не опубликована: на ней разрабатываются все экраны.
//
// Демо-данные повторяют реальную цепочку фабрики: Литьё делает галоши, Швейка носки,
// Обшив шьёт из того и другого, Маркировка упаковывает. Покупное сырьё есть только
// в начале цепочки, дальше всё движется перемещениями между цехами.
//
// Специально воспроизводит и неприятные случаи: нехватку остатка, конфликт версий,
// сброс подтверждений при правке перемещения.

import type { Api1C } from "./api";
import { Api1CError, Api1COfflineError } from "./client";
import type {
  ConfirmSide,
  Employee1C,
  Id,
  Material1C,
  Me,
  NewTransfer,
  Page,
  Product1C,
  Shift,
  ShiftHead,
  ShiftState,
  ShiftsQuery,
  StockLine,
  Transfer,
  TransferHead,
  TransfersQuery,
  WorkType,
  WorkshopContext,
  WorkshopRef,
} from "./types";

const uid = () => crypto.randomUUID();
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString().slice(0, 19);
const round = (n: number) => Math.round(n * 1000) / 1000;

// ---------- справочники ----------

const WORKSHOPS: WorkshopRef[] = [
  { id: "w-lit", code: "00-000004", name: "Литьё", warehouse: { id: "s-lit", name: "Литейный ЦЕХ ЭВА" } },
  { id: "w-sew", code: "00-000006", name: "Швейка", warehouse: { id: "s-sew", name: "Швейное производство" } },
  { id: "w-assy", code: "00-000007", name: "Обшив", warehouse: { id: "s-assy", name: "Склад Обшив" } },
  { id: "w-mark", code: "00-000009", name: "Маркировка", warehouse: { id: "s-mark", name: "Склад Маркировка" } },
  { id: "w-ship", code: "00-000011", name: "Склад ГП", warehouse: { id: "s-ship", name: "Готовая продукция" } },
];

/** Единый справочник номенклатуры: и покупное сырьё, и полуфабрикаты, и готовое. */
const ITEMS: Record<Id, { code: string; name: string; unit: string }> = {
  "i-eva": { code: "00-00000501", name: "Пластикат ЭВА чёрный", unit: "кг" },
  "i-cloth": { code: "00-00000502", name: "Ткань подкладочная", unit: "м" },
  "i-galosh": { code: "00-00001001", name: "Галоша ЭВА 112", unit: "пар" },
  "i-sock": { code: "00-00001002", name: "Носок утеплённый 112", unit: "пар" },
  "i-boot": { code: "00-00001234", name: "Сапоги женские ЭВА с манжетой", unit: "пар" },
  "i-boot-packed": { code: "00-00001235", name: "Сапоги 112 упакованные", unit: "пар" },
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
  is_downtime: true,
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
      { id: "wt-cast6", code: "ВР-006", name: "Литьё 6-парка", unit: "пар", is_downtime: false },
      { id: "wt-cast4", code: "ВР-004", name: "Литьё 4-парка", unit: "пар", is_downtime: false },
      idle("lit"),
    ],
    products: [product("i-galosh", "112-г", [{ item_id: "i-eva", qty_per_unit: 0.42 }])],
  },
  "w-sew": {
    employees: [
      { id: "e-sew-1", code: "0000071", name: "Работник Ш-01", position: "Швея", default_work_type_id: "wt-sew" },
      { id: "e-sew-2", code: "0000072", name: "Работник Ш-02", position: "Швея", default_work_type_id: "wt-sew" },
    ],
    work_types: [
      { id: "wt-sew", code: "ВР-020", name: "Пошив носка", unit: "пар", is_downtime: false },
      idle("sew"),
    ],
    products: [product("i-sock", "112-н", [{ item_id: "i-cloth", qty_per_unit: 0.35 }])],
  },
  "w-assy": {
    employees: [
      { id: "e-assy-1", code: "0000081", name: "Работник О-01", position: "Обшивщик", default_work_type_id: "wt-assy" },
      { id: "e-assy-2", code: "0000082", name: "Работник О-02", position: "Обшивщик", default_work_type_id: "wt-assy" },
    ],
    work_types: [
      { id: "wt-assy", code: "ВР-030", name: "Обшив сапога", unit: "пар", is_downtime: false },
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
  "w-mark": {
    employees: [
      { id: "e-mark-1", code: "0000091", name: "Работник М-01", position: "Упаковщик", default_work_type_id: "wt-pack" },
    ],
    work_types: [
      { id: "wt-pack", code: "ВР-010", name: "Упаковка", unit: "пар", is_downtime: false },
      idle("mark"),
    ],
    products: [product("i-boot-packed", "112/у", [{ item_id: "i-boot", qty_per_unit: 1 }])],
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
  "w-lit": { "i-eva": 1250.5, "i-galosh": 320 },
  "w-sew": { "i-cloth": 900, "i-sock": 210 },
  "w-assy": { "i-galosh": 40, "i-sock": 40 },
  "w-mark": { "i-boot": 60 },
  "w-ship": { "i-boot-packed": 500 },
};

const shifts = new Map<Id, Shift>();
const transfers = new Map<Id, Transfer>();
const idempotency = new Map<string, unknown>();
let docNo = 123;

// ---------- память между перезагрузками ----------

// Настоящая 1С помнит документы между запусками, поэтому и заглушка должна:
// иначе после каждой перезагрузки страницы смена пропадает и проверить ничего нельзя.
const PERSIST_KEY = "lf.1c.mock.v2";
const OFFLINE_KEY = "lf.1c.mock.offline";
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
  const day = (back: number) =>
    new Date(Date.now() - back * 86_400_000).toISOString().slice(0, 10);

  const past: { workshop: Id; date: string; shiftNo: 1 | 2; product: Id; qty: number; defect: number }[] = [
    { workshop: "w-lit", date: day(1), shiftNo: 1, product: "i-galosh", qty: 640, defect: 12 },
    { workshop: "w-lit", date: day(1), shiftNo: 2, product: "i-galosh", qty: 410, defect: 4 },
    { workshop: "w-lit", date: day(2), shiftNo: 1, product: "i-galosh", qty: 580, defect: 9 },
    { workshop: "w-sew", date: day(1), shiftNo: 1, product: "i-sock", qty: 300, defect: 2 },
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
        qty: round(line.qty_per_unit * row.qty),
      })),
      production_report: {
        id: uid(),
        number: `0000-${String(++docNo).padStart(6, "0")}`,
        date: row.date,
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
 * После закрытия 1С не даст ни распровести, ни изменить.
 */
function assertPeriodOpen(date: string): void {
  const firstOfCurrentMonth = `${new Date().toISOString().slice(0, 7)}-01`;
  if (date < firstOfCurrentMonth) {
    throw new Api1CError(
      "period_closed",
      `Месяц закрыт в 1С, смену за ${date} изменить нельзя`,
      422,
    );
  }
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
    if (this.opts.latencyMs) await new Promise((r) => setTimeout(r, this.opts.latencyMs));
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
    return structuredClone(requireShift(shiftId));
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
      production_report: null,
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

  async closeShift(shiftId: Id, opts: { version?: string; idempotencyKey: string; comment?: string }) {
    await this.wait();
    const cached = idempotency.get(opts.idempotencyKey);
    if (cached) return cached as { ok: true; shift: Shift; warnings?: string[] };

    const shift = requireShift(shiftId) as ShiftWithWorkshop;
    checkVersion(shift.version, opts.version, structuredClone(shift));
    assertPeriodOpen(shift.date);
    const workshopId = shift.workshop_id ?? "w-lit";

    // Материалы: переданные по факту или расчёт по спецификации, как это сделает 1С.
    const warnings: string[] = [];
    let materials = shift.materials;
    if (materials.length === 0) {
      const need = new Map<Id, number>();
      for (const p of shift.products) {
        for (const line of findProduct(p.product_id)?.spec ?? []) {
          need.set(line.item_id, (need.get(line.item_id) ?? 0) + line.qty_per_unit * p.qty);
        }
      }
      materials = Array.from(need.entries()).map(([item_id, qty]) => ({ item_id, qty: round(qty) }));
      if (materials.length) warnings.push(`Материалы заполнены по спецификации: ${materials.length} позиции`);
    }

    // Контроль отрицательных остатков склада цеха: тот же отказ, что даст 1С.
    const shortage = materials
      .filter((m) => (stock[workshopId]?.[m.item_id] ?? 0) < m.qty)
      .map((m) => ({
        item_id: m.item_id,
        available: stock[workshopId]?.[m.item_id] ?? 0,
        required: m.qty,
      }));
    if (shortage.length) shortageError(shortage);

    for (const m of materials) {
      stock[workshopId][m.item_id] = round(stock[workshopId][m.item_id] - m.qty);
    }
    for (const p of shift.products) {
      stock[workshopId][p.product_id] = round((stock[workshopId][p.product_id] ?? 0) + p.qty);
    }

    shift.status = "closed";
    shift.closed_at = now();
    shift.version = bump(shift.version);
    shift.materials = materials;
    shift.production_report = {
      id: uid(),
      number: `0000-${String(++docNo).padStart(6, "0")}`,
      date: shift.date,
    };

    const result = { ok: true as const, shift: structuredClone(shift) as Shift, warnings };
    idempotency.set(opts.idempotencyKey, result);
    persist();
    return result;
  }

  async reopenShift(shiftId: Id, reason: string) {
    await this.wait();
    if (!this.opts.isAdmin) {
      throw new Api1CError("forbidden", "Переоткрыть смену может только администратор", 403);
    }
    const shift = requireShift(shiftId) as ShiftWithWorkshop;
    if (shift.status !== "closed") throw new Api1CError("state", "Смена и так открыта", 409);
    assertPeriodOpen(shift.date);
    const workshopId = shift.workshop_id ?? "w-lit";

    // 1С распроводит отчёт производства, то есть отменяет движения. Если продукцию
    // уже передали дальше, снимать её со склада не с чего, и отмена не пройдёт.
    const gone = shift.products.filter((p) => (stock[workshopId]?.[p.product_id] ?? 0) < p.qty);
    if (gone.length) {
      throw new Api1CError(
        "posting_failed",
        `Продукции уже нет на складе цеха: ${item(gone[0].product_id).name}. Отчёт производства не распровести.`,
        422,
      );
    }

    for (const p of shift.products) {
      stock[workshopId][p.product_id] = round(stock[workshopId][p.product_id] - p.qty);
    }
    for (const m of shift.materials) {
      stock[workshopId][m.item_id] = round((stock[workshopId][m.item_id] ?? 0) + m.qty);
    }

    // В 1С причина уходит в документ, здесь просто дописываем к комментарию.
    if (reason) shift.comment = shift.comment ? `${shift.comment}. ${reason}` : reason;
    shift.status = "open";
    shift.closed_at = null;
    shift.production_report = null;
    shift.version = bump(shift.version);
    persist();
    return { ok: true as const, shift: structuredClone(shift) };
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
