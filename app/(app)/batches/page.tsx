import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  BATCH_STATUS_LABELS,
  WORKSHOP_COLOR_VARS,
  type BatchStatus,
  type WorkshopCode,
} from "@/lib/constants";

type SearchParams = {
  status?: string;
  workshop_id?: string;
  q?: string;
};

type BatchRow = Tables<"batches"> & {
  article: Pick<Tables<"articles">, "code" | "name"> | null;
  current: Pick<Tables<"workshops">, "code" | "name"> | null;
};

const STATUS_VALUES: BatchStatus[] = [
  "created",
  "in_transit",
  "received",
  "in_work",
  "completed",
  "shipped",
  "rejected",
];

export default async function BatchesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();

  let q = supabase
    .from("batches")
    .select(
      "*, article:articles(code, name), current:workshops!batches_current_workshop_fkey(code, name)",
    )
    .order("created_at", { ascending: false });

  if (searchParams.status && searchParams.status !== "all") {
    q = q.eq("status", searchParams.status as BatchStatus);
  }
  if (searchParams.workshop_id && searchParams.workshop_id !== "all") {
    q = q.eq("current_workshop", searchParams.workshop_id);
  }
  if (searchParams.q) {
    const term = searchParams.q.trim();
    if (term) q = q.ilike("batch_number", `%${term}%`);
  }

  const { data, error } = await q;
  const batches = (data ?? []) as BatchRow[];

  const { data: wsRaw } = await supabase
    .from("workshops")
    .select("id, code, name")
    .eq("is_active", true)
    .order("seq_order");
  const workshops = (wsRaw ?? []) as Pick<Tables<"workshops">, "id" | "code" | "name">[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Партии"
        description="Все партии производства с фильтрами по статусу и цеху"
      />

      <Card className="p-4">
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Input
            name="q"
            placeholder="Поиск по номеру партии"
            defaultValue={searchParams.q ?? ""}
          />
          <Select name="status" defaultValue={searchParams.status ?? "all"}>
            <SelectTrigger>
              <SelectValue placeholder="Статус" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {STATUS_VALUES.map((s) => (
                <SelectItem key={s} value={s}>
                  {BATCH_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            name="workshop_id"
            defaultValue={searchParams.workshop_id ?? "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Цех" />
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
          <div className="flex gap-2">
            <Button type="submit" variant="secondary" className="flex-1">
              Применить
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/batches">Сброс</Link>
            </Button>
          </div>
        </form>
      </Card>

      {error ? (
        <p className="text-sm text-destructive">
          Не удалось загрузить партии: {error.message}
        </p>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36">Номер</TableHead>
                <TableHead>Артикул</TableHead>
                <TableHead className="text-right">Пар</TableHead>
                <TableHead className="text-right">Брак</TableHead>
                <TableHead className="w-28">Цех</TableHead>
                <TableHead className="w-28">Статус</TableHead>
                <TableHead className="w-36">В работе</TableHead>
                <TableHead className="w-16 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Партий не найдено
                  </TableCell>
                </TableRow>
              ) : (
                batches.map((b) => {
                  const inWork = formatDistanceToNow(parseISO(b.created_at), {
                    locale: ru,
                  });
                  return (
                    <TableRow key={b.id}>
                      <TableCell className="font-mono text-sm">
                        {b.batch_number}
                      </TableCell>
                      <TableCell>
                        <span className="font-mono">{b.article?.code ?? "?"}</span>
                        <span className="ml-2 text-muted-foreground">
                          {b.article?.name ?? ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-mono-tabular">
                        {b.quantity}
                      </TableCell>
                      <TableCell className="text-right font-mono-tabular text-destructive">
                        {b.defect_total ?? 0}
                      </TableCell>
                      <TableCell>
                        {b.current ? (
                          <span
                            className="rounded px-2 py-0.5 text-xs font-medium text-white"
                            style={{
                              backgroundColor:
                                WORKSHOP_COLOR_VARS[b.current.code as WorkshopCode],
                            }}
                          >
                            {b.current.code}
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {BATCH_STATUS_LABELS[b.status as BatchStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {inWork}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/batches/${b.id}`}>
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
