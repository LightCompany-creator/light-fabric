// Replay-логика для отложенных мутаций.
// Для каждого типа мутации — функция, которая собирает FormData и вызывает
// соответствующий server action.

import type { QueuedMutation } from "./offline-queue";

type Replayer = (m: QueuedMutation) => Promise<void>;

function payloadToFormData(payload: Record<string, string | number | null>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(payload)) {
    if (v !== null && v !== undefined) fd.set(k, String(v));
  }
  return fd;
}

// addOutput — добавление записи выработки в смену
const replayAddOutput: Replayer = async (m) => {
  const { addOutputAction } = await import("@/app/(app)/shifts/actions");
  await addOutputAction(m.context.shiftId, payloadToFormData(m.payload));
};

// addWorker — добавление операции работнику.
// addWorkerOperationAction идемпотентно: каждый вызов читает текущие операции
// и аппендит одну. При повторной отправке offline-очереди дубликата не будет
// (если первая попытка вообще не дошла до БД) и не пропадёт (если дошла).
const replayAddWorker: Replayer = async (m) => {
  const { addWorkerOperationAction } = await import("@/app/(app)/shifts/actions");
  await addWorkerOperationAction(m.context.shiftId, payloadToFormData(m.payload));
};

export const REPLAYERS: Record<string, Replayer> = {
  addOutput: replayAddOutput,
  addWorker: replayAddWorker,
};
