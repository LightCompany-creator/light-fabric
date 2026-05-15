"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition } from "react";
import { Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type Preset = "today" | "week" | "month" | "custom";

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoIso(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export function DashboardDateRangePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const currentFrom = searchParams.get("from") ?? "";
  const currentTo = searchParams.get("to") ?? "";
  const currentPeriod = searchParams.get("period") ?? "";

  // Определяем активный preset по URL
  const activePreset: Preset =
    currentFrom && currentTo
      ? "custom"
      : currentPeriod === "today"
        ? "today"
        : currentPeriod === "month"
          ? "month"
          : "week";

  const [showCustom, setShowCustom] = useState(activePreset === "custom");
  const [customFrom, setCustomFrom] = useState(
    currentFrom || daysAgoIso(6),
  );
  const [customTo, setCustomTo] = useState(currentTo || todayIso());

  const apply = (params: Record<string, string | null>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v) sp.set(k, v);
    }
    const qs = sp.toString();
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname);
    });
  };

  const selectPreset = (p: Preset) => {
    if (p === "custom") {
      setShowCustom(true);
      return;
    }
    setShowCustom(false);
    apply({ period: p });
  };

  const applyCustom = () => {
    if (!customFrom || !customTo) return;
    if (customFrom > customTo) return;
    apply({ from: customFrom, to: customTo });
  };

  const presetBtn = (id: Preset, label: string) => (
    <Button
      key={id}
      type="button"
      variant={activePreset === id ? "default" : "outline"}
      size="sm"
      onClick={() => selectPreset(id)}
      disabled={pending}
    >
      {label}
    </Button>
  );

  return (
    <Card className="p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden />
        <span className="text-sm font-medium text-muted-foreground">Период:</span>
        {presetBtn("today", "Сегодня")}
        {presetBtn("week", "Неделя")}
        {presetBtn("month", "Месяц")}
        {presetBtn("custom", "Произвольно")}
        {pending ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
      </div>

      {showCustom ? (
        <div className="mt-3 flex flex-wrap items-end gap-2 border-t pt-3">
          <div>
            <label className="block text-xs text-muted-foreground" htmlFor="from">
              С
            </label>
            <Input
              id="from"
              type="date"
              value={customFrom}
              max={customTo || todayIso()}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="w-44"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground" htmlFor="to">
              По
            </label>
            <Input
              id="to"
              type="date"
              value={customTo}
              min={customFrom}
              max={todayIso()}
              onChange={(e) => setCustomTo(e.target.value)}
              className="w-44"
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={applyCustom}
            disabled={pending || !customFrom || !customTo || customFrom > customTo}
          >
            Применить
          </Button>
        </div>
      ) : null}
    </Card>
  );
}
