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
import { SHIFT_TYPE_LABELS } from "@/lib/constants";

type SearchParams = {
  workshop_id?: string;
  status?: string;
  from?: string;
  to?: string;
};

type ShiftRow = Tables<"shifts"> & {
  workshop: Pick<Tables<"workshops">, "code" | "name"> | null;
  foreman: Pick<Tables<"employees">, "full_name" | "tab_number"> | null;
  shift_outputs: { quantity: number }[];
  shift_workers: { calculated_pay: number }[];
};

export default async function ShiftsListPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  let q = supabase
    .from("shifts")
    .select(
      "*, workshop:workshops(code, name), foreman:employees!shifts_foreman_id_fkey(full_name, tab_number), shift_outputs(quantity), shift_workers(calculated_pay)",
    )
    .order("shift_date", { ascending: false })
    .order("opened_at", { ascending: false });

  if (searchParams.workshop_id && searchParams.workshop_id !== "all") {
    q = q.eq("workshop_id", searchParams.workshop_id);
  }
  if (searchParams.status && searchParams.status !== "all") {
    q = q.eq("status", searchParams.status as "open" | "closed");
  }
  if (searchParams.from) q = q.gte("shift_date", searchParams.from);
  if (searchParams.to) q = q.lte("shift_date", searchParams.to);

  const { data, error } = await q;
  const shifts = (data ?? []) as ShiftRow[];

  const { data: wsRaw } = await supabase
    .from("workshops")
    .select("id, code, name")
    .eq("is_active", true)
    .order("seq_order");
  const workshops = (wsRaw ?? []) as Pick<Tables<"workshops">, "id" | "code" | "name">[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Смены"
        description="Учёт сменной выработки по цехам"
        actions={
          <Button asChild>
            <Link href="/shifts/new">
              <Plus className="mr-2 h-4 w-4" />
              Открыть смену
            </Link>
          </Button>
        }
      />

      <Card className="p-4">
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-5">
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
                <SelectItem value="open">Открытые</SelectItem>
                <SelectItem value="closed">Закрытые</SelectItem>
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
              <Link href="/shifts">Сброс</Link>
            </Button>
          </div>
        </form>
      </Card>

      {error ? (
        <p className="text-sm text-destructive">
          Не удалось загрузить смены: {error.message}
        </p>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Дата</TableHead>
                <TableHead className="w-32">Цех</TableHead>
                <TableHead>Бригадир</TableHead>
                <TableHead className="w-24">Тип</TableHead>
                <TableHead className="w-24">Статус</TableHead>
                <TableHead className="text-right">Пар</TableHead>
                <TableHead className="text-right">ФОТ, ₽</TableHead>
                <TableHead className="w-16 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shifts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Смен пока нет
                  </TableCell>
                </TableRow>
              ) : (
                shifts.map((s) => {
                  const totalPairs = (s.shift_outputs ?? []).reduce(
                    (acc, o) => acc + (o.quantity ?? 0),
                    0,
                  );
                  const totalPay = (s.shift_workers ?? []).reduce(
                    (acc, w) => acc + Number(w.calculated_pay ?? 0),
                    0,
                  );
                  const isOpen = s.status === "open";
                  return (
                    <TableRow
                      key={s.id}
                      className={isOpen ? "bg-accent/5" : ""}
                    >
                      <TableCell className="font-mono-tabular text-sm">
                        {format(parseISO(s.shift_date), "d MMM yyyy", { locale: ru })}
                      </TableCell>
                      <TableCell>{s.workshop?.code ?? "—"}</TableCell>
                      <TableCell>
                        {s.foreman?.full_name ?? "—"}
                        {s.foreman?.tab_number ? (
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            {s.foreman.tab_number}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell>{SHIFT_TYPE_LABELS[s.shift_type]}</TableCell>
                      <TableCell>
                        {isOpen ? (
                          <Badge className="bg-accent text-accent-foreground">
                            открыта
                          </Badge>
                        ) : (
                          <Badge variant="outline">закрыта</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-mono-tabular">
                        {totalPairs}
                      </TableCell>
                      <TableCell className="text-right font-mono-tabular">
                        {totalPay.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon" title="Открыть">
                          <Link href={`/shifts/${s.id}`}>
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
