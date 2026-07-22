import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
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

const STATUS_LABEL: Record<string, string> = {
  draft: "черновик",
  in_progress: "в работе",
  closed: "закрыт",
};

type OrderRow = Tables<"production_orders"> & {
  production_order_lines: { qty: number }[];
  production_suborders: { status: string }[];
};

export default async function OrdersListPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  const canCreate = user?.role === "production_manager" || user?.role === "admin";

  const { data, error } = await supabase
    .from("production_orders")
    .select("*, production_order_lines(qty), production_suborders(status)")
    .order("order_date", { ascending: false })
    .order("created_at", { ascending: false });
  const orders = (data ?? []) as OrderRow[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Заказы на производство"
        description="От коммерческого отдела → подзаказы по цехам → сдача на склад"
        actions={
          canCreate ? (
            <Button asChild>
              <Link href="/orders/new">
                <Plus className="mr-2 h-4 w-4" />
                Новый заказ
              </Link>
            </Button>
          ) : undefined
        }
      />

      {error ? (
        <p className="text-sm text-destructive">Не удалось загрузить заказы: {error.message}</p>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Номер</TableHead>
                <TableHead className="w-28">Дата</TableHead>
                <TableHead className="w-28">Срок</TableHead>
                <TableHead className="w-28">Статус</TableHead>
                <TableHead className="text-right">Пар (план)</TableHead>
                <TableHead className="text-right">Подзаказов</TableHead>
                <TableHead className="w-16 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Заказов пока нет
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((o) => {
                  const totalQty = (o.production_order_lines ?? []).reduce(
                    (s, l) => s + (l.qty ?? 0),
                    0,
                  );
                  const subCount = o.production_suborders?.length ?? 0;
                  const closedCount = (o.production_suborders ?? []).filter(
                    (s) => s.status === "closed",
                  ).length;
                  return (
                    <TableRow key={o.id} className={o.status !== "closed" ? "bg-accent/5" : ""}>
                      <TableCell className="font-mono text-sm">{o.doc_number}</TableCell>
                      <TableCell className="font-mono-tabular text-sm">
                        {format(parseISO(o.order_date), "d MMM yyyy", { locale: ru })}
                      </TableCell>
                      <TableCell className="font-mono-tabular text-sm">
                        {o.due_date
                          ? format(parseISO(o.due_date), "d MMM yyyy", { locale: ru })
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {o.status === "closed" ? (
                          <Badge variant="outline">закрыт</Badge>
                        ) : (
                          <Badge className="bg-accent text-accent-foreground">
                            {STATUS_LABEL[o.status] ?? o.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono-tabular">{totalQty}</TableCell>
                      <TableCell className="text-right font-mono-tabular">
                        {closedCount}/{subCount}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon" title="Открыть">
                          <Link href={`/orders/${o.id}`}>
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
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
