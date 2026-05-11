import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import { EmployeeForm } from "../employee-form";

export default async function EditEmployeePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [{ data: emp }, { data: ws }] = await Promise.all([
    supabase.from("employees").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("workshops")
      .select("id, code, name")
      .eq("is_active", true)
      .order("seq_order"),
  ]);

  const employee = emp as Tables<"employees"> | null;
  const workshops = (ws ?? []) as Pick<Tables<"workshops">, "id" | "code" | "name">[];

  if (!employee) notFound();

  return (
    <div className="space-y-4">
      <PageHeader
        title={employee.full_name}
        description={`Табельный № ${employee.tab_number}`}
      />
      <EmployeeForm
        mode="edit"
        id={employee.id}
        workshops={workshops}
        initial={{
          tab_number: employee.tab_number,
          full_name: employee.full_name,
          workshop_id: employee.workshop_id,
          position: employee.position,
          role: employee.role,
          is_active: employee.is_active,
          hire_date: employee.hire_date,
        }}
      />
    </div>
  );
}
