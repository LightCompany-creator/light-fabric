import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { Tables } from "@/lib/supabase/types";
import { getWorkshopStock } from "@/lib/services/transfers";
import { TransferDoc } from "./transfer-doc";

export default async function TransferPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: docRaw } = await supabase
    .from("transfers")
    .select(
      "*, from_workshop:workshops!transfers_from_workshop_id_fkey(id, code, name), to_workshop:workshops!transfers_to_workshop_id_fkey(id, code, name), created_by_emp:employees!transfers_created_by_fkey(full_name), accepted_by_emp:employees!transfers_accepted_by_fkey(full_name)",
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!docRaw) notFound();
  const doc = docRaw as Tables<"transfers"> & {
    from_workshop: Pick<Tables<"workshops">, "id" | "code" | "name"> | null;
    to_workshop: Pick<Tables<"workshops">, "id" | "code" | "name"> | null;
    created_by_emp: { full_name: string } | null;
    accepted_by_emp: { full_name: string } | null;
  };

  const { data: linesRaw } = await supabase
    .from("transfer_lines")
    .select("id, article_id, qty, article:articles(code, name)")
    .eq("transfer_id", params.id)
    .order("created_at");
  const lines = (linesRaw ?? []) as {
    id: string;
    article_id: string;
    qty: number;
    article: Pick<Tables<"articles">, "code" | "name"> | null;
  }[];

  // Остаток склада-отправителя — для подбора артикулов в открытом документе
  const stock = await getWorkshopStock(supabase, doc.from_workshop_id);
  const articleIds = stock.filter((s) => s.qty > 0).map((s) => s.article_id);

  let articles: { id: string; code: string; name: string; stockQty: number }[] = [];
  if (articleIds.length > 0) {
    const { data: artsRaw } = await supabase
      .from("articles")
      .select("id, code, name")
      .in("id", articleIds)
      .order("code");
    const stockByArticle = new Map(stock.map((s) => [s.article_id, s.qty]));
    articles = ((artsRaw ?? []) as Pick<Tables<"articles">, "id" | "code" | "name">[]).map(
      (a) => ({ ...a, stockQty: stockByArticle.get(a.id) ?? 0 }),
    );
  }

  return (
    <TransferDoc
      doc={{
        id: doc.id,
        docNumber: doc.doc_number,
        transferDate: doc.transfer_date,
        status: doc.status,
        comment: doc.comment,
        fromWorkshop: doc.from_workshop
          ? `${doc.from_workshop.code} · ${doc.from_workshop.name}`
          : "—",
        toWorkshop: doc.to_workshop
          ? `${doc.to_workshop.code} · ${doc.to_workshop.name}`
          : "—",
        createdByName: doc.created_by_emp?.full_name ?? null,
        acceptedByName: doc.accepted_by_emp?.full_name ?? null,
        acceptedAt: doc.accepted_at,
      }}
      lines={lines.map((l) => ({
        id: l.id,
        qty: l.qty,
        articleCode: l.article?.code ?? "—",
        articleName: l.article?.name ?? "—",
      }))}
      articles={articles}
      isAdmin={user?.role === "admin"}
    />
  );
}