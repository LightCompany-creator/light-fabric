import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MATERIAL_OPTIONS, ROUTE_TYPE_OPTIONS } from "./schema";
import { DeleteArticleButton } from "./delete-button";

type SearchParams = {
  q?: string;
  material?: string;
  route_type?: string;
};

const ROUTE_LABELS: Record<string, string> = {
  simple: "Простой",
  medium: "Средний",
  complex: "Сложный",
};

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const supabase = createClient();
  let query = supabase
    .from("articles")
    .select("id, code, name, material, box_qty, size_min, size_max, wholesale_price, route_type, is_active")
    .order("code");

  if (searchParams.q) {
    const q = searchParams.q.trim();
    if (q) query = query.or(`code.ilike.%${q}%,name.ilike.%${q}%`);
  }
  if (searchParams.material && searchParams.material !== "all") {
    query = query.eq("material", searchParams.material);
  }
  if (searchParams.route_type && searchParams.route_type !== "all") {
    query = query.eq("route_type", searchParams.route_type);
  }

  const { data, error } = await query;
  const articles = (data ?? []) as Array<Tables<"articles">>;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Артикулы"
        description="Каталог продукции — синхронизирован с 1С через XLSX"
        actions={
          <Button asChild>
            <Link href="/catalog/articles/new">
              <Plus className="mr-2 h-4 w-4" />
              Добавить
            </Link>
          </Button>
        }
      />

      <Card className="p-4">
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <Input
            name="q"
            placeholder="Поиск по коду или названию"
            defaultValue={searchParams.q ?? ""}
            className="sm:col-span-2"
          />
          <Select name="material" defaultValue={searchParams.material ?? "all"}>
            <SelectTrigger>
              <SelectValue placeholder="Материал" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все материалы</SelectItem>
              {MATERIAL_OPTIONS.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            name="route_type"
            defaultValue={searchParams.route_type ?? "all"}
          >
            <SelectTrigger>
              <SelectValue placeholder="Маршрут" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все маршруты</SelectItem>
              {ROUTE_TYPE_OPTIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {ROUTE_LABELS[r.value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="sm:col-span-4 flex justify-end gap-2">
            <Button variant="ghost" asChild>
              <Link href="/catalog/articles">Сбросить</Link>
            </Button>
            <Button type="submit" variant="secondary">
              Применить
            </Button>
          </div>
        </form>
      </Card>

      {error ? (
        <p className="text-sm text-destructive">
          Не удалось загрузить артикулы: {error.message}
        </p>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Код</TableHead>
                <TableHead>Название</TableHead>
                <TableHead className="w-28">Материал</TableHead>
                <TableHead className="w-24">Размеры</TableHead>
                <TableHead className="w-20 text-right">В кор.</TableHead>
                <TableHead className="w-28 text-right">Цена, ₽</TableHead>
                <TableHead className="w-28">Маршрут</TableHead>
                <TableHead className="w-24 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Ничего не найдено
                  </TableCell>
                </TableRow>
              ) : (
                articles.map((a) => (
                  <TableRow key={a.id} className={a.is_active ? "" : "opacity-50"}>
                    <TableCell className="font-mono font-medium">{a.code}</TableCell>
                    <TableCell>{a.name}</TableCell>
                    <TableCell>{a.material}</TableCell>
                    <TableCell className="font-mono-tabular text-sm">
                      {a.size_min ?? "?"}–{a.size_max ?? "?"}
                    </TableCell>
                    <TableCell className="text-right font-mono-tabular">
                      {a.box_qty}
                    </TableCell>
                    <TableCell className="text-right font-mono-tabular">
                      {a.wholesale_price ? Number(a.wholesale_price).toFixed(0) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ROUTE_LABELS[a.route_type]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild variant="ghost" size="icon" title="Редактировать">
                          <Link href={`/catalog/articles/${a.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Link>
                        </Button>
                        <DeleteArticleButton id={a.id} code={a.code} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
