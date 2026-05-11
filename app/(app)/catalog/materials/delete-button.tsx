"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteMaterialAction } from "./actions";

export function DeleteMaterialButton({
  id,
  code,
}: {
  id: string;
  code: string;
}) {
  return (
    <form
      action={deleteMaterialAction}
      onSubmit={(e) => {
        if (!confirm(`Удалить материал ${code}?`)) e.preventDefault();
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
