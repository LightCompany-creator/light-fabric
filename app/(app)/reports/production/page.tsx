import { Download } from "lucide-react";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getProductionReport } from "@/lib/services/reports";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export default async function ProductionReportPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const now = new Date();
  const from = searchParams.from ?? isoDate(startOfMonth(now));
  const to = searchParams.to ?? isoDate(endOfMonth(now));

  const supabase = createClient();
  const entries = await getProductionReport(supabase, from, to);

  const totalPairs = entries.reduce((s, e) => s + e.pairs, 0);
  const totalValue = entries.reduce((s, e) => s + e.valueRub, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Выпуск продукции"
        description={`Период ${format(parseISO(from), "d MMMM", { locale: ru })} — ${format(
          parseISO(to),
          "d MMMM yyyy",
          { locale: ru },
        )}`}
        actions={
          <Button asChild>
            <a href={`/api/export/production?from=${from}&to=${to}`}>
              <Download className="mr-2 h-4 w-4" />
              Скачать XLSX
            </a>
          </Button>
        }
      />

      <Card className="p-4">
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="space-y-1">
            <Label htmlFor="from">С даты</Label>
            <Input id="from" name="from" type="date" defaultValue={from} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="to">По дату</Label>
            <Input id="to" name="to" type="date" defaultValue={to} />
          </div>
          <div className="flex items-end">
            <Button type="submit" variant="secondary" className="w-full">
              Пересчитать
            </Button>
          </div>
        </form>
      </Card>

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            За выбранный период закрытых смен нет
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Summary label="Артикулов" value={entries.length.toString()} />
              <Summary label="Пар" value={totalPairs.toLocaleString("ru-RU")} />
              <Summary
                label="Сумма выпуска, ₽"
                value={totalValue.toLocaleString("ru-RU", {
                  maximumFractionDigits: 0,
                })}
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Код</TableHead>
                  <TableHead>Название</TableHead>
                  <TableHead className="w-24">Материал</TableHead>
                  <TableHead className="text-right">Пар</TableHead>
                  <TableHead className="text-right">Вес, кг</TableHead>
                  <TableHead className="text-right">Брак</TableHead>
                  <TableHead className="text-right">Сумма, ₽</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.articleId}>
                    <TableCell className="font-mono">{e.code}</TableCell>
                    <TableCell>{e.name}</TableCell>
                    <TableCell>{e.material}</TableCell>
                    <TableCell className="text-right font-mono-tabular">
                      {e.pairs.toLocaleString("ru-RU")}
                    </TableCell>
                    <TableCell className="text-right font-mono-tabular">
                      {e.weightKg.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono-tabular text-destructive">
                      {e.defect}
                    </TableCell>
                    <TableCell className="text-right font-mono-tabular">
                      {e.valueRub.toLocaleString("ru-RU", {
                        maximumFractionDigits: 0,
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono-tabular text-xl font-bold">{value}</p>
    </div>
  );
}
