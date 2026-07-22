import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUS_LABEL: Record<string, string> = {
  assigned: "назначен",
  correction_requested: "правка запрошена",
  in_progress: "в работе",
  closed: "закрыт",
};

type SuborderRow = Tables<"production_suborders"> & {
  workshop: Pick<Tables<"workshops">, "code" | "name"> | null;
  order: Pick<Tables<"production_orders">, "doc_number"> | null;
};

export default async function SuborderListPage({
  searchParams,
}: {
  searchParams: { workshop_id?: string; status?: string };
}) {
  const supabase = createClient();
  const user = await getCurrentUser();
  const isForeman = user?.role === "foreman";
  const scopedWorkshopId = isForeman ? user?.employee?.workshop_id ?? null : null;

  let q = supabase
    .from("production_suborders")
    .select("*, workshop:workshops(code, name), order:production_orders(doc_number)")
    .order("created_at", { ascending: false });

  if (scopedWorkshopId) {
    q = q.eq("workshop_id", scopedWorkshopId);
  } else if (searchParams.workshop_id && searchParams.workshop_id !== "all") {
    q = q.eq("workshop_id", searchParams.workshop_id);
  }
  if (searchParams.status && searchParams.status !== "all") {
    q = q.eq(
      "status",
      searchParams.status as "assigned" | "correction_requested" | "in_progress" | "closed",
    );
  }

  const { data, error } = await q;
  const suborders = (data ?? []) as SuborderRow[];

  const { data: wsRaw } = await supabase
    .from("workshops")
    .select("id, code, name")
    .eq("is_active", true)
    .order("seq_order");
  const workshops = (wsRaw ?? []) as Pick<Tables<"workshops">, "id" | "code" | "name">[];

  return (
    <div className="space-y-4">
      <PageHeader
        title={isForeman ? "Мои подзаказы" : "Подзаказы"}
        description="Часть заказа на производство, назначенная цеху"
      />

      {!isForeman ? (
        <Card className="p-4">
          <form className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Цех</p>
              <Select name="workshop_id" defaultValue={searchParams.workshop_id ?? "all"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все цеха</SelectItem>
                  {workshops.map((w) => (
                    <SelectItem key={w.id} value={w.id}>
                      {w.code} · {w.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Статус</p>
              <Select name="status" defaultValue={searchParams.status ?? "all"}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="assigned">Назначен</SelectItem>
                  <SelectItem value="correction_requested">Правка запрошена</SelectItem>
                  <SelectItem value="in_progress">В работе</SelectItem>
                  <SelectItem value="closed">Закрыт</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" variant="secondary" className="flex-1">
                Применить
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/orders/suborders">Сброс</Link>
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive">Не удалось загрузить подзаказы: {error.message}</p>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Номер</TableHead>
                <TableHead className="w-28">Заказ</TableHead>
                {!isForeman ? <TableHead>Цех</TableHead> : null}
                <TableHead className="w-32">Срок</TableHead>
                <TableHead className="w-44">Статус</TableHead>
                <TableHead className="w-16 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suborders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isForeman ? 5 : 6} className="text-center text-muted-foreground">
                    Подзаказов пока нет
                  </TableCell>
                </TableRow>
              ) : (
                suborders.map((s) => (
                  <TableRow key={s.id} className={s.status !== "closed" ? "bg-accent/5" : ""}>
                    <TableCell className="font-mono text-sm">{s.doc_number}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {s.order?.doc_number ?? "—"}
                    </TableCell>
                    {!isForeman ? (
                      <TableCell>
                        {s.workshop ? `${s.workshop.code} · ${s.workshop.name}` : "—"}
                      </TableCell>
                    ) : null}
                    <TableCell className="font-mono-tabular text-sm">
                      {s.due_date ? format(parseISO(s.due_date), "d MMM yyyy", { locale: ru }) : "—"}
                    </TableCell>
                    <TableCell>
                      {s.status === "closed" ? (
                        <Badge variant="outline">закрыт</Badge>
                      ) : s.status === "correction_requested" ? (
                        <Badge variant="destructive">правка запрошена</Badge>
                      ) : (
                        <Badge className="bg-accent text-accent-foreground">
                          {STATUS_LABEL[s.status] ?? s.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/orders/suborders/${s.id}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-secondary"
                        title="Открыть"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Link>
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
