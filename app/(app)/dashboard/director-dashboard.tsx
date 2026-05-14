import { createClient } from "@/lib/supabase/server";
import { getDirectorOverview } from "@/lib/services/analytics";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { TopList } from "@/components/dashboard/top-list";
import { ProductionLineChart } from "@/components/dashboard/line-chart";
import { WorkshopLoadChart } from "@/components/dashboard/bar-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ruRub = (n: number) =>
  n.toLocaleString("ru-RU", { maximumFractionDigits: 0 });

export async function DirectorDashboard() {
  const supabase = createClient();
  const data = await getDirectorOverview(supabase);

  return (
    <div className="space-y-6">
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <KpiCard
          label="Пар сегодня"
          value={data.today.pairs.toLocaleString("ru-RU")}
          tone="brand"
        />
        <KpiCard
          label="Выпуск, ₽"
          value={ruRub(data.today.valueRub)}
          tone="brand"
        />
        <KpiCard
          label="Брак"
          value={`${data.today.defectPct.toFixed(1)}%`}
          tone={data.today.defectPct > 5 ? "danger" : "success"}
        />
        <KpiCard
          label="ФОТ за день, ₽"
          value={ruRub(data.today.payrollRub)}
          tone="neutral"
        />
        <KpiCard
          label="ЭВА / сырьё"
          value={data.today.materialsKg.toFixed(1)}
          unit="кг"
          tone="neutral"
        />
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopList
          title="Топ артикулов за неделю"
          items={data.topArticles.map((a) => ({
            key: a.code,
            label: `${a.code} · ${a.name}`,
            value: a.pairs,
          }))}
          unit="пар"
          emptyMessage="За неделю не было закрытых смен"
        />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Выпуск по дням (14 дней)</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductionLineChart data={data.productionByDay} yLabel="пар" />
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Выпуск по цехам сегодня</CardTitle>
        </CardHeader>
        <CardContent>
          <WorkshopLoadChart data={data.workshopLoad} yLabel="пар за сегодня" />
        </CardContent>
      </Card>
    </div>
  );
}
