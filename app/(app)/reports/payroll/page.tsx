import { Download } from "lucide-react";
import { endOfMonth, format, parseISO, startOfMonth } from "date-fns";
import { ru } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getPayrollByPeriod, type PayrollEntry } from "@/lib/services/reports";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { GeneratePayrollButton } from "./generate-button";

const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const ruRub = (n: number) =>
  n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default async function PayrollReportPage({
  searchParams,
}: {
  searchParams: { from?: string; to?: string };
}) {
  const now = new Date();
  const from = searchParams.from ?? isoDate(startOfMonth(now));
  const to = searchParams.to ?? isoDate(endOfMonth(now));
  const period = from.slice(0, 7);

  const supabase = createClient();
  const entries = await getPayrollByPeriod(supabase, from, to);

  // Группируем по цеху для подитогов
  const byWorkshop = new Map<string, { name: string; total: number; rows: PayrollEntry[] }>();
  for (const e of entries) {
    const cur =
      byWorkshop.get(e.workshopCode) ?? {
        name: e.workshopName,
        total: 0,
        rows: [] as PayrollEntry[],
      };
    cur.total += e.amount;
    cur.rows.push(e);
    byWorkshop.set(e.workshopCode, cur);
  }
  const grandTotal = entries.reduce((s, e) => s + e.amount, 0);

  const exportUrl = `/api/export/payroll?from=${from}&to=${to}&period=${period}`;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Ведомость зарплаты"
        description={`Период ${format(parseISO(from), "d MMMM", { locale: ru })} — ${format(
          parseISO(to),
          "d MMMM yyyy",
          { locale: ru },
        )}`}
        actions={
          <Button asChild>
            <a href={exportUrl}>
              <Download className="mr-2 h-4 w-4" />
              Скачать XLSX
            </a>
          </Button>
        }
      />

      <Card className="p-4">
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-4">
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
          <div className="flex items-end">
            <GeneratePayrollButton from={from} to={to} period={period} />
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
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Итого: {ruRub(grandTotal)} ₽</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Цех</TableHead>
                    <TableHead className="text-right">Работников</TableHead>
                    <TableHead className="text-right">Сумма, ₽</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.from(byWorkshop.entries()).map(([code, ws]) => (
                    <TableRow key={code}>
                      <TableCell className="font-medium">
                        {code} · {ws.name}
                      </TableCell>
                      <TableCell className="text-right font-mono-tabular">
                        {ws.rows.length}
                      </TableCell>
                      <TableCell className="text-right font-mono-tabular">
                        {ruRub(ws.total)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">По работникам</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Таб.№</TableHead>
                    <TableHead>ФИО</TableHead>
                    <TableHead className="w-32">Цех</TableHead>
                    <TableHead className="w-20 text-right">Смен</TableHead>
                    <TableHead className="w-32 text-right">Сумма, ₽</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={`${e.employeeId}-${e.workshopId}`}>
                      <TableCell className="font-mono">{e.tabNumber}</TableCell>
                      <TableCell>{e.fullName}</TableCell>
                      <TableCell>{e.workshopCode}</TableCell>
                      <TableCell className="text-right font-mono-tabular">
                        {e.shifts}
                      </TableCell>
                      <TableCell className="text-right font-mono-tabular font-medium">
                        {ruRub(e.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
