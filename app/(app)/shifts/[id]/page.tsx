import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SHIFT_TYPE_LABELS } from "@/lib/constants";
import type { WorkerOperation } from "@/lib/services/payroll";
import {
  AddOutputForm,
  AddWorkerOperationForm,
  CloseShiftButton,
  DeleteIconForm,
} from "./active-shift";
import {
  removeOutputAction,
  removeWorkerOperationAction,
} from "../actions";

type ShiftFull = Tables<"shifts"> & {
  workshop: Pick<Tables<"workshops">, "code" | "name"> | null;
  foreman: Pick<Tables<"employees">, "full_name" | "tab_number"> | null;
};

type OutputRow = Tables<"shift_outputs"> & {
  article: Pick<Tables<"articles">, "code" | "name"> | null;
};

type WorkerRow = Tables<"shift_workers"> & {
  employee: Pick<Tables<"employees">, "tab_number" | "full_name"> | null;
};

export default async function ActiveShiftPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const [{ data: shiftRaw }, { data: outsRaw }, { data: workersRaw }, { data: artRaw }, { data: empRaw }] =
    await Promise.all([
      supabase
        .from("shifts")
        .select(
          "*, workshop:workshops(code, name), foreman:employees!shifts_foreman_id_fkey(full_name, tab_number)",
        )
        .eq("id", params.id)
        .maybeSingle(),
      supabase
        .from("shift_outputs")
        .select("*, article:articles(code, name)")
        .eq("shift_id", params.id)
        .order("created_at"),
      supabase
        .from("shift_workers")
        .select("*, employee:employees(tab_number, full_name)")
        .eq("shift_id", params.id)
        .order("created_at"),
      supabase
        .from("articles")
        .select("id, code, name")
        .eq("is_active", true)
        .order("code"),
      supabase
        .from("employees")
        .select("id, tab_number, full_name, workshop_id")
        .eq("is_active", true)
        .order("full_name"),
    ]);

  const shift = shiftRaw as ShiftFull | null;
  if (!shift) notFound();

  const outputs = (outsRaw ?? []) as OutputRow[];
  const workers = (workersRaw ?? []) as WorkerRow[];
  const articles = (artRaw ?? []) as Pick<Tables<"articles">, "id" | "code" | "name">[];
  const allEmployees = (empRaw ?? []) as (Pick<Tables<"employees">, "id" | "tab_number" | "full_name"> & {
    workshop_id: string | null;
  })[];
  // Работники этого цеха в приоритете
  const employees = allEmployees
    .filter((e) => e.workshop_id === shift.workshop_id)
    .concat(allEmployees.filter((e) => e.workshop_id !== shift.workshop_id));

  const isOpen = shift.status === "open";
  const totalPairs = outputs.reduce((s, o) => s + o.quantity, 0);
  const totalWeight = outputs.reduce((s, o) => s + Number(o.weight ?? 0), 0);
  const totalDefect = outputs.reduce((s, o) => s + (o.defect_qty ?? 0), 0);
  const totalPay = workers.reduce((s, w) => s + Number(w.calculated_pay ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Смена · ${shift.workshop?.name ?? ""}`}
        description={`${format(parseISO(shift.shift_date), "d MMMM yyyy", { locale: ru })} · ${SHIFT_TYPE_LABELS[shift.shift_type]} · бригадир: ${shift.foreman?.full_name ?? "—"}`}
        actions={
          <Badge variant={isOpen ? "secondary" : "outline"} className={isOpen ? "bg-accent text-accent-foreground" : ""}>
            {isOpen ? "Открыта" : "Закрыта"}
          </Badge>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Выработка</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOpen ? <AddOutputForm shiftId={shift.id} articles={articles} /> : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Артикул</TableHead>
                <TableHead>Название</TableHead>
                <TableHead className="text-right">Пар</TableHead>
                <TableHead className="text-right">Кг</TableHead>
                <TableHead className="text-right">Брак</TableHead>
                <TableHead>Машина</TableHead>
                <TableHead className="text-right">Простой</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {outputs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground">
                    Записей нет
                  </TableCell>
                </TableRow>
              ) : (
                outputs.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell className="font-mono">{o.article?.code ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{o.article?.name ?? ""}</TableCell>
                    <TableCell className="text-right font-mono-tabular">{o.quantity}</TableCell>
                    <TableCell className="text-right font-mono-tabular">
                      {o.weight ? Number(o.weight).toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono-tabular text-destructive">
                      {o.defect_qty ?? 0}
                    </TableCell>
                    <TableCell className="text-sm">{o.machine ?? "—"}</TableCell>
                    <TableCell className="text-right font-mono-tabular text-muted-foreground">
                      {o.downtime_min}
                    </TableCell>
                    <TableCell className="text-right">
                      {isOpen && !o.batch_id ? (
                        <DeleteIconForm
                          action={removeOutputAction}
                          payload={{ id: o.id, shift_id: shift.id }}
                          title="Удалить запись"
                        />
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Работники в смене</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isOpen ? (
            <AddWorkerOperationForm
              shiftId={shift.id}
              articles={articles}
              employees={employees}
            />
          ) : null}
          {workers.length === 0 ? (
            <p className="text-sm text-muted-foreground">Работников нет</p>
          ) : (
            <div className="space-y-3">
              {workers.map((w) => {
                const ops = (w.operations ?? []) as WorkerOperation[];
                return (
                  <div key={w.id} className="rounded-md border p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {w.employee?.full_name ?? "?"}{" "}
                          <span className="ml-2 font-mono text-xs text-muted-foreground">
                            {w.employee?.tab_number}
                          </span>
                        </p>
                      </div>
                      <p className="font-mono-tabular text-sm font-medium">
                        {Number(w.calculated_pay).toFixed(2)} ₽
                      </p>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-32">Артикул</TableHead>
                          <TableHead>Операция</TableHead>
                          <TableHead className="text-right">Кол-во</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ops.map((op, i) => {
                          const art = articles.find((a) => a.id === op.article_id);
                          return (
                            <TableRow key={i}>
                              <TableCell className="font-mono">
                                {art?.code ?? "общая"}
                              </TableCell>
                              <TableCell>{op.operation ?? "—"}</TableCell>
                              <TableCell className="text-right font-mono-tabular">
                                {op.qty}
                              </TableCell>
                              <TableCell className="text-right">
                                {isOpen ? (
                                  <DeleteIconForm
                                    action={removeWorkerOperationAction}
                                    payload={{
                                      shift_id: shift.id,
                                      worker_id: w.id,
                                      op_index: i,
                                    }}
                                    title="Убрать операцию"
                                  />
                                ) : null}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Итоги смены</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Summary label="Пар произведено" value={totalPairs.toString()} />
          <Summary label="Кг" value={totalWeight.toFixed(2)} />
          <Summary label="Брак, пар" value={totalDefect.toString()} />
          <Summary label="ФОТ за смену, ₽" value={totalPay.toFixed(2)} />
        </CardContent>
      </Card>

      {isOpen ? (
        <div className="flex justify-end">
          <CloseShiftButton shiftId={shift.id} />
        </div>
      ) : null}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono-tabular text-2xl font-bold">{value}</p>
    </div>
  );
}
