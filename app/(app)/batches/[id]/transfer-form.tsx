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
import { transferBatchAction, type FormState } from "../actions";

const INITIAL: FormState = { error: null };

type Workshop = { id: string; code: string; name: string };

export function TransferBatchForm({
  batchId,
  workshops,
  suggestedWorkshopId,
  defaultQty,
}: {
  batchId: string;
  workshops: Workshop[];
  suggestedWorkshopId: string | null;
  defaultQty: number;
}) {
  const [state, action] = useFormState(transferBatchAction, INITIAL);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Передать дальше</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
          <input type="hidden" name="batch_id" value={batchId} />
          <div className="sm:col-span-4">
            <Label htmlFor="to_workshop_id">В цех</Label>
            <Select name="to_workshop_id" defaultValue={suggestedWorkshopId ?? ""}>
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
          <div className="sm:col-span-2">
            <Label htmlFor="qty_out">Передаём, пар</Label>
            <Input
              id="qty_out"
              name="qty_out"
              type="number"
              min={1}
              defaultValue={defaultQty}
              required
            />
          </div>
          <div className="sm:col-span-4">
            <Label htmlFor="notes-transfer">Заметка</Label>
            <Input id="notes-transfer" name="notes" placeholder="опционально" />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton label="Передать" />
          </div>
          {state.error ? (
            <p className="sm:col-span-12 text-sm text-destructive">{state.error}</p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      {label}
    </Button>
  );
}
