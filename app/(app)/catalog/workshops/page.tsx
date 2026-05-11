import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";

export default async function WorkshopsPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workshops")
    .select("id, code, name, seq_order, color, description, is_active")
    .order("seq_order");
  const workshops = (data ?? []) as Array<Tables<"workshops">>;

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Цеха"
          description="Производственный поток Light Company"
        />
        <p className="text-sm text-destructive">
          Не удалось загрузить цеха: {error.message}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Цеха"
        description="Производственный поток Light Company (только просмотр — структуру меняет только админ)"
      />
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">№</TableHead>
              <TableHead className="w-12"></TableHead>
              <TableHead className="w-24">Код</TableHead>
              <TableHead>Название</TableHead>
              <TableHead>Описание</TableHead>
              <TableHead className="w-24">Статус</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workshops.map((ws) => (
              <TableRow key={ws.id}>
                <TableCell className="font-mono-tabular text-muted-foreground">
                  {ws.seq_order}
                </TableCell>
                <TableCell>
                  <span
                    className="inline-block h-4 w-4 rounded-full ring-1 ring-border"
                    style={{ backgroundColor: ws.color }}
                    aria-hidden
                  />
                </TableCell>
                <TableCell className="font-mono font-medium">
                  {ws.code}
                </TableCell>
                <TableCell>{ws.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {ws.description ?? "—"}
                </TableCell>
                <TableCell>
                  {ws.is_active ? (
                    <span className="text-sm text-success">активен</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      отключён
                    </span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
