import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import { RateForm } from "../rate-form";

export default async function EditRatePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [{ data: rate }, ws, ar] = await Promise.all([
    supabase.from("rates").select("*").eq("id", params.id).maybeSingle(),
    supabase
      .from("workshops")
      .select("id, code, name")
      .eq("is_active", true)
      .order("seq_order"),
    supabase
      .from("articles")
      .select("id, code, name")
      .eq("is_active", true)
      .order("code"),
  ]);

  const r = rate as Tables<"rates"> | null;
  const workshops = (ws.data ?? []) as Pick<Tables<"workshops">, "id" | "code" | "name">[];
  const articles = (ar.data ?? []) as Pick<Tables<"articles">, "id" | "code" | "name">[];

  if (!r) notFound();

  return (
    <div className="space-y-4">
      <PageHeader title="Редактирование расценки" />
      <RateForm
        mode="edit"
        id={r.id}
        workshops={workshops}
        articles={articles}
        initial={{
          workshop_id: r.workshop_id ?? "",
          article_id: r.article_id,
          operation: r.operation,
          rate_per_unit: Number(r.rate_per_unit),
          unit_type: r.unit_type,
          valid_from: r.valid_from,
          valid_to: r.valid_to,
        }}
      />
    </div>
  );
}
