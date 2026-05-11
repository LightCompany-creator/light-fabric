"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { receiveBatchAction, type FormState } from "../actions";

const INITIAL: FormState = { error: null };

export function ReceiveBatchForm({
  batchId,
  defaultQty,
}: {
  batchId: string;
  defaultQty: number;
}) {
  const [state, action] = useFormState(receiveBatchAction, INITIAL);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Приёмка партии</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid grid-cols-1 gap-3 sm:grid-cols-12 sm:items-end">
          <input type="hidden" name="batch_id" value={batchId} />
          <div className="sm:col-span-3">
            <Label htmlFor="qty_in">Принято, пар</Label>
            <Input
              id="qty_in"
              name="qty_in"
              type="number"
              min={1}
              defaultValue={defaultQty}
              required
            />
          </div>
          <div className="sm:col-span-3">
            <Label htmlFor="defect_at_step">Брак при приёмке</Label>
            <Input
              id="defect_at_step"
              name="defect_at_step"
              type="number"
              min={0}
              defaultValue={0}
            />
          </div>
          <div className="sm:col-span-4">
            <Label htmlFor="notes-receive">Заметка</Label>
            <Input id="notes-receive" name="notes" placeholder="опционально" />
          </div>
          <div className="sm:col-span-2">
            <SubmitButton label="Принять" />
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
