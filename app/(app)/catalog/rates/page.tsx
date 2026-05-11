import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteRateButton } from "./delete-button";

type RateRow = Tables<"rates"> & {
  workshop: Pick<Tables<"workshops">, "code" | "name"> | null;
  article: Pick<Tables<"articles">, "code" | "name"> | null;
};

function formatDate(d: string | null) {
  if (!d) return "—";
  try {
    return format(parseISO(d), "d MMM yyyy", { locale: ru });
  } catch {
    return d;
  }
}

export default async function RatesPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("rates")
    .select(
      "*, workshop:workshops(code, name), article:articles(code, name)",
    )
    .order("valid_from", { ascending: false });
  const rates = (data ?? []) as RateRow[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Расценки"
        description="Сдельные расценки по цехам и артикулам — основа расчёта зарплаты"
        actions={
          <Button asChild>
            <Link href="/catalog/rates/new">
              <Plus className="mr-2 h-4 w-4" />
              Добавить
            </Link>
          </Button>
        }
      />

      {error ? (
        <p className="text-sm text-destructive">
          Не удалось загрузить расценки: {error.message}
        </p>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Цех</TableHead>
                <TableHead>Артикул</TableHead>
                <TableHead>Операция</TableHead>
                <TableHead className="w-32 text-right">Расценка</TableHead>
                <TableHead className="w-32">С</TableHead>
                <TableHead className="w-32">По</TableHead>
                <TableHead className="w-24"></TableHead>
                <TableHead className="w-24 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Расценок пока нет
                  </TableCell>
                </TableRow>
              ) : (
                rates.map((r) => {
                  const isCurrent = r.valid_to === null;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono">
                        {r.workshop ? `${r.workshop.code}` : "—"}
                      </TableCell>
                      <TableCell>
                        {r.article ? (
                          <span className="font-mono">
                            {r.article.code}
                            <span className="ml-2 text-muted-foreground">
                              {r.article.name}
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">общая</span>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {r.operation ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-mono-tabular font-medium">
                        {Number(r.rate_per_unit).toFixed(2)}{" "}
                        <span className="text-xs text-muted-foreground">
                          / {r.unit_type}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(r.valid_from)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(r.valid_to)}
                      </TableCell>
                      <TableCell>
                        {isCurrent ? (
                          <Badge variant="secondary" className="bg-success/10 text-success">
                            действует
                          </Badge>
                        ) : (
                          <Badge variant="outline">архив</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="icon" title="Редактировать">
                            <Link href={`/catalog/rates/${r.id}`}>
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <DeleteRateButton id={r.id} />
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
