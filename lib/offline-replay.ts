// Replay-логика для отложенных мутаций.
// Для каждого типа мутации — функция, которая собирает FormData и вызывает
// соответствующий server action.

import type { QueuedMutation } from "./offline-queue";

type Replayer = (m: QueuedMutation) => Promise<void>;

// addOutput — добавление записи выработки в смену
const replayAddOutput: Replayer = async (m) => {
  const { addOutputAction } = await import("@/app/(app)/shifts/actions");
  const fd = new FormData();
  for (const [k, v] of Object.entries(m.payload)) {
    if (v !== null && v !== undefined) fd.set(k, String(v));
  }
  await addOutputAction(m.context.shiftId, fd);
};

export const REPLAYERS: Record<string, Replayer> = {
  addOutput: replayAddOutput,
};
