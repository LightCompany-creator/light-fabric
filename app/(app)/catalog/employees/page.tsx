import Link from "next/link";
import { FileSpreadsheet, Pencil, Plus } from "lucide-react";
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
import { USER_ROLE_LABELS } from "@/lib/constants";
import { DeleteEmployeeButton } from "./delete-button";

type EmployeeRow = Tables<"employees"> & {
  workshop: Pick<Tables<"workshops">, "code" | "name"> | null;
};

export default async function EmployeesPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("*, workshop:workshops(code, name)")
    .order("full_name");
  const employees = (data ?? []) as EmployeeRow[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Работники"
        description="Сотрудники предприятия — синхронизируются с 1С через XLSX"
        actions={
          <>
            <Button variant="outline" disabled title="Реализация в Вехе 7–8">
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Импорт из Excel
            </Button>
            <Button asChild>
              <Link href="/catalog/employees/new">
                <Plus className="mr-2 h-4 w-4" />
                Добавить
              </Link>
            </Button>
          </>
        }
      />

      {error ? (
        <p className="text-sm text-destructive">
          Не удалось загрузить работников: {error.message}
        </p>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Таб. №</TableHead>
                <TableHead>ФИО</TableHead>
                <TableHead className="w-40">Должность</TableHead>
                <TableHead className="w-40">Цех</TableHead>
                <TableHead className="w-32">Роль (доступ)</TableHead>
                <TableHead className="w-24">Статус</TableHead>
                <TableHead className="w-24 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Никого не нашли. Добавь первого работника.
                  </TableCell>
                </TableRow>
              ) : (
                employees.map((e) => (
                  <TableRow key={e.id} className={e.is_active ? "" : "opacity-50"}>
                    <TableCell className="font-mono">{e.tab_number}</TableCell>
                    <TableCell className="font-medium">{e.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {e.position ?? "—"}
                    </TableCell>
                    <TableCell>
                      {e.workshop ? `${e.workshop.code} · ${e.workshop.name}` : "—"}
                    </TableCell>
                    <TableCell>
                      {e.role ? (
                        <Badge variant="secondary">{USER_ROLE_LABELS[e.role]}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {e.is_active ? (
                        <span className="text-sm text-success">активен</span>
                      ) : (
                        <span className="text-sm text-muted-foreground">отключён</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" title="Редактировать">
                          <Link href={`/catalog/employees/${e.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteEmployeeButton id={e.id} name={e.full_name} />
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
