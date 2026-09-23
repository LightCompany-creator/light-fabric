// Типы обмена с 1С по контракту «Контракт обмена 1С ↔ LightFabric. Этап 1», v0.1.
// Имена полей повторяют контракт один в один, чтобы ответы 1С ложились без переименований.
// Оригинал: 1С-Арсену/Контракт_1С_LightFabric_этап1.md

/** GUID ссылки 1С, например "c9ab8ae1-c8b6-11e9-ba09-d48564791284". */
export type Id = string;
/** Дата в формате "2026-09-13". */
export type IsoDate = string;
/** Дата и время в формате "2026-09-13T14:30:00", местное время сервера, без зоны. */
export type IsoDateTime = string;

// ---------- ошибки ----------

export type ApiErrorCode =
  | "validation"
  | "forbidden"
  | "not_found"
  | "conflict"
  | "state"
  | "insufficient_stock"
  | "period_closed"
  | "posting_failed"
  | "internal";

/** Позиция, которой не хватило на складе (details при insufficient_stock). */
export type StockShortage = {
  item_id: Id;
  item_name: string;
  available: number;
  required: number;
};

export type ApiErrorBody = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    /** При insufficient_stock — список позиций, при conflict — { current }. */
    details?: StockShortage[] | Record<string, unknown>;
  };
};

// ---------- справочники ----------

export type WarehouseRef = { id: Id; name: string };

export type WorkshopRef = {
  id: Id;
  code: string;
  name: string;
  warehouse: WarehouseRef;
};

export type Me = {
  ok: true;
  user: { id: Id; name: string };
  is_admin: boolean;
  workshops: WorkshopRef[];
};

export type Employee1C = {
  id: Id;
  code: string;
  name: string;
  position: string;
  default_work_type_id: Id | null;
};

export type WorkType = {
  id: Id;
  code: string;
  name: string;
  /** Единица вида работ: «пар», «ч» и т.п. */
  unit: string;
  /** Признак вида работ «Простой»: количество вводится в часах, продукция не нужна. */
  is_downtime: boolean;
};

export type SpecLine = { item_id: Id; qty_per_unit: number };

export type Product1C = {
  id: Id;
  code: string;
  article: string;
  name: string;
  unit: string;
  /** Основная спецификация на единицу: для подсказки материалов. */
  spec: SpecLine[];
};

export type Material1C = { id: Id; code: string; name: string; unit: string };

export type StockLine = {
  item_id: Id;
  name?: string;
  unit?: string;
  /** Учётный остаток склада цеха. */
  qty: number;
  /** Занято в неподтверждённых исходящих перемещениях. */
  reserved: number;
  /** qty − reserved: сколько реально можно передать или списать. */
  available: number;
};

export type WorkshopContext = {
  ok: true;
  workshop: WorkshopRef;
  organization: { id: Id; name: string };
  employees: Employee1C[];
  work_types: WorkType[];
  products: Product1C[];
  materials: Material1C[];
  stock: StockLine[];
  open_shifts: ShiftHead[];
  transfer_targets: WorkshopRef[];
  pending_incoming_transfers: number;
};

// ---------- смены ----------

export type ShiftStatus = "open" | "closed";

export type ShiftHead = {
  id: Id;
  number: string;
  date: IsoDate;
  /** 1 или 2: в интерфейсе «1 смена» (день) и «2 смена» (ночь). */
  shift_no: 1 | 2;
  status: ShiftStatus;
  version: string;
  responsible?: string;
  produced_total?: number;
  defect_total?: number;
  closed_at?: IsoDateTime | null;
};

/** Состав смены: кто вышел. */
export type ShiftWorker = { employee_id: Id; work_type_id?: Id | null };

/** Строка сделки: одна строка — одно начисление. */
export type ShiftOutput = {
  employee_id: Id;
  work_type_id: Id;
  /** null только для видов работ с is_downtime. */
  product_id: Id | null;
  /** Количество в единице вида работ, для простоя — часы. */
  qty: number;
  defect_qty: number;
  machine?: string;
  /** Сюда уходит то, что 1С не использует: вес, число форм литья. */
  note?: string;
};

/** Итог выпуска по продукции: вводит начальник цеха, приложение только подсказывает. */
export type ShiftProduct = { product_id: Id; qty: number; defect_qty: number };

/** Материалы по факту. Пустой список = 1С спишет по спецификации при закрытии. */
export type ShiftMaterial = { item_id: Id; qty: number };

/** Тело PUT /shifts/{id}: полное состояние документа. */
export type ShiftState = {
  comment: string;
  /** Резерв под задание на смену, этап 2. */
  task_id: Id | null;
  workers: ShiftWorker[];
  outputs: ShiftOutput[];
  products: ShiftProduct[];
  materials: ShiftMaterial[];
};

export type ProductionReportRef = { id: Id; number: string; date: IsoDate };

export type Shift = ShiftHead &
  ShiftState & {
    created_at?: IsoDateTime;
    /** Номер созданного отчёта производства за смену, если смена закрыта. */
    production_report?: ProductionReportRef | null;
  };

// ---------- перемещения ----------

export type TransferStatus = "open" | "posted";

export type ConfirmMark = { by: string; at: IsoDateTime } | null;

export type TransferLine = {
  item_id: Id;
  name?: string;
  unit?: string;
  qty: number;
};

export type TransferHead = {
  id: Id;
  number: string;
  date: IsoDateTime;
  from: { workshop_id: Id; name: string };
  to: { workshop_id: Id; name: string };
  status: TransferStatus;
  sender_confirmed: ConfirmMark;
  receiver_confirmed: ConfirmMark;
  lines_count?: number;
  qty_total?: number;
  version: string;
};

export type Transfer = TransferHead & { comment: string; lines: TransferLine[] };

// ---------- параметры запросов ----------

export type ShiftsQuery = {
  workshop: Id;
  from?: IsoDate;
  to?: IsoDate;
  status?: ShiftStatus | "all";
  page?: number;
  page_size?: number;
};

export type TransfersQuery = {
  workshop: Id;
  direction?: "in" | "out" | "all";
  status?: TransferStatus | "all";
  from?: IsoDate;
  to?: IsoDate;
  page?: number;
  page_size?: number;
};

export type Page<T> = {
  ok: true;
  total: number;
  page: number;
  page_size: number;
  items: T[];
};

export type NewTransfer = {
  from_workshop_id: Id;
  to_workshop_id: Id;
  date: IsoDate;
  comment?: string;
  lines: Pick<TransferLine, "item_id" | "qty">[];
};

/** Сторона подтверждения: обязательна, если пользователь отвечает за оба склада. */
export type ConfirmSide = "sender" | "receiver";
