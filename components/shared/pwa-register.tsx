"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "lf-install-dismissed-until";
const DISMISS_DAYS = 14;

export function PwaRegister() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);

  // 1. Регистрация Service Worker
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV === "development") return;

    const onLoad = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch((err) => console.warn("SW registration failed:", err));
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
  }, []);

  // 2. Перехват install-prompt
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: Event) => {
      e.preventDefault();
      const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0);
      if (Date.now() < dismissedUntil) return;
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!promptEvent) return null;

  const install = async () => {
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    if (outcome === "dismissed") {
      const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem(DISMISS_KEY, String(until));
    }
    setPromptEvent(null);
  };

  const dismiss = () => {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(DISMISS_KEY, String(until));
    setPromptEvent(null);
  };

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded-lg border bg-white p-4 shadow-lg sm:bottom-6">
      <div className="flex items-start gap-3">
        <Download className="mt-0.5 h-5 w-5 shrink-0 text-brand" aria-hidden />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">
            Установить LightFabric
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Установи как приложение — быстрее открывается, работает оффлайн,
            иконка на главном экране.
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" onClick={install}>
              Установить
            </Button>
            <Button size="sm" variant="ghost" onClick={dismiss}>
              Позже
            </Button>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Закрыть"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
