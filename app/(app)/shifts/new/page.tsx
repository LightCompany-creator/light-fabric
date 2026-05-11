import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { getCurrentUser } from "@/lib/auth";
import { PageHeader } from "@/components/shared/page-header";
import { OpenShiftForm } from "./open-form";

export default async function NewShiftPage() {
  const supabase = createClient();
  const user = await getCurrentUser();
  const { data: ws } = await supabase
    .from("workshops")
    .select("id, code, name")
    .eq("is_active", true)
    .order("seq_order");
  const workshops = (ws ?? []) as Pick<Tables<"workshops">, "id" | "code" | "name">[];

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Новая смена"
        description="Открытие смены — записи выработки и работники добавляются дальше"
      />
      <OpenShiftForm
        workshops={workshops}
        defaultWorkshopId={user?.employee?.workshop_id ?? null}
        today={today}
      />
    </div>
  );
}
