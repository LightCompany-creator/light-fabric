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
import { createTransferAction, type FormState } from "../actions";

const INITIAL: FormState = { error: null };

type Workshop = { id: string; code: string; name: string };

export function CreateTransferForm({
  workshops,
  defaultFromId,
  today,
}: {
  workshops: Workshop[];
  defaultFromId: string | null;
  today: string;
}) {
  const [state, action] = useFormState(createTransferAction, INITIAL);

  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Документ перемещения</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="from_workshop_id">Откуда (отправитель)</Label>
            <Select name="from_workshop_id" defaultValue={defaultFromId ?? ""}>
              <SelectTrigger id="from_workshop_id">
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
            <Label htmlFor="to_workshop_id">Куда (получатель)</Label>
            <Select name="to_workshop_id">
              <SelectTrigger id="to_workshop_id">
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
            <Label htmlFor="transfer_date">Дата</Label>
            <Input
              id="transfer_date"
              name="transfer_date"
              type="date"
              defaultValue={today}
            />
          </div>

          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor="comment">Комментарий (необязательно)</Label>
            <Input id="comment" name="comment" placeholder="Например: размерный ряд 36-41" />
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
      Создать документ
    </Button>
  );
}