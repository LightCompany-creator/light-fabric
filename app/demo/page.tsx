import Link from "next/link";
import { DemoGrid } from "./demo-card";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-brand-mist">
      <div className="mx-auto w-full max-w-6xl px-5 py-10 sm:px-8 lg:px-10">
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-brand">
              Light Company · Демо
            </p>
            <h1 className="mt-2 text-4xl font-bold text-brand-dark sm:text-5xl">
              LightFabric
            </h1>
            <p className="mt-3 max-w-2xl text-base text-muted-foreground">
              Демонстрация системы цехового учёта. Выбери роль — войдёшь
              одним кликом и увидишь интерфейс глазами этого пользователя.
            </p>
          </div>
          <Link
            href="/login"
            className="hidden text-sm font-medium text-brand hover:text-brand-dark sm:inline"
          >
            Обычный вход →
          </Link>
        </header>

        <DemoGrid />

        <p className="mt-8 text-xs text-muted-foreground">
          Все демо-аккаунты используют пароль <code>Test123!</code> и созданы
          скриптом <code>scripts/seed-users.mjs</code>.
        </p>
      </div>
    </main>
  );
}
