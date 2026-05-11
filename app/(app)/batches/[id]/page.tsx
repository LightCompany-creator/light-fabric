import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  BATCH_STATUS_LABELS,
  WORKSHOP_COLOR_VARS,
  WORKSHOP_LABELS,
  type BatchStatus,
  type WorkshopCode,
} from "@/lib/constants";
import { getRouteForArticle, nextWorkshopInRoute } from "@/lib/services/batches";
import { ReceiveBatchForm } from "./receive-form";
import { TransferBatchForm } from "./transfer-form";

type BatchFull = Tables<"batches"> & {
  article: Pick<Tables<"articles">, "code" | "name" | "route_type"> | null;
  current: Pick<Tables<"workshops">, "code" | "name"> | null;
  created_in: Pick<Tables<"workshops">, "code" | "name"> | null;
};

type Movement = Tables<"batch_movements"> & {
  from_ws: Pick<Tables<"workshops">, "code" | "name"> | null;
  to_ws: Pick<Tables<"workshops">, "code" | "name"> | null;
  mover: Pick<Tables<"employees">, "full_name" | "tab_number"> | null;
};

const STATUS_BADGE: Record<BatchStatus, { className: string }> = {
  created: { className: "bg-brand text-white" },
  in_transit: { className: "bg-accent text-accent-foreground" },
  received: { className: "bg-secondary text-secondary-foreground" },
  in_work: { className: "bg-info/10 text-info" },
  completed: { className: "bg-success/10 text-success" },
  shipped: { className: "bg-success text-success-foreground" },
  rejected: { className: "bg-destructive text-destructive-foreground" },
};

function RouteProgress({
  route,
  currentCode,
}: {
  route: WorkshopCode[];
  currentCode: WorkshopCode | null;
}) {
  const currentIdx = currentCode ? route.indexOf(currentCode) : -1;
  return (
    <div className="flex flex-wrap items-center gap-1">
      {route.map((code, i) => {
        const state =
          i < currentIdx ? "passed" : i === currentIdx ? "current" : "future";
        const bg =
          state === "future" ? "rgba(0,0,0,0.08)" : WORKSHOP_COLOR_VARS[code];
        const color = state === "future" ? "rgba(0,0,0,0.6)" : "white";
        const ring = state === "current" ? "ring-2 ring-offset-2 ring-accent" : "";
        return (
          <span key={i} className="flex items-center gap-1">
            <span
              className={`rounded px-2 py-0.5 text-xs font-medium ${ring}`}
              style={{ backgroundColor: bg, color }}
            >
              {WORKSHOP_LABELS[code]}
            </span>
            {i < route.length - 1 ? (
              <span className="text-muted-foreground">→</span>
            ) : null}
          </span>
        );
      })}
    </div>
  );
}

export default async function BatchDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const user = await getCurrentUser();

  const [{ data: batchRaw }, { data: movsRaw }, { data: wsRaw }] = await Promise.all([
    supabase
      .from("batches")
      .select(
        "*, article:articles(code, name, route_type), current:workshops!batches_current_workshop_fkey(code, name), created_in:workshops!batches_created_in_workshop_fkey(code, name)",
      )
      .eq("id", params.id)
      .maybeSingle(),
    supabase
      .from("batch_movements")
      .select(
        "*, from_ws:workshops!batch_movements_from_workshop_fkey(code, name), to_ws:workshops!batch_movements_to_workshop_fkey(code, name), mover:employees(full_name, tab_number)",
      )
      .eq("batch_id", params.id)
      .order("moved_at"),
    supabase
      .from("workshops")
      .select("id, code, name")
      .eq("is_active", true)
      .order("seq_order"),
  ]);

  const batch = batchRaw as BatchFull | null;
  if (!batch) notFound();
  const movements = (movsRaw ?? []) as Movement[];
  const workshops = (wsRaw ?? []) as Pick<Tables<"workshops">, "id" | "code" | "name">[];

  // Маршрут — из routes (через сервис; в сервисе свой Supabase, тут просто аналог)
  const route = batch.article
    ? await getRouteForArticle(supabase, batch.article_id)
    : ([] as WorkshopCode[]);
  const currentCode = (batch.current?.code as WorkshopCode | undefined) ?? null;
  const nextCode = currentCode ? nextWorkshopInRoute(route, currentCode) : null;
  const suggestedWorkshop = nextCode
    ? workshops.find((w) => w.code === nextCode) ?? null
    : null;

  const isMyWorkshop =
    user?.employee?.workshop_id !== undefined &&
    user.employee.workshop_id === batch.current_workshop;
  const canReceive = isMyWorkshop && batch.status === "in_transit";
  const canTransfer =
    isMyWorkshop &&
    (batch.status === "received" ||
      batch.status === "in_work" ||
      batch.status === "created");

  const statusStyles =
    STATUS_BADGE[batch.status as BatchStatus] ?? STATUS_BADGE.created;
  const remainingQty = batch.quantity - (batch.defect_total ?? 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={batch.batch_number}
        description={`Артикул ${batch.article?.code ?? "—"} · ${batch.article?.name ?? ""}`}
        actions={
          <Badge className={statusStyles.className}>
            {BATCH_STATUS_LABELS[batch.status as BatchStatus] ?? batch.status}
          </Badge>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Маршрут партии
          </CardTitle>
        </CardHeader>
        <CardContent>
          {route.length === 0 ? (
            <p className="text-sm text-muted-foreground">Маршрут не определён</p>
          ) : (
            <RouteProgress route={route} currentCode={currentCode} />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <Stat label="Количество, пар" value={batch.quantity.toString()} />
        <Stat
          label="Вес, кг"
          value={batch.weight ? Number(batch.weight).toFixed(2) : "—"}
        />
        <Stat label="Брак всего" value={String(batch.defect_total ?? 0)} />
        <Stat label="Остаток" value={remainingQty.toString()} />
      </div>

      {canReceive ? (
        <ReceiveBatchForm batchId={batch.id} defaultQty={remainingQty} />
      ) : null}

      {canTransfer ? (
        <TransferBatchForm
          batchId={batch.id}
          workshops={workshops}
          suggestedWorkshopId={suggestedWorkshop?.id ?? null}
          defaultQty={remainingQty}
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>История движения</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Когда</TableHead>
                <TableHead>Откуда</TableHead>
                <TableHead>Куда</TableHead>
                <TableHead>Кем</TableHead>
                <TableHead className="text-right">Принято</TableHead>
                <TableHead className="text-right">Отправлено</TableHead>
                <TableHead className="text-right">Брак</TableHead>
                <TableHead>Заметка</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="text-sm">
                    {format(parseISO(m.moved_at), "d MMM yyyy, HH:mm", { locale: ru })}
                  </TableCell>
                  <TableCell>
                    {m.from_ws ? (
                      <span
                        className="rounded px-2 py-0.5 text-xs font-medium text-white"
                        style={{
                          backgroundColor: WORKSHOP_COLOR_VARS[m.from_ws.code as WorkshopCode],
                        }}
                      >
                        {m.from_ws.code}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">создание</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <span
                      className="rounded px-2 py-0.5 text-xs font-medium text-white"
                      style={{
                        backgroundColor: WORKSHOP_COLOR_VARS[m.to_ws?.code as WorkshopCode],
                      }}
                    >
                      {m.to_ws?.code ?? "?"}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.mover?.full_name ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono-tabular">
                    {m.qty_in ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono-tabular">
                    {m.qty_out ?? "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono-tabular text-destructive">
                    {m.defect_at_step || ""}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {m.notes ?? ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 font-mono-tabular text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}
