"use client";

import { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useFormState, useFormStatus } from "react-dom";
import { GripVertical, Loader2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  WORKSHOP_CODES,
  WORKSHOP_COLOR_VARS,
  WORKSHOP_LABELS,
  type WorkshopCode,
} from "@/lib/constants";
import { saveRouteAction, type FormState } from "../actions";

const INITIAL: FormState = { error: null };

export function RouteEditor({
  articleId,
  initial,
}: {
  articleId: string;
  initial: WorkshopCode[];
}) {
  const [sequence, setSequence] = useState<WorkshopCode[]>(initial);
  const action = saveRouteAction.bind(null, articleId);
  const [state, formAction] = useFormState(action, INITIAL);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setSequence((s) => {
      const oldIdx = s.indexOf(active.id as WorkshopCode);
      const newIdx = s.indexOf(over.id as WorkshopCode);
      return arrayMove(s, oldIdx, newIdx);
    });
  }

  function removeAt(code: WorkshopCode) {
    setSequence((s) => s.filter((c) => c !== code));
  }

  function add(code: WorkshopCode) {
    setSequence((s) => (s.includes(code) ? s : [...s, code]));
  }

  const available = WORKSHOP_CODES.filter((c) => !sequence.includes(c));

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="sequence" value={JSON.stringify(sequence)} />

      <Card className="p-6">
        <p className="mb-3 text-sm font-medium">
          Маршрут партии — перетаскивайте цеха, чтобы изменить порядок:
        </p>
        {sequence.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Добавьте хотя бы один цех из палитры ниже
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sequence}
              strategy={horizontalListSortingStrategy}
            >
              <div className="flex flex-wrap items-center gap-2">
                {sequence.map((code, i) => (
                  <SortableChip
                    key={code}
                    code={code}
                    onRemove={() => removeAt(code)}
                    isLast={i === sequence.length - 1}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </Card>

      <Card className="p-6">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          Палитра доступных цехов — клик добавляет в конец маршрута:
        </p>
        <div className="flex flex-wrap gap-2">
          {available.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Все цеха уже в маршруте
            </p>
          ) : (
            available.map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => add(code)}
                className="flex items-center gap-1 rounded px-3 py-1.5 text-sm font-medium text-white shadow-sm transition hover:scale-105"
                style={{ backgroundColor: WORKSHOP_COLOR_VARS[code] }}
              >
                <Plus className="h-3 w-3" />
                {WORKSHOP_LABELS[code]}
              </button>
            ))
          )}
        </div>
      </Card>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-success">Маршрут сохранён</p> : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

function SortableChip({
  code,
  onRemove,
  isLast,
}: {
  code: WorkshopCode;
  onRemove: () => void;
  isLast: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: code });

  return (
    <div className="flex items-center gap-1">
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          backgroundColor: WORKSHOP_COLOR_VARS[code],
          opacity: isDragging ? 0.5 : 1,
        }}
        className="flex items-center gap-1.5 rounded px-2 py-1.5 text-sm font-medium text-white shadow-sm"
      >
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing"
          aria-label="Перетащить"
        >
          <GripVertical className="h-3 w-3 opacity-80" />
        </button>
        <span>{WORKSHOP_LABELS[code]}</span>
        <button
          type="button"
          onClick={onRemove}
          className="rounded hover:bg-white/20"
          aria-label="Убрать из маршрута"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      {!isLast ? <span className="text-muted-foreground">→</span> : null}
    </div>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Сохранить маршрут
    </Button>
  );
}
