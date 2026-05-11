"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Loader2, FileCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPayrollLinesAction, type FormState } from "./actions";

const INITIAL: FormState = { error: null };

export function GeneratePayrollButton({
  from,
  to,
  period,
}: {
  from: string;
  to: string;
  period: string;
}) {
  const [state, action] = useFormState(createPayrollLinesAction, INITIAL);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="from" value={from} />
      <input type="hidden" name="to" value={to} />
      <input type="hidden" name="period" value={period} />
      <SubmitButton />
      {state.error ? (
        <p className="text-sm text-destructive">{state.error}</p>
      ) : null}
      {typeof state.ok === "number" ? (
        <p className="text-sm text-success">
          Сохранено строк ведомости: {state.ok}
        </p>
      ) : null}
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} variant="secondary">
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <FileCheck className="mr-2 h-4 w-4" />
      )}
      Сохранить ведомость в БД
    </Button>
  );
}
