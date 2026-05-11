import { format } from "date-fns";
import { ru } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { requireUser } from "@/lib/auth";
import { USER_ROLE_LABELS } from "@/lib/constants";

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName =
    user.employee?.full_name?.split(" ").slice(1).join(" ") ||
    user.employee?.full_name ||
    "коллега";

  const now = new Date();
  const greeting = greetByHour(now.getHours());
  const today = format(now, "d MMMM yyyy 'г.'", { locale: ru });

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {today}
        </p>
        <h1 className="text-3xl font-bold tracking-tight">
          {greeting}, {firstName}!
        </h1>
        <div className="flex items-center gap-2 pt-1">
          {user.role ? (
            <Badge variant="secondary">{USER_ROLE_LABELS[user.role]}</Badge>
          ) : (
            <Badge variant="destructive">Роль не назначена</Badge>
          )}
          {user.employee?.workshop ? (
            <Badge variant="outline">{user.employee.workshop.name}</Badge>
          ) : null}
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <PlaceholderKpi label="Партий в работе" hint="загрузим на неделе 5" />
        <PlaceholderKpi label="Выпуск сегодня" hint="пар продукции" />
        <PlaceholderKpi label="ФОТ за день" hint="по закрытым сменам" />
        <PlaceholderKpi label="Брак" hint="процент за сутки" />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Каркас приложения готов</CardTitle>
          <CardDescription>
            Дальше: справочники (Веха 4), смены литейки (Веха 5), движение
            партий, дашборды и отчёты. Этот dashboard оживёт на Вехе 7.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
}

function PlaceholderKpi({ label, hint }: { label: string; hint: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardDescription>{label}</CardDescription>
        <CardTitle className="font-mono-tabular text-3xl text-muted-foreground">
          —
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </CardContent>
    </Card>
  );
}

function greetByHour(h: number): string {
  if (h < 6) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}
