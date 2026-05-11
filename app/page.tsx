import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-brand-mist p-8">
      <div className="text-center">
        <p className="font-mono text-sm text-muted-foreground">Light Company</p>
        <h1 className="mt-1 text-5xl font-bold tracking-tight text-brand">
          LightFlow
        </h1>
        <p className="mt-3 max-w-md text-balance text-muted-foreground">
          MES-система оперативного цехового учёта. Замена бумажным тетрадям
          бригадиров.
        </p>
      </div>
      <Button asChild size="lg">
        <Link href="/login">Войти в систему</Link>
      </Button>
    </main>
  );
}
