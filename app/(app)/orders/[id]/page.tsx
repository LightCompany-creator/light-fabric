import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { Tables } from "@/lib/supabase/types";
import { getSuborderProgressTotals } from "@/lib/services/orders";
import { OrderDoc } from "./order-doc";

export default async function OrderPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: docRaw } = await supabase
    .from("production_orders")
    .select(
      "*, created_by_emp:employees!production_orders_created_by_fkey(full_name), closed_by_emp:employees!production_orders_closed_by_fkey(full_name)",
    )
    .eq("id", params.id)
    .maybeSingle();
  if (!docRaw) notFound();
  const doc = docRaw as Tables<"production_orders"> & {
    created_by_emp: { full_name: string } | null;
    closed_by_emp: { full_name: string } | null;
  };

  const { data: linesRaw } = await supabase
    .from("production_order_lines")
    .select("id, article_id, qty, article:articles(code, name)")
    .eq("order_id", params.id)
    .order("created_at");
  const lines = (linesRaw ?? []) as {
    id: string;
    article_id: string;
    qty: number;
    article: Pick<Tables<"articles">, "code" | "name"> | null;
  }[];

  const { data: subsRaw } = await supabase
    .from("production_suborders")
    .select("*, workshop:workshops(code, name)")
    .eq("order_id", params.id)
    .order("created_at");
  const suborders = (subsRaw ?? []) as (Tables<"production_suborders"> & {
    workshop: Pick<Tables<"workshops">, "code" | "name"> | null;
  })[];

  const progressTotals = await getSuborderProgressTotals(
    supabase,
    suborders.map((s) => s.id),
  );

  const { data: articlesRaw } = await supabase
    .from("articles")
    .select("id, code, name")
    .eq("is_active", true)
    .order("code");
  const articles = (articlesRaw ?? []) as Pick<Tables<"articles">, "id" | "code" | "name">[];

  const { data: wsRaw } = await supabase
    .from("workshops")
    .select("id, code, name")
    .eq("is_active", true)
    .order("seq_order");
  const workshops = (wsRaw ?? []) as Pick<Tables<"workshops">, "id" | "code" | "name">[];

  const canManage = user?.role === "production_manager" || user?.role === "admin";
  const canCreate = user?.role === "commercial_director" || canManage;

  return (
    <OrderDoc
      doc={{
        id: doc.id,
        docNumber: doc.doc_number,
        orderDate: doc.order_date,
        dueDate: doc.due_date,
        status: doc.status,
        comment: doc.comment,
        createdByName: doc.created_by_emp?.full_name ?? null,
        closedByName: doc.closed_by_emp?.full_name ?? null,
        closedAt: doc.closed_at,
      }}
      lines={lines.map((l) => ({
        id: l.id,
        qty: l.qty,
        articleCode: l.article?.code ?? "—",
        articleName: l.article?.name ?? "—",
      }))}
      suborders={suborders.map((s) => {
        const totals = progressTotals.get(s.id) ?? { planned: 0, produced: 0 };
        return {
          id: s.id,
          docNumber: s.doc_number,
          status: s.status,
          dueDate: s.due_date,
          workshop: s.workshop ? `${s.workshop.code} · ${s.workshop.name}` : "—",
          planned: totals.planned,
          produced: totals.produced,
        };
      })}
      articles={articles}
      workshops={workshops}
      canManage={canManage}
      canCreate={canCreate}
    />
  );
}
