import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export type TopListItem = {
  key: string;
  label: string;
  sub?: string;
  value: number;
  max?: number;
  color?: string;
};

export function TopList({
  title,
  items,
  unit,
  emptyMessage = "Данных пока нет",
}: {
  title: string;
  items: TopListItem[];
  unit?: string;
  emptyMessage?: string;
}) {
  const max =
    items.length > 0
      ? Math.max(...items.map((i) => i.max ?? i.value))
      : 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="space-y-3">
            {items.map((it) => {
              const pct = max > 0 ? Math.round((it.value / max) * 100) : 0;
              return (
                <div key={it.key} className="space-y-1">
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="truncate font-medium">{it.label}</span>
                    <span className="font-mono-tabular text-muted-foreground">
                      {it.value.toLocaleString("ru-RU")}
                      {unit ? (
                        <span className="ml-1 text-xs">{unit}</span>
                      ) : null}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${pct}%`,
                        backgroundColor: it.color ?? "var(--brand)",
                      }}
                    />
                  </div>
                  {it.sub ? (
                    <p className="text-xs text-muted-foreground">{it.sub}</p>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
