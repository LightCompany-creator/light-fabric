import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import { EmployeeForm } from "../employee-form";

export default async function NewEmployeePage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("workshops")
    .select("id, code, name")
    .eq("is_active", true)
    .order("seq_order");
  const workshops = (data ?? []) as Pick<Tables<"workshops">, "id" | "code" | "name">[];

  return (
    <div className="space-y-4">
      <PageHeader title="Новый работник" description="Карточка сотрудника" />
      <EmployeeForm mode="create" workshops={workshops} />
    </div>
  );
}
