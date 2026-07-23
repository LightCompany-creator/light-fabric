import Link from "next/link";
import { ClipboardList, ListTodo, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getForemanOverview } from "@/lib/services/analytics";
import { countNewSubordersForWorkshop } from "@/lib/services/orders";
import type { CurrentUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductionLineChart } from "@/components/dashboard/line-chart";
import { SHIFT_TYPE_LABELS } from "@/lib/constants";

export async function ForemanDashboard({ user }: { user: CurrentUser }) {
  if (!user.employee?.workshop_id) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Вы не привязаны к цеху — обратитесь к технологу
        </CardContent>
      </Card>
    );
  }
  const supabase = createClient();
  const [data, newSuborders] = await Promise.all([
    getForemanOverview(supabase, {
      workshopId: user.employee.workshop_id,
      foremanId: user.employee.id,
    }),
    countNewSubordersForWorkshop(supabase, user.employee.workshop_id),
  ]);
  const workshop = user.employee.workshop?.name ?? "";

  return (
    <div className="space-y-6">
      {newSuborders > 0 ? (
        <Link href="/orders/suborders">
          <Card className="border-destructive/40 bg-destructive/5 transition-colors hover:bg-destructive/10">
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Новые подзаказы от начальника производства
                </p>
                <p className="mt-1 font-mono-tabular text-3xl font-bold text-destructive">
                  {newSuborders}
                </p>
              </div>
              <ListTodo className="h-6 w-6 text-destructive" />
            </CardContent>
          </Card>
        </Link>
      ) : null}

      {data.currentShift ? (
        <Card className="border-accent/40 bg-accent/5">
          <CardHeader>
            <CardTitle className="text-base">Текущая смена · открыта</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono-tabular text-2xl font-bold">
                {format(parseISO(data.currentShift.shift_date), "d MMMM yyyy", {
                  locale: ru,
                })}
              </p>
              <p className="text-sm text-muted-foreground">
                {SHIFT_TYPE_LABELS[data.currentShift.shift_type]} · {workshop} ·{" "}
                {data.currentShift.outputs} {"записей выработки"} ·{" "}
                {data.currentShift.workers} {"работников"}
              </p>
            </div>
            <Button asChild>
              <Link href={`/shifts/${data.currentShift.id}`}>Открыть смену</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Смена не открыта</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              Откройте смену, чтобы начать вести выработку
            </p>
            <Button asChild size="lg">
              <Link href="/shifts/new">
                <Plus className="mr-2 h-4 w-4" />
                Открыть смену
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/shifts">
          <Card className="transition-colors hover:bg-secondary">
            <CardContent className="flex items-center justify-between pt-6">
              <div>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Все смены цеха
                </p>
                <p className="mt-1 font-mono-tabular text-3xl font-bold">→</p>
              </div>
              <div className="text-muted-foreground">
                <ClipboardList className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Выработка за 7 дней · {workshop}</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductionLineChart data={data.weeklyByDay} yLabel="пар" />
        </CardContent>
      </Card>
    </div>
  );
}
