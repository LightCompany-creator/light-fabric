"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createOrderAction, type FormState } from "../actions";

const INITIAL: FormState = { error: null };

export function CreateOrderForm({ today }: { today: string }) {
  const [state, action] = useFormState(createOrderAction, INITIAL);

  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Заказ</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="order_date">Дата заказа</Label>
            <Input id="order_date" name="order_date" type="date" defaultValue={today} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="due_date">Срок выполнения (необязательно)</Label>
            <Input id="due_date" name="due_date" type="date" />
          </div>

          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor="comment">Комментарий (необязательно)</Label>
            <Input id="comment" name="comment" placeholder="Например: номер заказа коммерческого отдела" />
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
      Создать заказ
    </Button>
  );
}
