"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteArticleAction } from "./actions";

export function DeleteArticleButton({ id, code }: { id: string; code: string }) {
  return (
    <form
      action={deleteArticleAction}
      onSubmit={(e) => {
        if (!confirm(`Удалить артикул ${code}? Это действие нельзя отменить.`)) {
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
