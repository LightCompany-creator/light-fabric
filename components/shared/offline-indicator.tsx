"use client";

import { useEffect, useState } from "react";
import { WifiOff, Cloud, AlertTriangle } from "lucide-react";
import { queueCount } from "@/lib/offline-queue";

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);
  const [counts, setCounts] = useState({ pending: 0, failed: 0 });

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOnline(navigator.onLine);
    setCounts(queueCount());

    const on = () => setOnline(true);
    const off = () => setOnline(false);
    const refreshCounts = () => setCounts(queueCount());

    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    window.addEventListener("lf-queue-changed", refreshCounts);
    // Также подхватываем изменения из других вкладок
    window.addEventListener("storage", refreshCounts);

    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
      window.removeEventListener("lf-queue-changed", refreshCounts);
      window.removeEventListener("storage", refreshCounts);
    };
  }, []);

  // Нет сети — главное предупреждение
  if (!online) {
    return (
      <div className="fixed left-1/2 top-2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-destructive/30 bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg">
        <WifiOff className="h-4 w-4" aria-hidden />
        <span>
          Нет связи
          {counts.pending > 0 ? ` · в очереди: ${counts.pending}` : ""}
        </span>
      </div>
    );
  }

  // Сеть есть, но что-то в очереди (синхронизация в процессе)
  if (counts.pending > 0) {
    return (
      <div className="fixed left-1/2 top-2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-accent/40 bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-lg">
        <Cloud className="h-4 w-4 animate-pulse" aria-hidden />
        <span>Синхронизация · {counts.pending} в очереди</span>
      </div>
    );
  }

  // Сеть есть, но есть failed мутации (требуют внимания)
  if (counts.failed > 0) {
    return (
      <div className="fixed left-1/2 top-2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-orange-400 bg-orange-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
        <AlertTriangle className="h-4 w-4" aria-hidden />
        <span>Не отправлено: {counts.failed}</span>
      </div>
    );
  }

  return null;
}
