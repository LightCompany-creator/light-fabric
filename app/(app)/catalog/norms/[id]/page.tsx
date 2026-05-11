import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import { NormForm } from "../norm-form";

export default async function EditNormPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [{ data: norm }, ar, mt] = await Promise.all([
    supabase.from("norms").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("articles")
      .select("id, code, name")
      .eq("is_active", true)
      .order("code"),
    supabase
      .from("materials")
      .select("id, code, name, unit")
      .eq("is_active", true)
      .order("name"),
  ]);

  const n = norm as Tables<"norms"> | null;
  if (!n) notFound();

  const articles = (ar.data ?? []) as Pick<Tables<"articles">, "id" | "code" | "name">[];
  const materials = (mt.data ?? []) as Pick<
    Tables<"materials">,
    "id" | "code" | "name" | "unit"
  >[];

  return (
    <div className="space-y-4">
      <PageHeader title="Редактирование нормы" />
      <NormForm
        mode="edit"
        id={n.id}
        articles={articles}
        materials={materials}
        initial={{
          article_id: n.article_id,
          material_id: n.material_id,
          qty_per_pair: Number(n.qty_per_pair),
          notes: n.notes,
        }}
      />
    </div>
  );
}
