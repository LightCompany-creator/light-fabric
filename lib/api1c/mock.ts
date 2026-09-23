// Заглушка 1С по разделу 6 контракта: данные в памяти, те же ответы и те же ошибки.
// Нужна, пока dev-база Арсена не опубликована: на ней разрабатываются все экраны.
// Специально воспроизводит неприятные случаи, а не только счастливый путь:
// нехватка остатка при закрытии смены, конфликт версий, сброс подтверждений при правке.

import type { Api1C } from "./api";
import { Api1CError } from "./client";
import type {
  ConfirmSide,
  Id,
  Me,
  NewTransfer,
  Page,
  Shift,
  ShiftHead,
  ShiftState,
  ShiftsQuery,
  StockLine,
  Transfer,
  TransferHead,
  TransfersQuery,
  WorkshopContext,
  WorkshopRef,
} from "./types";

const uid = () => crypto.randomUUID();
const today = () => new Date().toISOString().slice(0, 10);
const now = () => new Date().toISOString().slice(0, 19);

const WORKSHOPS: WorkshopRef[] = [
  { id: "w-lit", code: "00-000004", name: "Литейка ЭВА", warehouse: { id: "s-lit", name: "Литейный ЦЕХ ЭВА" } },
  { id: "w-mark", code: "00-000009", name: "Маркировка", warehouse: { id: "s-mark", name: "Склад Маркировка" } },
  { id: "w-ship", code: "00-000011", name: "Склад ГП", warehouse: { id: "s-ship", name: "Готовая продукция" } },
];

const EMPLOYEES = [
  { id: "e-1", code: "0000056", name: "Работник Л-01", position: "Литейщик", default_work_type_id: "wt-cast6" },
  { id: "e-2", code: "0000057", name: "Работник Л-02", position: "Литейщик", default_work_type_id: "wt-cast4" },
  { id: "e-3", code: "0000058", name: "Работник Л-03", position: "Упаковщик", default_work_type_id: null },
];

const WORK_TYPES = [
  { id: "wt-cast6", code: "ВР-006", name: "Литьё 6-парка", unit: "пар", is_downtime: false },
  { id: "wt-cast4", code: "ВР-004", name: "Литьё 4-парка", unit: "пар", is_downtime: false },
  { id: "wt-pack", code: "ВР-010", name: "Упаковка", unit: "пар", is_downtime: false },
  { id: "wt-idle", code: "ВР-099", name: "Простой", unit: "ч", is_downtime: true },
];

const PRODUCTS = [
  {
    id: "p-112", code: "00-00001234", article: "112/н", name: "Сапоги женские ЭВА с манжетой",
    unit: "пар", spec: [{ item_id: "m-eva", qty_per_unit: 0.42 }],
  },
  {
    id: "p-137", code: "00-00001235", article: "137", name: "Обувь мужская, туфли купальные",
    unit: "пар", spec: [{ item_id: "m-eva", qty_per_unit: 0.18 }],
  },
];

const MATERIALS = [
  { id: "m-eva", code: "00-00000501", name: "Пластикат ЭВА чёрный", unit: "кг" },
  { id: "m-dye", code: "00-00000502", name: "Краситель", unit: "кг" },
];

/** Остатки по складам цехов: item_id → количество. */
const stock: Record<Id, Record<Id, number>> = {
  "w-lit": { "m-eva": 1250.5, "m-dye": 18, "p-112": 640, "p-137": 120 },
  "w-mark": { "p-112": 80 },
  "w-ship": {},
};

const shifts = new Map<Id, Shift>();
const transfers = new Map<Id, Transfer>();
const idempotency = new Map<string, unknown>();
let docNo = 123;

