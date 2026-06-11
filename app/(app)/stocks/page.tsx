import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth";
import type { Tables } from "@/lib/supabase/types";
import { getWorkshopStock } from "@/lib/services/transfers";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SearchParams = { workshop_id?: string };

export default async function StocksPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  const user = await getCurrentUser();

  const { data: wsRaw } = await supabase
    .from("workshops")
    .select("id, code, name")
    .eq("is_active", true)
    .order("seq_order");
  const workshops = (wsRaw ?? []) as Pick<Tables<"workshops">, "id" | "code" | "name">[];

  // По умолчанию — склад своего цеха (если есть), иначе все
  const selected =
    searchParams.workshop_id ?? user?.employee?.workshop_id ?? "all";

  const stock = await getWorkshopStock(
    supabase,
    selected !== "all" ? selected : undefined,
  );
  const positive = stock.filter((s) => s.qty !== 0);

  const articleIds = Array.from(new Set(positive.map((s) => s.article_id)));
  const articleById = new Map<string, Pick<Tables<"articles">, "code" | "name">>();
  if (articleIds.length > 0) {
    const { data: artsRaw } = await supabase
      .from("articles")
      .select("id, code, name")
      .in("id", articleIds);
    for (const a of (artsRaw ?? []) as Pick<
      Tables<"articles">,
      "id" | "code" | "name"
    >[]) {
      articleById.set(a.id, { code: a.code, name: a.name });
    }
  }
  const workshopById = new Map(workshops.map((w) => [w.id, w]));

  const rows = positive
    .map((s) => ({
      workshop: workshopById.get(s.workshop_id),
      article: articleById.get(s.article_id),
      qty: s.qty,
    }))
    .sort(
      (a, b) =>
        (a.workshop?.code ?? "").localeCompare(b.workshop?.code ?? "") ||
        (a.article?.code ?? "").localeCompare(b.article?.code ?? ""),
    );

  const totalQty = rows.reduce((s, r) => s + r.qty, 0);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Остатки цехов"
        description="Выработка минус принятые перемещения · по складам цехов"
      />

      <Card className="p-4">
        <form className="flex flex-wrap items-end gap-3">
          <div className="w-64 space-y-1">
            <p className="text-xs text-muted-foreground">Склад цеха</p>
            <Select name="workshop_id" defaultValue={selected}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все цеха</SelectItem>
                {workshops.map((w) => (
                  <SelectItem key={w.id} value={w.id}>
                    {w.code} · {w.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" variant="secondary">
            Показать
          </Button>
          <Button variant="ghost" asChild>
            <Link href="/stocks?workshop_id=all">Все</Link>
          </Button>
        </form>
      </Card>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-40">Цех</TableHead>
              <TableHead className="w-32">Артикул</TableHead>
              <TableHead>Наименование</TableHead>
              <TableHead className="w-32 text-right">Остаток, пар</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Остатков нет — закройте смену с выработкой или примите перемещение
                </TableCell>
              </TableRow>
            ) : (
              <>
                {rows.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      {r.workshop ? `${r.workshop.code} · ${r.workshop.name}` : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {r.article?.code ?? "—"}
                    </TableCell>
                    <TableCell>{r.article?.name ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono-tabular">
                      {r.qty}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="font-medium">
                    Итого
                  </TableCell>
                  <TableCell className="text-right font-mono-tabular font-medium">
                    {totalQty}
                  </TableCell>
                </TableRow>
              </>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}