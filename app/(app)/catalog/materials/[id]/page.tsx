import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import { MaterialForm } from "../material-form";

export default async function EditMaterialPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from("materials")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  const material = data as Tables<"materials"> | null;
  if (!material) notFound();

  return (
    <div className="space-y-4">
      <PageHeader title={material.name} description={`Код: ${material.code}`} />
      <MaterialForm
        mode="edit"
        id={material.id}
        initial={{
          code: material.code,
          name: material.name,
          unit: material.unit,
          current_stock: Number(material.current_stock),
          min_stock: Number(material.min_stock),
          is_active: material.is_active,
        }}
      />
    </div>
  );
}
