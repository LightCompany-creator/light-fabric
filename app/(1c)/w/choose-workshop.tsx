"use client";

// Выбор цеха сразу после входа (Д-7). Один начальник производства ведёт Литейный
// цех, а в нём четыре участка с разными людьми, номенклатурой и складами:
// Литейка ЭВА и ПВХ, Упаковка ЭВА и ПВХ. Участки приходят из 1С как цеха
// с общим parent, поэтому экран показывает сначала цех, внутри него участки.

import { ChevronRight, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkshopRef } from "@/lib/api1c";

type Group = { key: string; parent: WorkshopRef["parent"] | null; items: WorkshopRef[] };

function groupByParent(workshops: WorkshopRef[]): Group[] {
  const groups: Group[] = [];
  for (const w of workshops) {
    const key = w.parent?.id ?? "own";
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, parent: w.parent ?? null, items: [] };
      groups.push(group);
    }
    group.items.push(w);
  }
  return groups;
}

export function ChooseWorkshop({
  workshops,
  userName,
  onPick,
  onSignOut,
}: {
  workshops: WorkshopRef[];
  userName: string;
  onPick: (workshopId: string) => void;
  onSignOut: () => void;
}) {
  const groups = groupByParent(workshops);
  // Один цех с участками: его имя в заголовке, выбирается участок.
  const onlyParent = groups.length === 1 ? groups[0].parent : null;

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{onlyParent ? onlyParent.name : "Какой цех?"}</h1>
          <p className="text-sm text-muted-foreground">
            {userName} ·{" "}
            {onlyParent
              ? `${workshops.length} ${plural(workshops.length, ["участок", "участка", "участков"])}`
              : `${workshops.length} ${plural(workshops.length, ["цех", "цеха", "цехов"])}`}
          </p>
        </div>
        <Button variant="ghost" className="h-11" onClick={onSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Выйти
        </Button>
      </header>

      {groups.map((group) => (
        <section key={group.key} className="space-y-3">
          {!onlyParent && group.parent ? (
            <h2 className="text-base font-semibold">{group.parent.name}</h2>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            {group.items.map((w) => (
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
        </section>
      ))}
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
