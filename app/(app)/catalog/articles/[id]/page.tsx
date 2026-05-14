import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import { ArticleForm } from "../article-form";

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data } = await supabase
    .from("articles")
    .select("*")
    .eq("id", params.id)
    .maybeSingle();
  const article = data as Tables<"articles"> | null;

  if (!article) notFound();

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Артикул ${article.code}`}
        description={article.name}
      />
      <ArticleForm
        mode="edit"
        id={article.id}
        initial={{
          code: article.code,
          name: article.name,
          material: article.material,
          box_qty: article.box_qty,
          size_min: article.size_min,
          size_max: article.size_max,
          wholesale_price: article.wholesale_price,
          weight_per_pair: article.weight_per_pair,
          is_active: article.is_active,
        }}
      />
    </div>
  );
}
