"use client";

// Выбор участка сразу после входа (Д-7). Один начальник может вести несколько
// участков с одной учётной записи: у Размелы это Литейка ЭВА и ПВХ, Упаковка ЭВА
// и ПВХ. В 1С они объединены «производственным цехом» пользователя (v0.4,
// production_shop): его название идёт заголовком. Без него просто список.

import { ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Me, WorkshopRef } from "@/lib/api1c";

export function ChooseWorkshop({
  workshops,
  productionShop,
  userName,
  onPick,
  onSignOut,
}: {
  workshops: WorkshopRef[];
  productionShop?: Me["production_shop"];
  userName: string;
  onPick: (workshopId: string) => void;
  onSignOut: () => void;
}) {
  const count = productionShop
    ? `${workshops.length} ${plural(workshops.length, ["участок", "участка", "участков"])}`
    : `${workshops.length} ${plural(workshops.length, ["цех", "цеха", "цехов"])}`;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{productionShop ? productionShop.name : "Какой цех?"}</h1>
          <p className="text-sm text-muted-foreground">
            {userName} · {count}
          </p>
        </div>
        <Button variant="ghost" className="h-11" onClick={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Выйти
        </Button>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {workshops.map((w) => (
          <button
            key={w.id}
            type="button"
            onClick={() => onPick(w.id)}
            className="flex h-20 w-full items-center justify-between gap-3 rounded-md border border-input bg-card px-4 text-left transition-colors hover:bg-muted/60"
          >
            <span className="min-w-0">
              <span className="block truncate text-lg font-semibold">{w.name}</span>
              <span className="block truncate text-sm text-muted-foreground">{w.warehouse.name}</span>
            </span>
            <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
          </button>
        ))}
      </div>
    </div>
  );
}

function plural(n: number, forms: [string, string, string]): string {
  const abs = n % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
}
