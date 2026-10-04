// Клиент HTTP-сервиса 1С (этап 1). Один класс на все маршруты контракта.
// Транспорт вынесен в fetchImpl, а авторизация в getAuthHeader: пока это Basic Auth
// пользователя 1С, но если запросы пойдут через прокси, меняется только это место.

import type { Api1C } from "./api";
import type {
  ApiErrorBody,
  ApiErrorCode,
  CloseShiftResult,
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

  /** Все нарушения ввода из details (1С отдаёт их разом), готовые к показу. */
  get validationMessages(): string[] {
    if (this.code !== "validation" || !Array.isArray(this.details)) return [];
    return (this.details as { message?: unknown }[])
      .map((d) => (typeof d?.message === "string" ? d.message : ""))
      .filter(Boolean);
  }
}

/**
 * Ошибки, которые отдаёт не сервис, а платформа 1С или веб-сервер: у них нет
 * JSON-тела (HTML от IIS, простой текст), поэтому разбираем по коду HTTP.
 */
function errorFromStatus(status: number): { code: ApiErrorCode; message: string } {
  if (status === 401) return { code: "forbidden", message: "Неверный логин или пароль 1С" };
  if (status === 403) return { code: "forbidden", message: "Недостаточно прав для этого действия" };
  if (status === 404) return { code: "not_found", message: "Не найдено в 1С" };
  return { code: "internal", message: `Ошибка обмена с 1С (${status})` };
}

/** Часть ответов приходит в обёртке { ok, <key>: документ }, часть документом как есть. */
function unwrap<T>(response: unknown, key: string): T {
  const wrapped = (response as Record<string, unknown> | null)?.[key];
  return (wrapped && typeof wrapped === "object" ? wrapped : response) as T;
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
  /**
   * Адрес сервиса. Полный (https://<сервер>/<база>/hs/lf/v1) или относительный
   * (/<база>/hs/lf/v1), когда приложение лежит на том же веб-сервере, что и 1С.
   */
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
  /** Ключ идемпотентности: по контракту v0.2 нужен только для POST /transfers. */
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
    // Относительный адрес сервиса разворачиваем от адреса самой страницы.
    const origin = typeof window === "undefined" ? "http://localhost" : window.location.origin;
    const url = new URL(this.config.baseUrl.replace(/\/$/, "") + path, origin);
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

    // Шлюз перед 1С (nginx, IIS) при недоступности сервиса отвечает 502/503/504,
    // и часто HTML-страницей, а не JSON. Для планшета это то же «нет связи».
    if (response.status === 502 || response.status === 503 || response.status === 504) {
      throw new Api1COfflineError(`HTTP ${response.status}`);
    }

    const text = await response.text();
    let payload: unknown = null;
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = null; // не JSON: разбираем ниже по статусу, не падаем на парсере
      }
    }

    if (!response.ok) {
      const err = (payload as ApiErrorBody | null)?.error;
      const fallback = errorFromStatus(response.status);
      throw new Api1CError(
        err?.code ?? fallback.code,
        err?.message ?? fallback.message,
        response.status,
        err?.details,
      );
    }

    if (text && payload === null) {
      throw new Api1CError("internal", "1С вернула ответ не в формате JSON", response.status);
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

  async getShift(shiftId: Id): Promise<Shift> {
    return unwrap<Shift>(await this.request<unknown>(`/shifts/${shiftId}`), "shift");
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

  /**
   * Закрыть смену. 1С проверяет только ввод цеха и закрывает; отражение в учёте
   * идёт вторым шагом и приходит в блоке accounting. Тело пустое: комментарий
   * в close не обрабатывается, он уходит через saveShift.
   */
  closeShift(shiftId: Id, opts: { version?: string } = {}) {
    return this.request<CloseShiftResult>(`/shifts/${shiftId}/close`, {
      method: "POST",
      body: {},
      version: opts.version,
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

  async getTransfer(transferId: Id): Promise<Transfer> {
    return unwrap<Transfer>(await this.request<unknown>(`/transfers/${transferId}`), "transfer");
  }

  /**
   * Ключ создаётся до первой попытки и повторяется во всех повторах: по нему 1С
   * вернёт уже созданный документ вместо дубля, если ответ на первую попытку потерялся.
   */
  async createTransfer(doc: NewTransfer, idempotencyKey: string): Promise<Transfer> {
    return unwrap<Transfer>(
      await this.request<unknown>("/transfers", { method: "POST", body: doc, idempotencyKey }),
      "transfer",
    );
  }

  /** Правка строк любой стороной: сбрасывает оба подтверждения. */
  async updateTransfer(
    transferId: Id,
    patch: { comment?: string; lines: NewTransfer["lines"] },
    version?: string,
  ): Promise<Transfer> {
    return unwrap<Transfer>(
      await this.request<unknown>(`/transfers/${transferId}`, {
        method: "PUT",
        body: patch,
        version,
      }),
      "transfer",
    );
  }

  /** Подтвердить своей стороной. Когда подтвердили обе, 1С проводит документ. */
  async confirmTransfer(
    transferId: Id,
    opts: { version?: string; side?: ConfirmSide } = {},
  ): Promise<Transfer> {
    return unwrap<Transfer>(
      await this.request<unknown>(`/transfers/${transferId}/confirm`, {
        method: "POST",
        body: opts.side ? { side: opts.side } : {},
        version: opts.version,
      }),
      "transfer",
    );
  }

  deleteTransfer(transferId: Id) {
    return this.request<{ ok: true }>(`/transfers/${transferId}`, { method: "DELETE" });
  }
}
