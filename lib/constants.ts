// Доменные константы LightFlow.
// Лейблы и цвета берём отсюда, чтобы не дублировать русские строки в компонентах.

export const WORKSHOP_CODES = [
  "RAW",
  "LIT",
  "PACK",
  "CUT",
  "SEW",
  "GLU",
  "ASSY",
  "MARK",
  "SHIP",
] as const;

export type WorkshopCode = (typeof WORKSHOP_CODES)[number];

export const WORKSHOP_LABELS: Record<WorkshopCode, string> = {
  RAW: "Сырьё",
  LIT: "Литейка",
  PACK: "Упаковка",
  CUT: "Крой",
  SEW: "Швейка",
  GLU: "Клеевой",
  ASSY: "Обшив",
  MARK: "Маркировка",
  SHIP: "Склад",
};

// Соответствие CSS-переменным из app/globals.css.
export const WORKSHOP_COLOR_VARS: Record<WorkshopCode, string> = {
  RAW: "var(--ws-raw)",
  LIT: "var(--ws-lit)",
  PACK: "var(--ws-pack)",
  CUT: "var(--ws-cut)",
  SEW: "var(--ws-sew)",
  GLU: "var(--ws-glu)",
  ASSY: "var(--ws-assy)",
  MARK: "var(--ws-mark)",
  SHIP: "var(--ws-ship)",
};

export const ROUTE_SEQUENCES: Record<RouteType, WorkshopCode[]> = {
  simple: ["LIT", "PACK", "MARK", "SHIP"],
  medium: ["LIT", "PACK", "GLU", "ASSY", "MARK", "SHIP"],
  complex: ["LIT", "PACK", "CUT", "SEW", "GLU", "ASSY", "MARK", "SHIP"],
};

export type RouteType = "simple" | "medium" | "complex";

export const BATCH_STATUS_LABELS: Record<BatchStatus, string> = {
  created: "Создана",
  in_transit: "В пути",
  received: "Принята",
  in_work: "В работе",
  completed: "Готова",
  shipped: "Отгружена",
  rejected: "Брак",
};

export type BatchStatus =
  | "created"
  | "in_transit"
  | "received"
  | "in_work"
  | "completed"
  | "shipped"
  | "rejected";

export const SHIFT_TYPE_LABELS = { день: "Дневная", ночь: "Ночная" } as const;

export const USER_ROLE_LABELS = {
  foreman: "Бригадир",
  technologist: "Технолог",
  director: "Директор",
  accountant: "Бухгалтер",
  admin: "Администратор",
} as const;

export type UserRole = keyof typeof USER_ROLE_LABELS;

// Префикс для batch_number формата "ЦЕХ-ДДММГГ-NN" (раздел 10 контекста).
export const BATCH_NUMBER_PREFIX: Record<WorkshopCode, string> = {
  RAW: "СЫР",
  LIT: "ЛИТ",
  PACK: "УПК",
  CUT: "КРО",
  SEW: "ШВЕ",
  GLU: "КЛЕ",
  ASSY: "ОБШ",
  MARK: "МРК",
  SHIP: "СКЛ",
};
