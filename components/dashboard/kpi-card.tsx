import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  unit,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: "neutral" | "success" | "warn" | "danger" | "brand";
  hint?: string;
}) {
  const toneCls: Record<typeof tone, string> = {
    neutral: "text-foreground",
    success: "text-success",
    warn: "text-accent",
    danger: "text-destructive",
    brand: "text-brand",
  };
  return (
    <Card>
      <CardContent className="space-y-1 pt-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className={cn("font-mono-tabular text-3xl font-bold", toneCls[tone])}>
          {value}
          {unit ? (
            <span className="ml-1 text-base font-normal text-muted-foreground">
              {unit}
            </span>
          ) : null}
        </p>
        {hint ? (
          <p className="text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
