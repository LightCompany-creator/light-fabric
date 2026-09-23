// Интерфейс обмена с 1С. Его реализуют боевой клиент (client.ts) и заглушка (mock.ts),
// поэтому экраны приложения не знают, работают они с настоящей 1С или с примерами
// из контракта. Пока сервис Арсена не опубликован, весь UI живёт на заглушке.

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
} from "./types";

export interface Api1C {
  ping(): Promise<{ ok: true; api: string; config: string; server_time: string }>;
  me(): Promise<Me>;

  workshopContext(workshopId: Id, date?: string): Promise<WorkshopContext>;
  workshopStock(workshopId: Id): Promise<StockLine[]>;

  listShifts(query: ShiftsQuery): Promise<Page<ShiftHead>>;
  getShift(shiftId: Id): Promise<Shift>;
  openShift(workshopId: Id, date: string, shiftNo: 1 | 2): Promise<Shift>;
  saveShift(shiftId: Id, state: ShiftState, version?: string): Promise<string>;
  closeShift(
    shiftId: Id,
    opts: { version?: string; idempotencyKey: string; comment?: string },
  ): Promise<{ ok: true; shift: Shift; warnings?: string[] }>;
  reopenShift(shiftId: Id, reason: string): Promise<{ ok: true; shift: Shift }>;

  listTransfers(query: TransfersQuery): Promise<Page<TransferHead>>;
  getTransfer(transferId: Id): Promise<Transfer>;
  createTransfer(doc: NewTransfer, idempotencyKey: string): Promise<Transfer>;
  updateTransfer(
    transferId: Id,
    patch: { comment?: string; lines: NewTransfer["lines"] },
    version?: string,
  ): Promise<Transfer>;
  confirmTransfer(
    transferId: Id,
    opts?: { version?: string; side?: ConfirmSide },
  ): Promise<Transfer>;
  deleteTransfer(transferId: Id): Promise<{ ok: true }>;
}
