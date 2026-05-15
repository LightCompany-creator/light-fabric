import { createClient } from "@/lib/supabase/server";
import { getDirectorOverview, resolveRange } from "@/lib/services/analytics";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { TopList } from "@/components/dashboard/top-list";
import { ProductionLineChart } from "@/components/dashboard/line-chart";
import { WorkshopLoadChart } from "@/components/dashboard/bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardDateRangePicker } from "@/components/dashboard/date-range-picker";

const ruRub = (n: number) =>
  n.toLocaleString("ru-RU", { maximumFractionDigits: 0 });

export async function DirectorDashboard({
  searchParams,
}: {
  searchParams: { from?: string; to?: string; period?: string };
}) {
  const supabase = createClient();
  const range = resolveRange(searchParams);
  const data = await getDirectorOverview(supabase, range);

  return (
    <div className="space-y-6">
      <DashboardDateRangePicker />

      <p className="text-sm text-muted-foreground">
        Показано: <span className="font-medium text-foreground">{data.range.label}</span>
        {data.range.from !== data.range.to ? (
          <span className="ml-1 font-mono text-xs">
            ({data.range.from} → {data.range.to})
          </span>
        ) : null}
      </p>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Пар за период"
          value={data.totals.pairs.toLocaleString("ru-RU")}
          tone="brand"
        />
        <KpiCard
          label="Выпуск, ₽"
          value={ruRub(data.totals.valueRub)}
          tone="brand"
        />
        <KpiCard
          label="Брак"
          value={`${data.totals.defectPct.toFixed(1)}%`}
          tone={data.totals.defectPct > 5 ? "danger" : "success"}
        />
        <KpiCard
          label="ФОТ, ₽"
          value={ruRub(data.totals.payrollRub)}
          tone="neutral"
        />
        <KpiCard
          label="ЭВА / сырьё"
          value={data.totals.materialsKg.toFixed(1)}
          unit="кг"
          tone="neutral"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopList
          title="Топ артикулов"
          items={data.topArticles.map((a) => ({
            key: a.code,
            label: `${a.code} · ${a.name}`,
            value: a.pairs,
          }))}
          unit="пар"
          emptyMessage="За выбранный период нет данных"
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Выпуск по дням</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductionLineChart data={data.productionByDay} yLabel="пар" />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Выпуск по цехам</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkshopLoadChart data={data.workshopLoad} yLabel="пар за период" />
        </CardContent>
      </Card>
    </div>
  );
}
