import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-static";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-mist p-6">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center shadow-sm">
        <WifiOff className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Нет интернета</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Похоже, связь пропала. Проверь Wi-Fi или сотовую связь и попробуй снова.
          Уже открытые страницы продолжают работать из кэша.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Button asChild>
            <Link href="/dashboard">Открыть дашборд</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/shifts">Мои смены</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
