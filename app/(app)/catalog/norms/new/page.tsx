import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import { NormForm } from "../norm-form";

export default async function NewNormPage() {
  const supabase = createClient();
  const [ar, mt] = await Promise.all([
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

  const articles = (ar.data ?? []) as Pick<Tables<"articles">, "id" | "code" | "name">[];
  const materials = (mt.data ?? []) as Pick<
    Tables<"materials">,
    "id" | "code" | "name" | "unit"
  >[];

  return (
    <div className="space-y-4">
      <PageHeader title="Новая норма расхода" />
      <NormForm mode="create" articles={articles} materials={materials} />
    </div>
  );
}
