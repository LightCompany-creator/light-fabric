// Склады участка (контракт v0.4): у каждого участка склад материалов, с него
// списываются материалы смены, и склад продукции, на него приходит выпуск.
// Остатки приходят одним списком по обоим складам, одна позиция может прийти
// двумя строками. Если 1С ещё на v0.2, складов в ответе нет, и все функции
// здесь ведут себя как раньше: один склад, все строки остатка его.

import type { Id, StockLine, WarehouseRole, WorkshopRef } from "./types";

/** Склад с ролями после склейки: при одном складе на всё обе роли у одной записи. */
export type WarehouseView = { id: Id; name: string; code?: string; roles: WarehouseRole[] };

/** Склады участка без повторов. Первым склад продукции, за ним материалы. */
export function warehousesOf(workshop: WorkshopRef): WarehouseView[] {
  const list = workshop.warehouses?.length ? workshop.warehouses : [workshop.warehouse];
  const views: WarehouseView[] = [];
  for (const w of list) {
    const found = views.find((v) => v.id === w.id);
    if (found) {
      if (w.role && !found.roles.includes(w.role)) found.roles.push(w.role);
    } else {
      views.push({ id: w.id, name: w.name, code: w.code, roles: w.role ? [w.role] : [] });
    }
  }
  return views.sort((a, b) => Number(b.roles.includes("output")) - Number(a.roles.includes("output")));
}

function idsWithRole(workshop: WorkshopRef, role: WarehouseRole): Id[] {
  const withRole = (workshop.warehouses ?? []).filter((w) => w.role === role).map((w) => w.id);
  return withRole.length ? withRole : [workshop.warehouse.id];
}

/** Склад продукции: туда приходит выпуск и оттуда по умолчанию уходят передачи. */
export function outputWarehouseId(workshop: WorkshopRef): Id {
  return idsWithRole(workshop, "output")[0];
}

/** Склад материалов: с него списываются материалы смены, на него приходят передачи. */
export function materialsWarehouseId(workshop: WorkshopRef): Id {
  return idsWithRole(workshop, "materials")[0];
}

/**
 * Строки остатка на указанном складе. Строка без склада (1С на v0.2) считается
 * лежащей на любом складе участка: склад у такого участка один.
 */
export function stockOn(stock: StockLine[], warehouseId: Id): StockLine[] {
  return stock.filter((line) => !line.warehouse_id || line.warehouse_id === warehouseId);
}

/** Доступный остаток позиции на складе. */
export function availableOn(stock: StockLine[], warehouseId: Id, itemId: Id): number {
  return stockOn(stock, warehouseId)
    .filter((line) => line.item_id === itemId)
    .reduce((sum, line) => sum + line.available, 0);
}

/**
 * Участок с полными данными о складах. Склады приходят в /me, а контекст участка
 * может отдавать его без них, поэтому берём того, у кого список есть.
 */
export function withWarehouses(primary: WorkshopRef | null | undefined, fallback: WorkshopRef): WorkshopRef {
  if (primary && primary.id === fallback.id && primary.warehouses?.length) return primary;
  return fallback.warehouses?.length || !primary || primary.id !== fallback.id ? fallback : primary;
}

/** Подпись роли склада для экрана. */
export function rolesLabel(roles: WarehouseRole[]): string {
  if (roles.includes("output") && roles.includes("materials")) return "материалы и продукция";
  if (roles.includes("output")) return "продукция";
  if (roles.includes("materials")) return "материалы";
  return "";
}

