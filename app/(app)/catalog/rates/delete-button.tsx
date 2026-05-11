"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteRateAction } from "./actions";

export function DeleteRateButton({ id }: { id: string }) {
  return (
    <form
      action={deleteRateAction}
      onSubmit={(e) => {
        if (!confirm("Удалить эту расценку?")) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        title="Удалить"
        className="text-destructive hover:bg-destructive/10"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </form>
  );
}