function bump(version: string): string {
  return String(Number(version || "0") + 1);
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
  const nameOf = (id: Id) =>
    PRODUCTS.find((p) => p.id === id)?.name ?? MATERIALS.find((m) => m.id === id)?.name ?? id;
  const unitOf = (id: Id) =>
    PRODUCTS.find((p) => p.id === id)?.unit ?? MATERIALS.find((m) => m.id === id)?.unit ?? "";
  return Object.entries(own).map(([item_id, qty]) => {
    const reserved = reservedFor(workshopId, item_id);
    return { item_id, name: nameOf(item_id), unit: unitOf(item_id), qty, reserved, available: qty - reserved };
  });
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

export type Api1CMockOptions = {
  /** Задержка ответа, чтобы на экранах было видно загрузку. */
  latencyMs?: number;
  isAdmin?: boolean;
  userName?: string;
  /** Цеха пользователя. По умолчанию Литейка и Маркировка. */
  workshopIds?: Id[];
};

export class Api1CMock implements Api1C {
  private readonly opts: Required<Api1CMockOptions>;

  constructor(options: Api1CMockOptions = {}) {
    this.opts = {
      latencyMs: options.latencyMs ?? 120,
      isAdmin: options.isAdmin ?? false,
      userName: options.userName ?? "Размела",
      workshopIds: options.workshopIds ?? ["w-lit", "w-mark"],
    };
  }

  private async wait() {
    if (this.opts.latencyMs) await new Promise((r) => setTimeout(r, this.opts.latencyMs));
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
    if (!workshop) throw new Api1CError("forbidden", "Нет доступа к цеху", 403);
    return {
      ok: true,
      workshop,
      organization: { id: "org-1", name: "Хачатуров Арайр Владимирович ИП" },
      employees: EMPLOYEES,
      work_types: WORK_TYPES,
      products: PRODUCTS,
      materials: MATERIALS,
      stock: stockLines(workshopId),
      open_shifts: Array.from(shifts.values())
        .filter((s) => s.status === "open")
        .map(({ id, number, date, shift_no, status, version }) => ({ id, number, date, shift_no, status, version })),
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
      .filter((s) => (query.status && query.status !== "all" ? s.status === query.status : true))
      .sort((a, b) => b.date.localeCompare(a.date));
    return { ok: true, total: items.length, page: 1, page_size: items.length || 1, items };
  }

  async getShift(shiftId: Id): Promise<Shift> {
    await this.wait();
    return structuredClone(requireShift(shiftId));
  }

  async openShift(workshopId: Id, date: string, shiftNo: 1 | 2): Promise<Shift> {
    await this.wait();
    const existing = Array.from(shifts.values()).find(
      (s) => s.status === "open" && s.date === date && s.shift_no === shiftNo,
    );
    if (existing) return structuredClone(existing);

    const shift: Shift = {
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
    };
    shifts.set(shift.id, shift);
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
    return shift.version;
  }

  async closeShift(shiftId: Id, opts: { version?: string; idempotencyKey: string; comment?: string }) {
    await this.wait();
    const cached = idempotency.get(opts.idempotencyKey);
    if (cached) return cached as { ok: true; shift: Shift; warnings?: string[] };

    const shift = requireShift(shiftId);
    checkVersion(shift.version, opts.version, structuredClone(shift));

    // Материалы: переданные по факту или расчёт по спецификации, как это сделает 1С.
    const warnings: string[] = [];
    let materials = shift.materials;
    if (materials.length === 0) {
      const need = new Map<Id, number>();
      for (const p of shift.products) {
        const spec = PRODUCTS.find((x) => x.id === p.product_id)?.spec ?? [];
        for (const line of spec) {
          need.set(line.item_id, (need.get(line.item_id) ?? 0) + line.qty_per_unit * p.qty);
        }
      }
      materials = Array.from(need.entries()).map(([item_id, qty]) => ({ item_id, qty: Math.round(qty * 1000) / 1000 }));
      if (materials.length) warnings.push(`Материалы заполнены по спецификации: ${materials.length} позиции`);
    }

    // Контроль отрицательных остатков сырьевых складов: тот же отказ, что даст 1С.
    const workshopId = "w-lit";
    const shortage = materials
      .filter((m) => (stock[workshopId]?.[m.item_id] ?? 0) < m.qty)
      .map((m) => ({
        item_id: m.item_id,
        item_name: MATERIALS.find((x) => x.id === m.item_id)?.name ?? m.item_id,
        available: stock[workshopId]?.[m.item_id] ?? 0,
        required: m.qty,
      }));
    if (shortage.length) {
      const first = shortage[0];
      throw new Api1CError(
        "insufficient_stock",
        `Недостаточно остатка: ${first.item_name}, доступно ${first.available}, требуется ${first.required}`,
        422,
        shortage,
      );
    }

    for (const m of materials) stock[workshopId][m.item_id] -= m.qty;
    for (const p of shift.products) {
      stock[workshopId][p.product_id] = (stock[workshopId][p.product_id] ?? 0) + p.qty;
    }

    shift.status = "closed";
    shift.closed_at = now();
    shift.version = bump(shift.version);
    shift.materials = materials;
    shift.production_report = { id: uid(), number: `0000-${String(++docNo).padStart(6, "0")}`, date: shift.date };

    const result = { ok: true as const, shift: structuredClone(shift), warnings };
    idempotency.set(opts.idempotencyKey, result);
    return result;
  }

  async reopenShift(shiftId: Id, reason: string) {
    await this.wait();
    if (!this.opts.isAdmin) throw new Api1CError("forbidden", "Переоткрыть смену может только администратор", 403);
    const shift = requireShift(shiftId);
    // В 1С причина уходит в документ, здесь просто дописываем к комментарию.
    if (reason) shift.comment = shift.comment ? `${shift.comment}. ${reason}` : reason;
    shift.status = "open";
    shift.closed_at = null;
    shift.production_report = null;
    shift.version = bump(shift.version);
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
      .map((t): TransferHead => ({
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
        qty_total: t.lines.reduce((sum, line) => sum + line.qty, 0),
      }));
    return { ok: true, total: items.length, page: 1, page_size: items.length || 1, items };
  }

  async getTransfer(transferId: Id): Promise<Transfer> {
    await this.wait();
    const doc = transfers.get(transferId);
    if (!doc) throw new Api1CError("not_found", "Перемещение не найдено", 404);
    return structuredClone(doc);
  }

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
      .filter((x) => x.required > x.available)
      .map((x) => ({
        ...x,
        item_name:
          PRODUCTS.find((p) => p.id === x.item_id)?.name ?? MATERIALS.find((m) => m.id === x.item_id)?.name ?? x.item_id,
      }));
    if (shortage.length) {
      const first = shortage[0];
      throw new Api1CError(
        "insufficient_stock",
        `Недостаточно остатка: ${first.item_name}, доступно ${first.available}, требуется ${first.required}`,
        422,
        shortage,
      );
    }
  }

  async createTransfer(doc: NewTransfer, idempotencyKey: string): Promise<Transfer> {
    await this.wait();
    const cached = idempotency.get(idempotencyKey);
    if (cached) return cached as Transfer;

    this.checkAvailable(doc.from_workshop_id, doc.lines);
    const from = WORKSHOPS.find((w) => w.id === doc.from_workshop_id);
    const to = WORKSHOPS.find((w) => w.id === doc.to_workshop_id);
    if (!from || !to) throw new Api1CError("validation", "Неизвестный цех", 400);

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
      lines: doc.lines.map((l) => ({
        ...l,
        name: PRODUCTS.find((p) => p.id === l.item_id)?.name ?? MATERIALS.find((m) => m.id === l.item_id)?.name,
        unit: PRODUCTS.find((p) => p.id === l.item_id)?.unit ?? MATERIALS.find((m) => m.id === l.item_id)?.unit,
      })),
    };
    transfers.set(transfer.id, transfer);
    idempotency.set(idempotencyKey, transfer);
    return structuredClone(transfer);
  }

  async updateTransfer(
    transferId: Id,
    patch: { comment?: string; lines: NewTransfer["lines"] },
    version?: string,
  ): Promise<Transfer> {
    await this.wait();
    const doc = await this.getTransfer(transferId);
    const live = transfers.get(transferId)!;
    if (live.status === "posted") throw new Api1CError("state", "Документ проведён, правка запрещена", 409);
    checkVersion(live.version, version, doc);
    this.checkAvailable(live.from.workshop_id, patch.lines, transferId);

    live.lines = patch.lines.map((l) => ({
      ...l,
      name: PRODUCTS.find((p) => p.id === l.item_id)?.name ?? MATERIALS.find((m) => m.id === l.item_id)?.name,
      unit: PRODUCTS.find((p) => p.id === l.item_id)?.unit ?? MATERIALS.find((m) => m.id === l.item_id)?.unit,
    }));
    if (patch.comment !== undefined) live.comment = patch.comment;
    // Правка любой стороной сбрасывает оба подтверждения.
    live.sender_confirmed = null;
    live.receiver_confirmed = null;
    live.version = bump(live.version);
    return structuredClone(live);
  }

  async confirmTransfer(transferId: Id, opts: { version?: string; side?: ConfirmSide } = {}): Promise<Transfer> {
    await this.wait();
    const live = transfers.get(transferId);
    if (!live) throw new Api1CError("not_found", "Перемещение не найдено", 404);
    checkVersion(live.version, opts.version, structuredClone(live));

    const side: ConfirmSide = opts.side ?? (live.sender_confirmed ? "receiver" : "sender");
    const mark = { by: this.opts.userName, at: now() };
    if (side === "sender") live.sender_confirmed = mark;
    else live.receiver_confirmed = mark;

    if (live.sender_confirmed && live.receiver_confirmed) {
      // Оба подтверждения: 1С проводит документ, остаток уходит получателю.
      this.checkAvailable(live.from.workshop_id, live.lines, transferId);
      for (const line of live.lines) {
        stock[live.from.workshop_id][line.item_id] -= line.qty;
        stock[live.to.workshop_id][line.item_id] = (stock[live.to.workshop_id][line.item_id] ?? 0) + line.qty;
      }
      live.status = "posted";
    }
    live.version = bump(live.version);
    return structuredClone(live);
  }

  async deleteTransfer(transferId: Id) {
    await this.wait();
    const live = transfers.get(transferId);
    if (!live) throw new Api1CError("not_found", "Перемещение не найдено", 404);
    if (live.status === "posted") throw new Api1CError("state", "Проведённый документ удалить нельзя", 409);
    transfers.delete(transferId);
    return { ok: true as const };
  }
}
