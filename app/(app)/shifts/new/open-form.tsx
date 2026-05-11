"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { openShiftAction, type FormState } from "../actions";

const INITIAL: FormState = { error: null };

type Workshop = { id: string; code: string; name: string };

export function OpenShiftForm({
  workshops,
  defaultWorkshopId,
  today,
}: {
  workshops: Workshop[];
  defaultWorkshopId: string | null;
  today: string;
}) {
  const [state, action] = useFormState(openShiftAction, INITIAL);

  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Открытие смены</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="workshop_id">Цех</Label>
            <Select name="workshop_id" defaultValue={defaultWorkshopId ?? ""}>
              <SelectTrigger id="workshop_id">
                <SelectValue placeholder="Выберите цех" />
              </SelectTrigger>
              <SelectContent>
                {workshops.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.code} · {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shift_date">Дата смены</Label>
            <Input id="shift_date" name="shift_date" type="date" defaultValue={today} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="shift_type">Тип смены</Label>
            <Select name="shift_type" defaultValue="день">
              <SelectTrigger id="shift_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="день">Дневная</SelectItem>
                <SelectItem value="ночь">Ночная</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Открыть смену
    </Button>
  );
}
