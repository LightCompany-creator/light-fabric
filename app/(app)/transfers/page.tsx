import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

type SearchParams = {
  workshop_id?: string;
  status?: string;
  from?: string;
  to?: string;
};

type TransferRow = Tables<"transfers"> & {
  from_workshop: Pick<Tables<"workshops">, "code" | "name"> | null;
  to_workshop: Pick<Tables<"workshops">, "code" | "name"> | null;
  transfer_lines: { qty: number }[];
};

export default async function TransfersListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  let q = supabase
    .from("transfers")
    .select(
      "*, from_workshop:workshops!transfers_from_workshop_id_fkey(code, name), to_workshop:workshops!transfers_to_workshop_id_fkey(code, name), transfer_lines(qty)",
    )
    .order("transfer_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (searchParams.workshop_id && searchParams.workshop_id !== "all") {
    q = q.or(
      `from_workshop_id.eq.${searchParams.workshop_id},to_workshop_id.eq.${searchParams.workshop_id}`,
    );
  }
  if (searchParams.status && searchParams.status !== "all") {
    q = q.eq("status", searchParams.status as "open" | "accepted");
  }
  if (searchParams.from) q = q.gte("transfer_date", searchParams.from);
  if (searchParams.to) q = q.lte("transfer_date", searchParams.to);

  const { data, error } = await q;
  const transfers = (data ?? []) as TransferRow[];

  const { data: wsRaw } = await supabase
    .from("workshops")
    .select("id, code, name")
    .eq("is_active", true)
    .order("seq_order");
  const workshops = (wsRaw ?? []) as Pick<Tables<"workshops">, "id" | "code" | "name">[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Перемещения"
        description="Документы передачи между цехами · принятый документ закрыт"
        actions={
          <Button asChild>
            <Link href="/transfers/new">
              <Plus className="mr-2 h-4 w-4" />
              Новое перемещение
            </Link>
          </Button>
        }
      />

      <Card className="p-4">
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-5">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Цех (отпр. или получ.)</p>
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
                <SelectItem value="open">Открытые</SelectItem>
                <SelectItem value="accepted">Принятые</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">С даты</p>
            <Input name="from" type="date" defaultValue={searchParams.from ?? ""} />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">По дату</p>
            <Input name="to" type="date" defaultValue={searchParams.to ?? ""} />
          </div>
          <div className="flex items-end gap-2">
            <Button type="submit" variant="secondary" className="flex-1">
              Применить
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/transfers">Сброс</Link>
            </Button>
          </div>
        </form>
      </Card>

      {error ? (
        <p className="text-sm text-destructive">
          Не удалось загрузить перемещения: {error.message}
        </p>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Номер</TableHead>
                <TableHead className="w-28">Дата</TableHead>
                <TableHead>Откуда</TableHead>
                <TableHead>Куда</TableHead>
                <TableHead className="w-28">Статус</TableHead>
                <TableHead className="text-right">Пар</TableHead>
                <TableHead className="w-16 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Перемещений пока нет
                  </TableCell>
                </TableRow>
              ) : (
                transfers.map((t) => {
                  const totalQty = (t.transfer_lines ?? []).reduce(
                    (acc, l) => acc + (l.qty ?? 0),
                    0,
                  );
                  const isOpen = t.status === "open";
                  return (
                    <TableRow key={t.id} className={isOpen ? "bg-accent/5" : ""}>
                      <TableCell className="font-mono text-sm">{t.doc_number}</TableCell>
                      <TableCell className="font-mono-tabular text-sm">
                        {format(parseISO(t.transfer_date), "d MMM yyyy", { locale: ru })}
                      </TableCell>
                      <TableCell>
                        {t.from_workshop
                          ? `${t.from_workshop.code} · ${t.from_workshop.name}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {t.to_workshop
                          ? `${t.to_workshop.code} · ${t.to_workshop.name}`
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {isOpen ? (
                          <Badge className="bg-accent text-accent-foreground">
                            открыт
                          </Badge>
                        ) : (
                          <Badge variant="outline">принят</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono-tabular">
                        {totalQty}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon" title="Открыть">
                          <Link href={`/transfers/${t.id}`}>
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