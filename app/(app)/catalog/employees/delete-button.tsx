"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteEmployeeAction } from "./actions";

export function DeleteEmployeeButton({
  id,
  name,
}: {
  id: string;
  name: string;
}) {
  return (
    <form
      action={deleteEmployeeAction}
      onSubmit={(e) => {
        if (!confirm(`Удалить ${name}? Это действие нельзя отменить.`)) {
          e.preventDefault();
        }
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
