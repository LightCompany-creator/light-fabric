import Link from "next/link";
import { ArrowRight, Factory, Route, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";

const highlights = [
  {
    icon: Factory,
    label: "Смены",
    value: "учёт выработки",
  },
  {
    icon: Route,
    label: "Партии",
    value: "движение по цехам",
  },
  {
    icon: ShieldCheck,
    label: "1С",
    value: "выгрузка ведомостей",
  },
];

const workshops = ["Литьё", "Упаковка", "Клей", "Обшив", "Маркировка"];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-brand-mist text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="font-mono text-sm font-medium text-brand">
              Light Company
            </p>
            <p className="text-xs text-muted-foreground">
              Производственный контур
            </p>
          </div>
          <Button asChild variant="outline" className="bg-white">
            <Link href="/login">Войти</Link>
          </Button>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="max-w-2xl">
            <p className="mb-4 inline-flex rounded-md bg-brand-pale px-3 py-1 text-sm font-medium text-brand-dark">
              MES для цехового учёта
            </p>
            <h1 className="text-5xl font-bold text-brand-dark sm:text-6xl">
              LightFlow
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-muted-foreground">
              Система оперативного учёта для производства Light Company:
              сменная выработка, партии, расход сырья и сдельная зарплата без
              бумажных тетрадей.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/login">
                  Войти в систему
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/dashboard">Открыть дашборд</Link>
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-white p-5 shadow-sm">
            <div className="grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-brand-pale bg-brand-mist p-4"
                >
                  <item.icon
                    className="mb-4 size-5 text-brand"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-semibold text-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-md border p-4">
              <p className="text-sm font-semibold text-foreground">
                Маршрут партии
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {workshops.map((workshop, index) => (
                  <div key={workshop} className="flex items-center gap-2">
                    <span className="rounded-md bg-brand-pale px-3 py-2 text-sm font-medium text-brand-dark">
                      {workshop}
                    </span>
                    {index < workshops.length - 1 ? (
                      <ArrowRight
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
