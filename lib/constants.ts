// Доменные константы LightFabric.
// Лейблы и цвета берём отсюда, чтобы не дублировать русские строки в компонентах.

export const WORKSHOP_CODES = [
  "ANG",
  "LIT",
  "PACK",
  "CUT",
  "SEW",
  "GLU",
  "ASSY",
  "MARK",
  "SHIP",
  "ADM",
  "LST",
] as const;

export type WorkshopCode = (typeof WORKSHOP_CODES)[number];

export const WORKSHOP_LABELS: Record<WorkshopCode, string> = {
  ANG: "Ангар",
  LIT: "Литейка",
  PACK: "Упаковка",
  CUT: "Крой",
  SEW: "Швейка",
  GLU: "Клеевой",
  ASSY: "Обшив",
  MARK: "Маркировка",
  SHIP: "Склад",
  ADM: "Администрация",
  LST: "Листы",
};

// Соответствие CSS-переменным из app/globals.css.
export const WORKSHOP_COLOR_VARS: Record<WorkshopCode, string> = {
  ANG: "var(--ws-ang)",
  LIT: "var(--ws-lit)",
  PACK: "var(--ws-pack)",
  CUT: "var(--ws-cut)",
  SEW: "var(--ws-sew)",
  GLU: "var(--ws-glu)",
  ASSY: "var(--ws-assy)",
  MARK: "var(--ws-mark)",
  SHIP: "var(--ws-ship)",
  ADM: "var(--ws-adm)",
  LST: "var(--ws-lst)",
};

export const SHIFT_TYPE_LABELS = { день: "Дневная", ночь: "Ночная" } as const;

// Станки литейного цеха (фиксированный список — селект в форме выработки).
export const MACHINE_OPTIONS = [
  "KCLKA 1",
  "KCLKA 2",
  "KCLKA 3",
  "Четвёрка",
  "Шестёрка",
  "Восьмёрка",
] as const;

export type MachineCode = (typeof MACHINE_OPTIONS)[number];

// Вид отливки — сколько форм в одном цикле литья.
export const CAST_FORMS_OPTIONS = [4, 6] as const;

export type CastForms = (typeof CAST_FORMS_OPTIONS)[number];

export const USER_ROLE_LABELS = {
  foreman: "Начальник цеха",
  technologist: "Технолог",
  director: "Директор",
  accountant: "Бухгалтер",
  admin: "Администратор",
  production_manager: "Начальник производства",
  commercial_director: "Коммерческий директор",
} as const;

export type UserRole = keyof typeof USER_ROLE_LABELS;

// Направления продукции — соответствуют каталогу на light-c.shop.
// См. таблицу product_lines в Supabase. parent_id зарезервирован под
// будущие подгруппы внутри «Обувь» (Галоши/Сабо/Сапоги/Туфли).
export const PRODUCT_LINE_CODES = [
  "SHOES",
  "EVA_SHEETS",
  "MATS",
  "CAR_COVERS",
  "STRAPS",
  "TAPES",
] as const;

export type ProductLineCode = (typeof PRODUCT_LINE_CODES)[number];

export const PRODUCT_LINE_LABELS: Record<ProductLineCode, string> = {
  SHOES: "Обувь из ЭВА",
  EVA_SHEETS: "ЭВА-листы",
  MATS: "Придверные коврики",
  CAR_COVERS: "Автонакидки",
  STRAPS: "Стропа",
  TAPES: "Тесьма",
};

// Все направления сейчас плоские (нет родительских узлов).
export const PRODUCT_LINE_PARENT: Record<ProductLineCode, ProductLineCode | null> = {
  SHOES: null,
  EVA_SHEETS: null,
  MATS: null,
  CAR_COVERS: null,
  STRAPS: null,
  TAPES: null,
};
