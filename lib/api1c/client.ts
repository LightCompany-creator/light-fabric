// Клиент HTTP-сервиса 1С (этап 1). Один класс на все маршруты контракта.
// Транспорт вынесен в fetchImpl, а авторизация в getAuthHeader: пока это Basic Auth
// пользователя 1С, но если запросы пойдут через прокси, меняется только это место.

import type { Api1C } from "./api";
import type {
  ApiErrorBody,
  ApiErrorCode,
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
} from "./types";

/** Ошибка от 1С: код и готовый к показу русский текст (кроме internal). */
export class Api1CError extends Error {
  readonly code: ApiErrorCode;
  readonly httpStatus: number;
  readonly details?: unknown;

  constructor(code: ApiErrorCode, message: string, httpStatus: number, details?: unknown) {
    super(message);
    this.name = "Api1CError";
    this.code = code;
    this.httpStatus = httpStatus;
    this.details = details;
  }

  /** Можно ли показать message пользователю как есть. */
  get isUserFacing(): boolean {
    return this.code !== "internal";
  }
}

/** Сеть недоступна: планшет офлайн или сервис не отвечает. Повод встать в очередь. */
export class Api1COfflineError extends Error {
  readonly reason?: unknown;

  constructor(reason?: unknown) {
    super("Нет связи с 1С");
    this.name = "Api1COfflineError";
    this.reason = reason;
  }
}

export type Api1CConfig = {
  /** Базовый URL сервиса, например https://<сервер>/<база>/hs/lf/v1 */
  baseUrl: string;
  /** Заголовок авторизации. Для Basic: "Basic " + base64(логин:пароль). */
  getAuthHeader: () => string | Promise<string>;
  fetchImpl?: typeof fetch;
  /** Таймаут одного запроса, мс. */
  timeoutMs?: number;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
  /** Версия документа для проверки конфликта (If-Match). */
  version?: string;
  /** Ключ идемпотентности для POST, который создаёт или проводит документ. */
  idempotencyKey?: string;
  query?: Record<string, string | number | undefined>;
};

export function basicAuthHeader(login: string, password: string): string {
  const raw = `${login}:${password}`;
  const encoded =
    typeof btoa === "function"
      ? btoa(unescape(encodeURIComponent(raw)))
      : Buffer.from(raw, "utf8").toString("base64");
  return `Basic ${encoded}`;
}

export class Api1CClient implements Api1C {
  private readonly config: Api1CConfig;

  constructor(config: Api1CConfig) {
    this.config = config;
  }

  // ---------- базовый запрос ----------

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, version, idempotencyKey, query } = options;
    const url = new URL(this.config.baseUrl.replace(/\/$/, "") + path);
    for (const [key, value] of Object.entries(query ?? {})) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
      Authorization: await this.config.getAuthHeader(),
    };
    if (body !== undefined) headers["Content-Type"] = "application/json; charset=utf-8";
    if (version) headers["If-Match"] = version;
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs ?? 30_000);

    let response: Response;
    try {
      response = await (this.config.fetchImpl ?? fetch)(url.toString(), {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (cause) {
      throw new Api1COfflineError(cause);
    } finally {
      clearTimeout(timeout);
    }

    const text = await response.text();
    const payload = text ? (JSON.parse(text) as unknown) : null;

    if (!response.ok) {
      const err = (payload as ApiErrorBody | null)?.error;
      throw new Api1CError(
        err?.code ?? (response.status === 401 ? "forbidden" : "internal"),
        err?.message ?? `Ошибка обмена с 1С (${response.status})`,
        response.status,
        err?.details,
      );
    }

    return payload as T;
  }

  // ---------- служебное ----------

  ping() {
    return this.request<{ ok: true; api: string; config: string; server_time: string }>("/ping");
  }

  me() {
    return this.request<Me>("/me");
  }

  // ---------- цех ----------

  /** Всё для работы смены одним запросом: справочники, остатки, открытые смены. */
  workshopContext(workshopId: Id, date?: string) {
    return this.request<WorkshopContext>(`/workshops/${workshopId}/context`, { query: { date } });
  }

  async workshopStock(workshopId: Id): Promise<StockLine[]> {
    const res = await this.request<{ ok: true; as_of: string; stock: StockLine[] }>(
      `/workshops/${workshopId}/stock`,
    );
    return res.stock;
  }

  // ---------- смены ----------

  listShifts(query: ShiftsQuery) {
    return this.request<Page<ShiftHead>>("/shifts", { query: { ...query } });
  }

  getShift(shiftId: Id) {
    return this.request<Shift>(`/shifts/${shiftId}`);
  }

  /** Открыть смену. Идемпотентно по ключу (цех, дата, номер смены). */
  async openShift(workshopId: Id, date: string, shiftNo: 1 | 2): Promise<Shift> {
    const res = await this.request<{ ok: true; shift: Shift }>("/shifts", {
      method: "POST",
      body: { workshop_id: workshopId, date, shift_no: shiftNo },
    });
    return res.shift;
  }

  /** Сохранить состояние смены целиком. Повтор запроса безопасен. */
  async saveShift(shiftId: Id, state: ShiftState, version?: string): Promise<string> {
    const res = await this.request<{ ok: true; version: string }>(`/shifts/${shiftId}`, {
      method: "PUT",
      body: state,
      version,
    });
    return res.version;
  }

  /** Закрыть смену: 1С проводит отчёт производства. При отказе смена остаётся open. */
  closeShift(shiftId: Id, opts: { version?: string; idempotencyKey: string; comment?: string }) {
    return this.request<{ ok: true; shift: Shift; warnings?: string[] }>(`/shifts/${shiftId}/close`, {
      method: "POST",
      body: opts.comment ? { comment: opts.comment } : {},
      version: opts.version,
      idempotencyKey: opts.idempotencyKey,
    });
  }

  /** Переоткрыть закрытую смену. Только администратор. */
  reopenShift(shiftId: Id, reason: string) {
    return this.request<{ ok: true; shift: Shift }>(`/shifts/${shiftId}/reopen`, {
      method: "POST",
      body: { reason },
    });
  }

  // ---------- перемещения ----------

  listTransfers(query: TransfersQuery) {
    return this.request<Page<TransferHead>>("/transfers", { query: { ...query } });
  }

  getTransfer(transferId: Id) {
    return this.request<Transfer>(`/transfers/${transferId}`);
  }

  createTransfer(doc: NewTransfer, idempotencyKey: string) {
    return this.request<Transfer>("/transfers", { method: "POST", body: doc, idempotencyKey });
  }

  /** Правка строк любой стороной: сбрасывает оба подтверждения. */
  updateTransfer(
    transferId: Id,
    patch: { comment?: string; lines: NewTransfer["lines"] },
    version?: string,
  ) {
    return this.request<Transfer>(`/transfers/${transferId}`, {
      method: "PUT",
      body: patch,
      version,
    });
  }

  /** Подтвердить своей стороной. Когда подтвердили обе, 1С проводит документ. */
  confirmTransfer(transferId: Id, opts: { version?: string; side?: ConfirmSide } = {}) {
    return this.request<Transfer>(`/transfers/${transferId}/confirm`, {
      method: "POST",
      body: opts.side ? { side: opts.side } : {},
      version: opts.version,
    });
  }

  deleteTransfer(transferId: Id) {
    return this.request<{ ok: true }>(`/transfers/${transferId}`, { method: "DELETE" });
  }
}
