import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
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

const SYNC_TYPE_LABELS: Record<string, string> = {
  import_employees: "Импорт работников",
  import_articles: "Импорт артикулов",
  export_payroll: "Экспорт ведомости",
  export_production: "Экспорт выпуска",
  export_materials: "Экспорт сырья",
};

const STATUS_VARIANTS: Record<
  string,
  "default" | "secondary" | "outline" | "destructive"
> = {
  success: "default",
  partial: "outline",
  error: "destructive",
};

export default async function SyncLogPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("sync_log")
    .select("*")
    .order("performed_at", { ascending: false })
    .limit(100);
  const rows = (data ?? []) as Tables<"sync_log">[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Журнал синхронизаций"
        description="Все импорты и экспорты с 1С, последние 100 записей"
      />
      {error ? (
        <p className="text-sm text-destructive">
          Не удалось загрузить журнал: {error.message}
        </p>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Когда</TableHead>
                <TableHead>Операция</TableHead>
                <TableHead className="w-28">Направление</TableHead>
                <TableHead className="w-28">Статус</TableHead>
                <TableHead className="w-24 text-right">Записей</TableHead>
                <TableHead className="w-24 text-right">Ошибок</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    Журнал пуст
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm">
                      {format(parseISO(r.performed_at), "d MMM yyyy, HH:mm", {
                        locale: ru,
                      })}
                    </TableCell>
                    <TableCell>
                      {SYNC_TYPE_LABELS[r.sync_type] ?? r.sync_type}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {r.direction === "from_1c" ? "из 1С" : "в 1С"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANTS[r.status] ?? "outline"}>
                        {r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono-tabular">
                      {r.records_count ?? "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono-tabular text-destructive">
                      {r.errors_count}
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
