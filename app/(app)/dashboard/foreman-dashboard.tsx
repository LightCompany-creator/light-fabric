import Link from "next/link";
import { ClipboardList, Inbox, Package, Plus } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import { getForemanOverview } from "@/lib/services/analytics";
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
  const data = await getForemanOverview(supabase, {
    workshopId: user.employee.workshop_id,
    foremanId: user.employee.id,
  });
  const workshop = user.employee.workshop?.name ?? "";

  return (
    <div className="space-y-6">
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

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CounterCard
          icon={<Inbox className="h-5 w-5" />}
          label="Входящие партии"
          value={data.incomingCount}
          href="/batches/incoming"
        />
        <CounterCard
          icon={<Package className="h-5 w-5" />}
          label="Партии в работе"
          value={data.inWorkCount}
          href="/batches"
        />
        <CounterCard
          icon={<ClipboardList className="h-5 w-5" />}
          label="Все смены цеха"
          value="→"
          href="/shifts"
        />
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

function CounterCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:bg-secondary">
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <p className="mt-1 font-mono-tabular text-3xl font-bold">{value}</p>
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </CardContent>
      </Card>
    </Link>
  );
}
