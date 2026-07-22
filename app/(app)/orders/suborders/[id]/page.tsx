import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { Tables } from "@/lib/supabase/types";
import { getSuborderProgress } from "@/lib/services/orders";
import { SuborderDoc } from "./suborder-doc";

export default async function SuborderPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: docRaw } = await supabase
    .from("production_suborders")
    .select(
      "*, workshop:workshops(id, code, name), order:production_orders(doc_number), accepted_by_emp:employees!production_suborders_accepted_by_fkey(full_name), workshop_confirmed_by_emp:employees!production_suborders_workshop_confirmed_by_fkey(full_name), production_confirmed_by_emp:employees!production_suborders_production_confirmed_by_fkey(full_name)",
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!docRaw) notFound();
  const doc = docRaw as Tables<"production_suborders"> & {
    workshop: Pick<Tables<"workshops">, "id" | "code" | "name"> | null;
    order: Pick<Tables<"production_orders">, "doc_number"> | null;
    accepted_by_emp: { full_name: string } | null;
    workshop_confirmed_by_emp: { full_name: string } | null;
    production_confirmed_by_emp: { full_name: string } | null;
  };

  const { data: linesRaw } = await supabase
    .from("production_suborder_lines")
    .select("id, article_id, qty, article:articles(code, name)")
    .eq("suborder_id", params.id)
    .order("created_at");
  const lines = (linesRaw ?? []) as {
    id: string;
    article_id: string;
    qty: number;
    article: Pick<Tables<"articles">, "code" | "name"> | null;
  }[];

  const progress = await getSuborderProgress(supabase, params.id);
  const producedByArticle = new Map(progress.map((p) => [p.article_id, p.produced_qty]));

  const { data: articlesRaw } = await supabase
    .from("articles")
    .select("id, code, name")
    .eq("is_active", true)
    .order("code");
  const articles = (articlesRaw ?? []) as Pick<Tables<"articles">, "id" | "code" | "name">[];

  const isForemanOfThisWorkshop =
    user?.role === "foreman" && user.employee?.workshop_id === doc.workshop_id;
  const isProductionSide = user?.role === "production_manager" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const canEditLines = isProductionSide;
  const canActWorkshopSide = isForemanOfThisWorkshop || isAdmin;

  return (
    <SuborderDoc
      doc={{
        id: doc.id,
        docNumber: doc.doc_number,
        orderDocNumber: doc.order?.doc_number ?? "—",
        workshop: doc.workshop ? `${doc.workshop.code} · ${doc.workshop.name}` : "—",
        dueDate: doc.due_date,
        status: doc.status,
        correctionComment: doc.correction_comment,
        acceptedByName: doc.accepted_by_emp?.full_name ?? null,
        workshopConfirmedByName: doc.workshop_confirmed_by_emp?.full_name ?? null,
        workshopConfirmedAt: doc.workshop_confirmed_at,
        productionConfirmedByName: doc.production_confirmed_by_emp?.full_name ?? null,
        productionConfirmedAt: doc.production_confirmed_at,
      }}
      lines={lines.map((l) => ({
        id: l.id,
        qty: l.qty,
        articleCode: l.article?.code ?? "—",
        articleName: l.article?.name ?? "—",
        producedQty: producedByArticle.get(l.article_id) ?? 0,
      }))}
      articles={articles}
      canEditLines={canEditLines}
      canActWorkshopSide={canActWorkshopSide}
      canActProductionSide={isProductionSide}
      isAdmin={isAdmin}
    />
  );
}
