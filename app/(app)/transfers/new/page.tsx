import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import { CreateTransferForm } from "./create-form";

export default async function NewTransferPage() {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: wsRaw } = await supabase
    .from("workshops")
    .select("id, code, name")
    .eq("is_active", true)
    .order("seq_order");
  const workshops = (wsRaw ?? []) as Pick<Tables<"workshops">, "id" | "code" | "name">[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Новое перемещение"
        description="Передача продукции с вашего склада другому цеху"
      />
      <CreateTransferForm
        workshops={workshops}
        defaultFromId={user?.employee?.workshop_id ?? null}
        today={new Date().toISOString().slice(0, 10)}
      />
    </div>
  );
}