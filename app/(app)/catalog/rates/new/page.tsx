import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import { RateForm } from "../rate-form";

export default async function NewRatePage() {
  const supabase = createClient();
  const [ws, ar] = await Promise.all([
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

  const workshops = (ws.data ?? []) as Pick<Tables<"workshops">, "id" | "code" | "name">[];
  const articles = (ar.data ?? []) as Pick<Tables<"articles">, "id" | "code" | "name">[];

  return (
    <div className="space-y-4">
      <PageHeader title="Новая расценка" />
      <RateForm mode="create" workshops={workshops} articles={articles} />
    </div>
  );
}
