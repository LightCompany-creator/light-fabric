import Link from "next/link";
import { Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  WORKSHOP_COLOR_VARS,
  WORKSHOP_LABELS,
  type WorkshopCode,
} from "@/lib/constants";

type ArticleWithRoute = Tables<"articles"> & {
  route: Pick<Tables<"routes">, "sequence" | "is_active"> | null;
};

function RouteBadges({ codes }: { codes: WorkshopCode[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      {codes.map((code, i) => (
        <span key={i} className="flex items-center gap-1">
          <span
            className="rounded px-2 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: WORKSHOP_COLOR_VARS[code] }}
          >
            {WORKSHOP_LABELS[code]}
          </span>
          {i < codes.length - 1 ? (
            <span className="text-muted-foreground">→</span>
          ) : null}
        </span>
      ))}
    </div>
  );
}

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const supabase = createClient();
  let q = supabase
    .from("articles")
    .select("*, route:routes(sequence, is_active)")
    .eq("is_active", true)
    .order("code");

  if (searchParams.q) {
    const term = searchParams.q.trim();
    if (term) q = q.or(`code.ilike.%${term}%,name.ilike.%${term}%`);
  }

  const { data, error } = await q;
  const articles = (data ?? []) as ArticleWithRoute[];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Маршруты партий"
        description="Последовательность цехов для каждого артикула. Перетаскивай цеха на странице редактирования."
      />

      <Card className="p-4">
        <form className="flex gap-3">
          <Input
            name="q"
            placeholder="Поиск по коду или названию"
            defaultValue={searchParams.q ?? ""}
          />
          <Button type="submit" variant="secondary">Найти</Button>
          <Button variant="ghost" asChild>
            <Link href="/catalog/routes">Сбросить</Link>
          </Button>
        </form>
      </Card>

      {error ? (
        <p className="text-sm text-destructive">
          Не удалось загрузить маршруты: {error.message}
        </p>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Артикул</TableHead>
                <TableHead className="w-64">Название</TableHead>
                <TableHead>Маршрут</TableHead>
                <TableHead className="w-24 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground">
                    Артикулов пока нет — добавь в каталоге
                  </TableCell>
                </TableRow>
              ) : (
                articles.map((a) => {
                  const seq = (a.route?.sequence ?? []) as WorkshopCode[];
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono font-medium">
                        {a.code}
                      </TableCell>
                      <TableCell>{a.name}</TableCell>
                      <TableCell>
                        {seq.length === 0 ? (
                          <span className="text-sm text-muted-foreground">
                            маршрут не задан
                          </span>
                        ) : (
                          <RouteBadges codes={seq} />
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="icon" title="Редактировать">
                          <Link href={`/catalog/routes/${a.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
