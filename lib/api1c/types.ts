// Типы обмена с 1С по контракту «Контракт обмена 1С ↔ LightFabric. Этап 1», v0.2.
// Имена полей повторяют контракт один в один, чтобы ответы 1С ложились без переименований.
// Оригинал: 1С-Арсену/Контракт_1С_LightFabric_этап1.md + Правки_контракта_v0.2.md

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

/** Одно нарушение в теле запроса (details при validation): 1С отдаёт их все сразу. */
export type ValidationDetail = {
  section?: string;
  row?: number;
  field?: string;
  message: string;
};

export type ApiErrorBody = {
  ok: false;
  error: {
    code: ApiErrorCode;
    message: string;
    /** validation: список нарушений; insufficient_stock: позиции; conflict: { current }. */
    details?: ValidationDetail[] | StockShortage[] | Record<string, unknown>;
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
  /**
   * Нужна ли продукция в строке выработки. Без продукции бывает не только простой:
   * чистка форм, погрузка, уборка. Такие строки 1С оплачивает отдельным документом.
   */
  requires_product: boolean;
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

/**
 * Отражение закрытой смены в учёте. Закрытие и учёт разделены: цех закрывает
 * смену всегда, если ввод корректен, а нехватку остатка, закрытый период
 * или отсутствие расценки утром разбирает бухгалтерия.
 */
export type AccountingStatus = "done" | "pending";

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
  /** Только у закрытых смен в списке истории. */
  accounting_status?: AccountingStatus | null;
};

/** Состав смены: кто вышел. */
export type ShiftWorker = { employee_id: Id; work_type_id?: Id | null };

/** Строка сделки: одна строка — одно начисление. */
export type ShiftOutput = {
  employee_id: Id;
  work_type_id: Id;
  /** null для видов работ, у которых requires_product = false. */
  product_id: Id | null;
  /** Количество в единице вида работ (unit), для простоя это часы. */
  qty: number;
  defect_qty: number;
  machine?: string;
  /** Сюда уходит то, что 1С не использует: вес, число форм литья. */
  note?: string;
};

/** Итог выпуска по продукции: вводит начальник цеха, приложение только подсказывает. */
export type ShiftProduct = { product_id: Id; qty: number; defect_qty: number };

/**
 * Материалы по факту, с привязкой к продукции смены (в 1С это обязательное поле).
 * Пустой список = 1С заполнит сама по спецификации, продукцию проставит тоже.
 */
export type ShiftMaterial = { item_id: Id; product_id: Id; qty: number };

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

export type DocumentRef = { id: Id; number: string; date: IsoDate };

export type ShiftAccounting = {
  status: AccountingStatus;
  /** Причина, по которой отражение не прошло. Текст 1С, годится для показа. */
  message: string;
  documents: {
    /** Отчёт производства за смену: строки выработки с продукцией. */
    production_report: DocumentRef | null;
    /** Начисление зарплаты за работы без продукции (простой, чистка форм). */
    payroll: DocumentRef | null;
  };
};

export type Shift = ShiftHead &
  ShiftState & {
    created_at?: IsoDateTime;
    /** Есть только у закрытой смены. */
    accounting?: ShiftAccounting | null;
  };

/** Ответ close: шапка приходит краткой, документ целиком отдаёт GET /shifts/{id}. */
export type CloseShiftResult = {
  ok: true;
  shift: Pick<Shift, "id" | "status" | "version"> & Partial<Shift>;
  accounting: ShiftAccounting;
  warnings?: string[];
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
