import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { formatDistanceToNow, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { WORKSHOP_COLOR_VARS, type WorkshopCode } from "@/lib/constants";

type IncomingBatch = Tables<"batches"> & {
  article: Pick<Tables<"articles">, "code" | "name"> | null;
  current: Pick<Tables<"workshops">, "code" | "name"> | null;
  last_movement: {
    moved_at: string;
    from_ws: Pick<Tables<"workshops">, "code" | "name"> | null;
  } | null;
};

export default async function IncomingBatchesPage() {
  const user = await getCurrentUser();

  if (!user?.employee?.workshop_id) {
    return (
      <div className="space-y-4">
        <PageHeader title="Входящие партии" />
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Вы не привязаны к цеху — обратитесь к технологу или администратору
          </CardContent>
        </Card>
      </div>
    );
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("batches")
    .select(
      "*, article:articles(code, name), current:workshops!batches_current_workshop_fkey(code, name), last_movement:batch_movements(moved_at, from_ws:workshops!batch_movements_from_workshop_fkey(code, name))",
    )
    .eq("current_workshop", user.employee.workshop_id)
    .eq("status", "in_transit")
    .order("created_at", { ascending: false });

  const batches = (data ?? []) as unknown as IncomingBatch[];
  // Берём последнее движение
  const enriched = batches.map((b) => {
    const movs = Array.isArray((b as { last_movement: unknown }).last_movement)
      ? ((b as unknown as { last_movement: { moved_at: string; from_ws: Pick<Tables<"workshops">, "code" | "name"> | null }[] }).last_movement)
      : [];
    const last = movs.length > 0 ? movs[movs.length - 1] : null;
    return { ...b, last_movement: last };
  });

  return (
    <div className="space-y-4">
      <PageHeader
        title="Входящие партии"
        description={`Цех ${user.employee.workshop?.name ?? ""}: ждут вашей приёмки`}
      />

      {error ? (
        <p className="text-sm text-destructive">
          Не удалось загрузить партии: {error.message}
        </p>
      ) : enriched.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center text-muted-foreground">
            <Inbox className="h-10 w-10 opacity-40" />
            <p>Сейчас входящих партий нет</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {enriched.map((b) => {
            const fromWs = b.last_movement?.from_ws;
            const movedAgo = b.last_movement?.moved_at
              ? formatDistanceToNow(parseISO(b.last_movement.moved_at), {
                  locale: ru,
                  addSuffix: true,
                })
              : null;
            const remaining = b.quantity - (b.defect_total ?? 0);
            return (
              <Card key={b.id}>
                <CardContent className="space-y-3 pt-6">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm font-medium">{b.batch_number}</p>
                    {fromWs ? (
                      <span
                        className="rounded px-2 py-0.5 text-xs font-medium text-white"
                        style={{
                          backgroundColor:
                            WORKSHOP_COLOR_VARS[fromWs.code as WorkshopCode],
                        }}
                      >
                        от {fromWs.code}
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <p className="font-mono text-base font-medium">
                      {b.article?.code ?? "?"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {b.article?.name ?? ""}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-mono-tabular text-xl font-bold">
                        {remaining}
                      </p>
                      <p className="text-xs text-muted-foreground">пар</p>
                    </div>
                    {movedAgo ? (
                      <p className="text-xs text-muted-foreground">{movedAgo}</p>
                    ) : null}
                  </div>
                  <Button asChild className="w-full">
                    <Link href={`/batches/${b.id}`}>
                      Принять
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
