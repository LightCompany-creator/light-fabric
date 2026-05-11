import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { DeleteNormButton } from "./delete-button";

type NormRow = Tables<"norms"> & {
  article: Pick<Tables<"articles">, "code" | "name"> | null;
  material: Pick<Tables<"materials">, "code" | "name" | "unit"> | null;
};

export default async function NormsPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("norms")
    .select(
      "*, article:articles(code, name), material:materials(code, name, unit)",
    );
  let norms = (data ?? []) as NormRow[];

  if (searchParams.q) {
    const q = searchParams.q.trim().toLowerCase();
    norms = norms.filter(
      (n) =>
        n.article?.code.toLowerCase().includes(q) ||
        n.article?.name.toLowerCase().includes(q) ||
        n.material?.code.toLowerCase().includes(q) ||
        n.material?.name.toLowerCase().includes(q),
    );
  }
  norms.sort((a, b) =>
    (a.article?.code ?? "").localeCompare(b.article?.code ?? ""),
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Нормы расхода"
        description="Расход материалов на одну пару продукции по артикулам"
        actions={
          <Button asChild>
            <Link href="/catalog/norms/new">
              <Plus className="mr-2 h-4 w-4" />
              Добавить
            </Link>
          </Button>
        }
      />

      <Card className="p-4">
        <form className="flex gap-3">
          <Input
            name="q"
            placeholder="Поиск по артикулу или материалу"
            defaultValue={searchParams.q ?? ""}
          />
          <Button type="submit" variant="secondary">Найти</Button>
          <Button variant="ghost" asChild>
            <Link href="/catalog/norms">Сбросить</Link>
          </Button>
        </form>
      </Card>

      {error ? (
        <p className="text-sm text-destructive">
          Не удалось загрузить нормы: {error.message}
        </p>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Артикул</TableHead>
                <TableHead>Название</TableHead>
                <TableHead className="w-32">Материал</TableHead>
                <TableHead>Материал название</TableHead>
                <TableHead className="w-32 text-right">Расход на пару</TableHead>
                <TableHead>Примечание</TableHead>
                <TableHead className="w-24 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {norms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Норм пока нет
                  </TableCell>
                </TableRow>
              ) : (
                norms.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-mono font-medium">
                      {n.article?.code ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {n.article?.name ?? "—"}
                    </TableCell>
                    <TableCell className="font-mono">
                      {n.material?.code ?? "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {n.material?.name ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono-tabular">
                      {Number(n.qty_per_pair).toLocaleString("ru-RU", {
                        maximumFractionDigits: 4,
                      })}{" "}
                      <span className="text-xs text-muted-foreground">
                        {n.material?.unit}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {n.notes ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" title="Редактировать">
                          <Link href={`/catalog/norms/${n.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteNormButton id={n.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
