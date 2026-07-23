import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { getSuborderProgressTotals } from "@/lib/services/orders";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const STATUS_LABEL: Record<string, string> = {
  draft: "ждёт приёма",
  in_progress: "в работе",
  closed: "закрыт",
};

export async function CommercialDirectorDashboard() {
  const supabase = createClient();
  const { data: ordersRaw } = await supabase
    .from("production_orders")
    .select("*, production_order_lines(qty)")
    .order("created_at", { ascending: false })
    .limit(15);
  const orders = (ordersRaw ?? []) as (Tables<"production_orders"> & {
    production_order_lines: { qty: number }[];
  })[];

  const { data: subsRaw } = await supabase
    .from("production_suborders")
    .select("id, order_id, status")
    .in("order_id", orders.map((o) => o.id).length > 0 ? orders.map((o) => o.id) : ["00000000-0000-0000-0000-000000000000"]);
  const suborders = (subsRaw ?? []) as { id: string; order_id: string; status: string }[];
  const progress = await getSuborderProgressTotals(supabase, suborders.map((s) => s.id));

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button asChild>
          <Link href="/orders/new">
            <Plus className="mr-2 h-4 w-4" />
            Новый заказ
          </Link>
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Заказов пока нет
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {orders.map((o) => {
            const planned = (o.production_order_lines ?? []).reduce((s, l) => s + (l.qty ?? 0), 0);
            const mySubs = suborders.filter((s) => s.order_id === o.id);
            const produced = mySubs.reduce(
              (s, sub) => s + (progress.get(sub.id)?.produced ?? 0),
              0,
            );
            const closedCount = mySubs.filter((s) => s.status === "closed").length;
            const pct = planned > 0 ? Math.min(100, Math.round((produced / planned) * 100)) : 0;

            return (
              <Link key={o.id} href={`/orders/${o.id}`}>
                <Card className="transition-colors hover:bg-secondary">
                  <CardContent className="flex items-center gap-4 pt-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm">{o.doc_number}</span>
                        {o.status === "closed" ? (
                          <Badge variant="outline">закрыт</Badge>
                        ) : o.status === "draft" ? (
                          <Badge variant="destructive">ждёт приёма</Badge>
                        ) : (
                          <Badge className="bg-accent text-accent-foreground">
                            {STATUS_LABEL[o.status] ?? o.status}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          подзаказов {closedCount}/{mySubs.length}
                        </span>
                      </div>
                      {planned > 0 ? (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 w-48 max-w-full overflow-hidden rounded-full bg-secondary">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="font-mono-tabular text-xs text-muted-foreground">
                            {produced}/{planned} пар
                          </span>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">Строки не заданы</p>
                      )}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
