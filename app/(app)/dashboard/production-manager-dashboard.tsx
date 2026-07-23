import Link from "next/link";
import { ArrowRight, CheckCircle2, Inbox, ListOrdered } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  countOrdersAwaitingAcceptance,
  countSuborderConfirmationsPending,
} from "@/lib/services/orders";
import { Card, CardContent } from "@/components/ui/card";

export async function ProductionManagerDashboard() {
  const supabase = createClient();
  const [awaiting, pendingConfirm] = await Promise.all([
    countOrdersAwaitingAcceptance(supabase),
    countSuborderConfirmationsPending(supabase),
  ]);

  return (
    <div className="space-y-4">
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <AttentionCard
          href="/orders"
          icon={Inbox}
          label="Новые заказы от коммерческого директора"
          count={awaiting}
          okText="Новых заказов нет"
        />
        <AttentionCard
          href="/orders/suborders"
          icon={CheckCircle2}
          label="Цеха подтвердили — ждут вашей проверки"
          count={pendingConfirm}
          okText="Всё разобрано"
        />
      </section>

      <Link href="/orders">
        <Card className="transition-colors hover:bg-secondary">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <ListOrdered className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">Все заказы на производство</span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>
    </div>
  );
}

function AttentionCard({
  href,
  icon: Icon,
  label,
  count,
  okText,
}: {
  href: string;
  icon: typeof Inbox;
  label: string;
  count: number;
  okText: string;
}) {
  const needsAttention = count > 0;
  return (
    <Link href={href}>
      <Card
        className={
          needsAttention
            ? "border-destructive/40 bg-destructive/5 transition-colors hover:bg-destructive/10"
            : "transition-colors hover:bg-secondary"
        }
      >
        <CardContent className="flex items-center justify-between pt-6">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 font-mono-tabular text-3xl font-bold">
              {needsAttention ? count : okText}
            </p>
          </div>
          <Icon className={needsAttention ? "h-6 w-6 text-destructive" : "h-6 w-6 text-muted-foreground"} />
        </CardContent>
      </Card>
    </Link>
  );
}
