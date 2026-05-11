import { Download } from "lucide-react";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getMaterialsReport } from "@/lib/services/reports";
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

export default async function MaterialsReportPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const now = new Date();
  const from = searchParams.from ?? isoDate(startOfMonth(now));
  const to = searchParams.to ?? isoDate(endOfMonth(now));

  const supabase = createClient();
  const entries = await getMaterialsReport(supabase, from, to);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Расход материалов"
        description={`Период ${format(parseISO(from), "d MMMM", { locale: ru })} — ${format(
          parseISO(to),
          "d MMMM yyyy",
          { locale: ru },
        )}`}
        actions={
          <Button asChild>
            <a href={`/api/export/materials?from=${from}&to=${to}`}>
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
            За выбранный период расхода материалов нет
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">Код</TableHead>
                  <TableHead>Наименование</TableHead>
                  <TableHead className="w-16">Ед.</TableHead>
                  <TableHead className="text-right">Использовано</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.materialId}>
                    <TableCell className="font-mono">{e.code}</TableCell>
                    <TableCell>{e.name}</TableCell>
                    <TableCell>{e.unit}</TableCell>
                    <TableCell className="text-right font-mono-tabular">
                      {e.qtyUsed.toLocaleString("ru-RU", {
                        maximumFractionDigits: 3,
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
