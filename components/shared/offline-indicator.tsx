"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineIndicator() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setOnline(navigator.onLine);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  if (online) return null;

  return (
    <div className="fixed left-1/2 top-2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-destructive/30 bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground shadow-lg">
      <WifiOff className="h-4 w-4" aria-hidden />
      <span>Нет связи — изменения не сохранятся</span>
    </div>
  );
}
