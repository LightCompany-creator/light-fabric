import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import { ROUTE_SEQUENCES, type RouteType, type WorkshopCode } from "@/lib/constants";
import { RouteEditor } from "./route-editor";

export default async function EditRoutePage({
  params,
}: {
  params: { articleId: string };
}) {
  const supabase = createClient();
  const [{ data: article }, { data: route }] = await Promise.all([
    supabase
      .from("articles")
      .select("id, code, name, route_type")
      .eq("id", params.articleId)
      .maybeSingle(),
    supabase
      .from("routes")
      .select("sequence")
      .eq("article_id", params.articleId)
      .maybeSingle(),
  ]);

  const a = article as Pick<Tables<"articles">, "id" | "code" | "name" | "route_type"> | null;
  if (!a) notFound();

  // Если маршрута нет — берём типовой для route_type как стартовый
  const r = route as { sequence: WorkshopCode[] } | null;
  const initial: WorkshopCode[] =
    r?.sequence && Array.isArray(r.sequence)
      ? (r.sequence as WorkshopCode[])
      : ROUTE_SEQUENCES[a.route_type as RouteType];

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Маршрут · ${a.code}`}
        description={a.name}
      />
      <RouteEditor articleId={a.id} initial={initial} />
    </div>
  );
}
