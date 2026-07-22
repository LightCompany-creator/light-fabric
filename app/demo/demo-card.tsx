"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  Calculator,
  ClipboardList,
  LayoutDashboard,
  ListOrdered,
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
      "Перемещения между цехами и остатки складов",
      "Отчёт по производству и ведомости ЗП",
    ],
    icon: LayoutDashboard,
    accent: "bg-brand-pale text-brand-dark",
  },
  {
    role: "accountant",
    title: "Бухгалтер",
    description: "Зарплата, выпуск, остатки, обмен с 1С.",
    capabilities: [
      "Ведомости сдельной ЗП",
      "Остатки по складам цехов",
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
    role: "production_manager",
    title: "Начальник производства",
    description: "Заказы от коммерческого отдела → подзаказы по цехам.",
    capabilities: [
      "Создание заказа на производство",
      "Разбивка заказа на подзаказы по цехам со сроками",
      "Разбор запросов на корректировку от цехов",
      "Закрытие заказа, когда закрыты все подзаказы",
    ],
    icon: ListOrdered,
    accent: "bg-orange-100 text-orange-800",
  },
  {
    role: "foreman",
    title: "Начальник цеха",
    description: "Смены, выработка, перемещения и склад своего цеха.",
    capabilities: [
      "Открытие/закрытие смены",
      "Учёт выработки за смену по работникам",
      "Приём подзаказов от начальника производства, план/факт",
      "Передача продукции другому цеху (документ перемещения)",
      "Приём входящих перемещений и остатки своего склада",
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
      "Переоткрытие закрытых документов перемещения",
      "Управление справочниками и пользователями",
      "Обмен с 1С и журнал синхронизаций",
    ],
    icon: ShieldCheck,
    accent: "bg-violet-100 text-violet-800",
  },
];

// Начальники цехов — для теста перемещений между цехами.
// В боевой версии у каждого будет свой личный логин и пароль.
const WORKSHOPS: { code: string; name: string; chief: string }[] = [
  { code: "LIT", name: "Литейка", chief: "Начальник Литейки" },
  { code: "CUT", name: "Рубка/Крой", chief: "Начальник Кроя" },
  { code: "SEW", name: "Швейка", chief: "Начальник Швейки" },
  { code: "ASSY", name: "Обшив", chief: "Начальник Обшива" },
  { code: "GLU", name: "Клеевой", chief: "Начальник Клеевого" },
  { code: "MARK", name: "Маркировка и упаковка", chief: "Начальник Маркировки" },
  { code: "SHIP", name: "Склад Кисловодск", chief: "Начальник Склада" },
  { code: "ANG", name: "Химия и сырьё", chief: "Начальник Ангара" },
  { code: "PACK", name: "Упаковка", chief: "Начальник Упаковки" },
  { code: "LST", name: "Листы", chief: "Начальник Листов" },
];

export function DemoGrid() {
  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ROLES.map((r) => (
          <DemoCard key={r.role} {...r} />
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-brand-dark">
          Начальники цехов — тест перемещений
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Войди за один цех, создай перемещение, затем войди за цех-получатель
          и прими документ. В рабочей версии у каждого будет личный логин.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {WORKSHOPS.map((w) => (
            <WorkshopCard key={w.code} {...w} />
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkshopCard({
  code,
  name,
  chief,
}: {
  code: string;
  name: string;
  chief: string;
}) {
  const [state, formAction] = useFormState(demoLoginAction, INITIAL);

  return (
    <form
      action={formAction}
      className="flex h-full flex-col rounded-lg border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <input type="hidden" name="role" value={`foreman-${code}`} />
      <p className="font-mono text-xs uppercase tracking-widest text-brand">
        {code}
      </p>
      <h3 className="mt-1 font-semibold text-foreground">{name}</h3>
      <p className="mt-1 flex-1 text-xs text-muted-foreground">{chief}</p>
      {state.error ? (
        <p className="mt-2 text-xs text-destructive">{state.error}</p>
      ) : null}
      <WorkshopSubmit />
    </form>
  );
}

function WorkshopSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="secondary"
      size="sm"
      className="mt-3 w-full"
      disabled={pending}
    >
      {pending ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
      Войти
    </Button>
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
