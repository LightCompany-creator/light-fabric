"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  Calculator,
  ClipboardList,
  LayoutDashboard,
  Loader2,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { demoLoginAction, type DemoLoginState } from "./actions";

const INITIAL: DemoLoginState = { error: null };

type Role = {
  role: string;
  title: string;
  description: string;
  capabilities: string[];
  icon: LucideIcon;
  accent: string;
};

const ROLES: Role[] = [
  {
    role: "director",
    title: "Руководитель",
    description: "Дашборд с KPI и отчётами по производству.",
    capabilities: [
      "Сводный дашборд: выпуск, ФОТ, расход материалов",
      "Все смены и выработка по всем цехам",
      "Отчёт по производству и ведомости ЗП",
    ],
    icon: LayoutDashboard,
    accent: "bg-brand-pale text-brand-dark",
  },
  {
    role: "accountant",
    title: "Бухгалтер",
    description: "Зарплата, выпуск, обмен с 1С.",
    capabilities: [
      "Ведомости сдельной ЗП",
      "Выпуск и расход материалов",
      "Импорт справочников и выгрузка в 1С",
    ],
    icon: Calculator,
    accent: "bg-amber-100 text-amber-800",
  },
  {
    role: "technologist",
    title: "Технолог",
    description: "Справочники: артикулы, расценки, нормы.",
    capabilities: [
      "Артикулы, материалы, цеха",
      "Расценки и нормы расхода",
      "Список работников",
    ],
    icon: Wrench,
    accent: "bg-sky-100 text-sky-800",
  },
  {
    role: "foreman",
    title: "Начальник цеха",
    description: "Смены, выработка и бригада своего цеха.",
    capabilities: [
      "Открытие/закрытие смены",
      "Учёт выработки за смену",
      "Список бригады и сделка",
    ],
    icon: ClipboardList,
    accent: "bg-emerald-100 text-emerald-800",
  },
  {
    role: "admin",
    title: "Администратор",
    description: "Полный доступ ко всем разделам системы.",
    capabilities: [
      "Все возможности других ролей в одном меню",
      "Управление справочниками и пользователями",
      "Обмен с 1С и журнал синхронизаций",
    ],
    icon: ShieldCheck,
    accent: "bg-violet-100 text-violet-800",
  },
];

export function DemoGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {ROLES.map((r) => (
        <DemoCard key={r.role} {...r} />
      ))}
    </div>
  );
}

function DemoCard({
  role,
  title,
  description,
  capabilities,
  icon: Icon,
  accent,
}: Role) {
  const [state, formAction] = useFormState(demoLoginAction, INITIAL);

  return (
    <form
      action={formAction}
      className="flex h-full flex-col rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <input type="hidden" name="role" value={role} />
      <div
        className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-md ${accent}`}
      >
        <Icon className="h-6 w-6" aria-hidden="true" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <ul className="mt-4 flex-1 space-y-1.5 text-sm text-foreground">
        {capabilities.map((c) => (
          <li key={c} className="flex gap-2">
            <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-brand" />
            <span>{c}</span>
          </li>
        ))}
      </ul>
      {state.error ? (
        <p className="mt-3 text-sm text-destructive">{state.error}</p>
      ) : null}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="mt-5 w-full" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Войти
    </Button>
  );
}
