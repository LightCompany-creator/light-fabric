import Link from "next/link";
import { WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export const dynamic = "force-static";

const links = [
  { href: "/w", label: "Рабочее место цеха" },
  { href: "/enter", label: "Войти заново" },
];

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-mist p-6">
      <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center shadow-sm">
        <WifiOff className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold text-foreground">Нет связи</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Похоже, связь пропала. Проверь Wi-Fi и попробуй снова.
          Уже открытые страницы продолжают работать из кэша.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          {links.map((link, index) => (
            <Button key={link.href} asChild variant={index === 0 ? "default" : "ghost"}>
              <Link href={link.href}>{link.label}</Link>
            </Button>
          ))}
        </div>
      </div>
    </main>
  );
}
