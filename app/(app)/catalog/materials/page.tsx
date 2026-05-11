import Link from "next/link";
import { AlertTriangle, Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteMaterialButton } from "./delete-button";

export default async function MaterialsPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("materials")
    .select("*")
    .order("name");
  const materials = (data ?? []) as Tables<"materials">[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Материалы и сырьё"
        description="Складской учёт ведётся в 1С, здесь — нормативно-справочная информация"
        actions={
          <Button asChild>
            <Link href="/catalog/materials/new">
              <Plus className="mr-2 h-4 w-4" />
              Добавить
            </Link>
          </Button>
        }
      />

      {error ? (
        <p className="text-sm text-destructive">
          Не удалось загрузить материалы: {error.message}
        </p>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Код</TableHead>
                <TableHead>Название</TableHead>
                <TableHead className="w-20">Ед.</TableHead>
                <TableHead className="w-32 text-right">Остаток</TableHead>
                <TableHead className="w-32 text-right">Мин.</TableHead>
                <TableHead className="w-24"></TableHead>
                <TableHead className="w-24 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Материалов пока нет
                  </TableCell>
                </TableRow>
              ) : (
                materials.map((m) => {
                  const low = Number(m.current_stock) < Number(m.min_stock);
                  return (
                    <TableRow key={m.id} className={m.is_active ? "" : "opacity-50"}>
                      <TableCell className="font-mono">{m.code}</TableCell>
                      <TableCell>{m.name}</TableCell>
                      <TableCell>{m.unit}</TableCell>
                      <TableCell
                        className={
                          "text-right font-mono-tabular " +
                          (low ? "text-destructive font-medium" : "text-foreground")
                        }
                      >
                        {Number(m.current_stock).toLocaleString("ru-RU", {
                          maximumFractionDigits: 3,
                        })}
                      </TableCell>
                      <TableCell className="text-right font-mono-tabular text-muted-foreground">
                        {Number(m.min_stock).toLocaleString("ru-RU", {
                          maximumFractionDigits: 3,
                        })}
                      </TableCell>
                      <TableCell>
                        {low ? (
                          <span className="inline-flex items-center gap-1 text-xs text-destructive">
                            <AlertTriangle className="h-3 w-3" /> ниже минимума
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" title="Редактировать">
                            <Link href={`/catalog/materials/${m.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DeleteMaterialButton id={m.id} code={m.code} />
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
