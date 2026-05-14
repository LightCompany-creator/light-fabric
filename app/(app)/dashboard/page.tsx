import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowRight } from "lucide-react";
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
import { DirectorDashboard } from "./director-dashboard";
import { ForemanDashboard } from "./foreman-dashboard";

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName =
    user.employee?.full_name?.split(" ").slice(1).join(" ") ||
    user.employee?.full_name ||
    "коллега";

  const now = new Date();
  const greeting = greetByHour(now.getHours());
  const today = format(now, "d MMMM yyyy 'г.'", { locale: ru });

  let content: React.ReactNode;
  if (user.role === "director" || user.role === "admin") {
    content = <DirectorDashboard />;
  } else if (user.role === "foreman") {
    content = <ForemanDashboard user={user} />;
  } else if (user.role === "technologist") {
    content = <TechnologistDashboard />;
  } else if (user.role === "accountant") {
    content = <AccountantDashboard />;
  } else {
    content = <UnassignedDashboard />;
  }

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

      {content}
    </div>
  );
}

function TechnologistDashboard() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <NavCard href="/catalog/articles" title="Артикулы" desc="Каталог продукции" />
      <NavCard href="/catalog/rates" title="Расценки" desc="Сдельная зарплата" />
      <NavCard href="/catalog/norms" title="Нормы расхода" desc="Материалы на пару" />
      <NavCard href="/catalog/employees" title="Работники" desc="Кто в какой бригаде" />
    </div>
  );
}

function AccountantDashboard() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <NavCard
        href="/reports/payroll"
        title="Ведомости ЗП"
        desc="Расчёт сделки за период"
      />
      <NavCard
        href="/reports/materials"
        title="Расход материалов"
        desc="Сводка по сырью"
      />
      <NavCard
        href="/reports/production"
        title="Выпуск продукции"
        desc="Что произведено"
      />
      <NavCard href="/sync" title="Обмен с 1С" desc="XLSX-выгрузки и загрузки" />
    </div>
  );
}

function UnassignedDashboard() {
  return (
    <Card>
      <CardContent className="py-12 text-center text-muted-foreground">
        Роль не назначена — обратитесь к администратору
      </CardContent>
    </Card>
  );
}

function NavCard({
  href,
  title,
  desc,
}: {
  href: string;
  title: string;
  desc: string;
}) {
  return (
    <Link href={href}>
      <Card className="transition-colors hover:bg-secondary">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            {title}
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
          <CardDescription>{desc}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

function greetByHour(h: number): string {
  if (h < 6) return "Доброй ночи";
  if (h < 12) return "Доброе утро";
  if (h < 18) return "Добрый день";
  return "Добрый вечер";
}
