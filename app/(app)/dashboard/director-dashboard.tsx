import Link from "next/link";
import { AlertTriangle } from "lucide-react";
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
      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
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
          label="В работе"
          value={data.today.batchesInWork}
          unit="партий"
          tone="neutral"
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

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Загрузка цехов</CardTitle>
          </CardHeader>
          <CardContent>
            <WorkshopLoadChart data={data.workshopLoad} yLabel="пар в работе" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {data.stuckBatches.length > 0 ? (
                <span className="inline-flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  Застрявшие партии (&gt;24ч)
                </span>
              ) : (
                <span className="text-success">Застрявших партий нет</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.stuckBatches.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Все партии движутся в рабочем темпе
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {data.stuckBatches.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/batches/${b.id}`}
                      className="flex items-center justify-between rounded p-2 hover:bg-secondary"
                    >
                      <span>
                        <span className="font-mono">{b.batchNumber}</span>
                        <span className="ml-2 text-muted-foreground">
                          {b.articleCode} · в {b.workshopCode}
                        </span>
                      </span>
                      <span className="font-mono-tabular text-destructive">
                        {b.hoursStuck} ч
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
