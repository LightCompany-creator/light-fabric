import Link from "next/link";
import { ArrowRight, FileDown, FileUp, History } from "lucide-react";
import { endOfMonth, startOfMonth } from "date-fns";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

export default function SyncIndexPage() {
  const now = new Date();
  const from = isoDate(startOfMonth(now));
  const to = isoDate(endOfMonth(now));
  const period = from.slice(0, 7);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Обмен с 1С"
        description="Импорт справочников и выгрузка ведомостей"
      />

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileUp className="h-5 w-5" />
              Импорт
            </CardTitle>
            <CardDescription>
              Загрузка работников и артикулов из XLSX
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link href="/sync/import">
                Открыть импорт <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileDown className="h-5 w-5" />
              Экспорт
            </CardTitle>
            <CardDescription>Ведомость ЗП, выпуск, расход</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="secondary" className="w-full">
              <a href={`/api/export/payroll?from=${from}&to=${to}&period=${period}`}>
                Ведомость ЗП за месяц
              </a>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <a href={`/api/export/production?from=${from}&to=${to}`}>
                Выпуск продукции
              </a>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <a href={`/api/export/materials?from=${from}&to=${to}`}>
                Расход материалов
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Журнал
            </CardTitle>
            <CardDescription>История синхронизаций</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/sync/log">
                Открыть журнал <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
