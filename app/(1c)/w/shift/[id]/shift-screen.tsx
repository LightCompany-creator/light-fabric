"use client";

// Экран смены: состав, выработка, итог выпуска, закрытие.
// Денег на экране нет: расценки и суммы приложению не отдаются, ЗП считает 1С.

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, CloudOff, Loader2, Plus, Save, Trash2, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { describeError, useApi1C } from "@/lib/api1c/provider";
import { useShift, type SyncStatus } from "@/lib/api1c/use-shift";
import {
  invalidateWorkshopContext,
  useWorkshopContext,
} from "@/lib/api1c/use-workshop-context";
import type { ShiftOutput, ShiftProduct, WorkshopContext } from "@/lib/api1c";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring";

/** Подсказка по итогу выпуска: сумма выработки в разрезе продукции. */
function suggestProducts(outputs: ShiftOutput[]): ShiftProduct[] {
  const acc = new Map<string, ShiftProduct>();
  for (const line of outputs) {
    if (!line.product_id) continue;
    const found = acc.get(line.product_id) ?? {
      product_id: line.product_id,
      qty: 0,
      defect_qty: 0,
    };
    found.qty += line.qty;
    found.defect_qty += line.defect_qty;
    acc.set(line.product_id, found);
  }
  return Array.from(acc.values());
}

type MaterialNeed = {
  item_id: string;
  name: string;
  unit: string;
  required: number;
  available: number;
  short: number;
};

/**
 * Потребность в материалах по основной спецификации против остатка склада цеха.
 * Считаем заранее, чтобы нехватка всплывала во время работы, а не отказом 1С
 * в момент закрытия смены.
 */
function calcMaterials(products: ShiftProduct[], ctx: WorkshopContext): MaterialNeed[] {
  const need = new Map<string, number>();
  for (const p of products) {
    const spec = ctx.products.find((x) => x.id === p.product_id)?.spec ?? [];
    for (const line of spec) {
      need.set(line.item_id, (need.get(line.item_id) ?? 0) + line.qty_per_unit * p.qty);
    }
  }
  const round = (n: number) => Math.round(n * 1000) / 1000;

  return Array.from(need.entries()).map(([item_id, raw]) => {
    const required = round(raw);
    const stock = ctx.stock.find((s) => s.item_id === item_id);
    const material = ctx.materials.find((m) => m.id === item_id);
    const available = stock?.available ?? 0;
    return {
      item_id,
      name: material?.name ?? stock?.name ?? item_id,
      unit: material?.unit ?? stock?.unit ?? "",
      required,
      available,
      short: required > available ? round(required - available) : 0,
    };
  });
}

export function ShiftScreen({ shiftId }: { shiftId: string }) {
  const { workshop } = useApi1C();
  const { context } = useWorkshopContext(workshop?.id);
  const shift = useShift(shiftId);

  if (shift.sync === "loading" || !context) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Загрузка смены
      </div>
    );
  }

  const closed = shift.shift?.status === "closed";

  // Итог выпуска подтверждает человек. Пока он не подтверждён, закрывать нельзя:
  // иначе 1С не приходует продукцию и не спишет материалы, а смена будет выглядеть сданной.
  const needsProducts =
    shift.state.outputs.some((o) => o.product_id) && shift.state.products.length === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-24">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/w" aria-label="Назад">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {shift.shift?.number ?? "Смена"}
              {closed ? <Badge className="ml-2">закрыта</Badge> : null}
            </h1>
            <p className="text-sm text-muted-foreground">
              {shift.shift?.date} · {shift.shift?.shift_no} смена · {workshop?.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SyncBadge status={shift.sync} />
          {!closed ? (
            <Button variant="outline" size="sm" onClick={() => void shift.saveNow()}>
              <Save className="mr-2 h-4 w-4" />
              Сохранить
            </Button>
          ) : null}
        </div>
      </header>

      {shift.sync === "conflict" ? (
        <Card className="border-destructive">
          <CardContent className="space-y-3 pt-6 text-sm">
            <p className="font-medium text-destructive">{shift.error}</p>
            <p className="text-muted-foreground">
              Введённое на этом планшете сохранено и никуда не пропадёт.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => void shift.resolveKeepMine()}>
                Оставить моё
              </Button>
              <Button size="sm" variant="outline" onClick={() => void shift.resolveTakeTheirs()}>
                Взять из 1С
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : shift.error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm text-destructive">{shift.error}</CardContent>
        </Card>
      ) : null}

      <WorkersSection context={context} shift={shift} disabled={closed} />
      <OutputsSection context={context} shift={shift} disabled={closed} />
      <ProductsSection context={context} shift={shift} disabled={closed} />
      <MaterialsSection context={context} shift={shift} closed={closed} />
      <CloseSection
        shift={shift}
        disabled={closed}
        workshopId={workshop?.id}
        needsProducts={needsProducts}
      />
    </div>
  );
}

// ---------- состав смены ----------

function WorkersSection({
  context,
  shift,
  disabled,
}: {
  context: WorkshopContext;
  shift: ReturnType<typeof useShift>;
  disabled: boolean;
}) {
  const selected = new Set(shift.state.workers.map((w) => w.employee_id));

  function toggle(employeeId: string, defaultWorkType: string | null) {
    const workers = selected.has(employeeId)
      ? shift.state.workers.filter((w) => w.employee_id !== employeeId)
      : [...shift.state.workers, { employee_id: employeeId, work_type_id: defaultWorkType }];
    shift.update({ workers });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Кто вышел
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {shift.state.workers.length} из {context.employees.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {context.employees.map((e) => (
          <Button
            key={e.id}
            size="sm"
            variant={selected.has(e.id) ? "default" : "outline"}
            disabled={disabled}
            onClick={() => toggle(e.id, e.default_work_type_id)}
          >
            {selected.has(e.id) ? <Check className="mr-1.5 h-3.5 w-3.5" /> : null}
            {e.name}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

// ---------- выработка ----------

function OutputsSection({
  context,
  shift,
  disabled,
}: {
  context: WorkshopContext;
  shift: ReturnType<typeof useShift>;
  disabled: boolean;
}) {
  const workers = context.employees.filter((e) =>
    shift.state.workers.some((w) => w.employee_id === e.id),
  );

  const [employeeId, setEmployeeId] = useState("");
  const [workTypeId, setWorkTypeId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [defectQty, setDefectQty] = useState("");
  const [machine, setMachine] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const workType = context.work_types.find((w) => w.id === workTypeId);
  const isDowntime = workType?.is_downtime ?? false;

  function add() {
    const amount = Number(qty.replace(",", "."));
    if (!employeeId) return setFormError("Выберите работника");
    if (!workTypeId) return setFormError("Выберите вид работ");
    if (!isDowntime && !productId) return setFormError("Выберите продукцию");
    if (!amount || amount <= 0) return setFormError("Укажите количество");

    const line: ShiftOutput = {
      employee_id: employeeId,
      work_type_id: workTypeId,
      product_id: isDowntime ? null : productId,
      qty: amount,
      defect_qty: isDowntime ? 0 : Number(defectQty.replace(",", ".")) || 0,
      machine: isDowntime ? undefined : machine || undefined,
    };
    shift.update({ outputs: [...shift.state.outputs, line] });
    setQty("");
    setDefectQty("");
    setFormError(null);
  }

  function remove(index: number) {
    shift.update({ outputs: shift.state.outputs.filter((_, i) => i !== index) });
  }

  const nameOf = (id: string | null, list: { id: string; name: string }[]) =>
    list.find((x) => x.id === id)?.name ?? "";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Выработка</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {shift.state.outputs.length > 0 ? (
          <div className="divide-y rounded-md border">
            {shift.state.outputs.map((line, index) => (
              <div key={index} className="flex items-center justify-between gap-3 p-3 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {nameOf(line.employee_id, context.employees)}
                  </p>
                  <p className="truncate text-muted-foreground">
                    {nameOf(line.work_type_id, context.work_types)}
                    {line.product_id ? ` · ${nameOf(line.product_id, context.products)}` : ""}
                    {line.machine ? ` · ${line.machine}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="tabular-nums">
                    {line.qty}
                    {line.defect_qty ? `, брак ${line.defect_qty}` : ""}
                  </span>
                  {!disabled ? (
                    <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Строк пока нет.</p>
        )}

        {!disabled ? (
          <div className="space-y-3 rounded-md border border-dashed p-3">
            {workers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Сначала отметьте, кто вышел на смену.
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="employee">Работник</Label>
                    <select
                      id="employee"
                      className={selectClass}
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                    >
                      <option value="">Выберите</option>
                      {workers.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="work-type">Вид работ</Label>
                    <select
                      id="work-type"
                      className={selectClass}
                      value={workTypeId}
                      onChange={(e) => setWorkTypeId(e.target.value)}
                    >
                      <option value="">Выберите</option>
                      {context.work_types.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {!isDowntime ? (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="product">Продукция</Label>
                      <select
                        id="product"
                        className={selectClass}
                        value={productId}
                        onChange={(e) => setProductId(e.target.value)}
                      >
                        <option value="">Выберите</option>
                        {context.products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.article}, {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : null}

                  <div className="space-y-1.5">
                    <Label htmlFor="qty">
                      {isDowntime ? "Часы простоя" : `Количество, ${workType?.unit ?? "шт"}`}
                    </Label>
                    <Input
                      id="qty"
                      inputMode="decimal"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                    />
                  </div>

                  {!isDowntime ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="defect">Брак</Label>
                      <Input
                        id="defect"
                        inputMode="decimal"
                        value={defectQty}
                        onChange={(e) => setDefectQty(e.target.value)}
                      />
                    </div>
                  ) : null}

                  {!isDowntime ? (
                    <div className="space-y-1.5 sm:col-span-2">
                      <Label htmlFor="machine">Станок, необязательно</Label>
                      <Input
                        id="machine"
                        value={machine}
                        onChange={(e) => setMachine(e.target.value)}
                      />
                    </div>
                  ) : null}
                </div>

                {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

                <Button onClick={add} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Добавить строку
                </Button>
              </>
            )}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

// ---------- итог выпуска ----------

function ProductsSection({
  context,
  shift,
  disabled,
}: {
  context: WorkshopContext;
  shift: ReturnType<typeof useShift>;
  disabled: boolean;
}) {
  // Итог по операциям не равен числу готовых пар, поэтому цифру подтверждает
  // человек (вопрос В-3 контракта), а приложение только подсказывает.
  const suggestion = useMemo(() => suggestProducts(shift.state.outputs), [shift.state.outputs]);

  function setQty(productId: string, value: string, field: "qty" | "defect_qty") {
    const amount = Number(value.replace(",", ".")) || 0;
    const exists = shift.state.products.some((p) => p.product_id === productId);
    const products = exists
      ? shift.state.products.map((p) =>
          p.product_id === productId ? { ...p, [field]: amount } : p,
        )
      : [...shift.state.products, { product_id: productId, qty: 0, defect_qty: 0, [field]: amount }];
    shift.update({ products });
  }

  const rows = shift.state.products.length > 0 ? shift.state.products : suggestion;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Итог выпуска</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Появится, когда внесёте выработку по продукции.
          </p>
        ) : (
          <>
            {rows.map((row) => {
              const product = context.products.find((p) => p.id === row.product_id);
              return (
                <div key={row.product_id} className="grid gap-2 sm:grid-cols-[1fr_7rem_7rem]">
                  <div className="self-center text-sm">
                    <p className="font-medium">{product?.article}</p>
                    <p className="truncate text-muted-foreground">{product?.name}</p>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Изготовлено</Label>
                    <Input
                      inputMode="decimal"
                      disabled={disabled}
                      value={String(row.qty)}
                      onChange={(e) => setQty(row.product_id, e.target.value, "qty")}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Брак</Label>
                    <Input
                      inputMode="decimal"
                      disabled={disabled}
                      value={String(row.defect_qty)}
                      onChange={(e) => setQty(row.product_id, e.target.value, "defect_qty")}
                    />
                  </div>
                </div>
              );
            })}

            {shift.state.products.length === 0 && !disabled ? (
              <Button variant="outline" size="sm" onClick={() => shift.update({ products: suggestion })}>
                Принять как есть
              </Button>
            ) : null}
          </>
        )}

      </CardContent>
    </Card>
  );
}

// ---------- материалы по норме ----------

function MaterialsSection({
  context,
  shift,
  closed,
}: {
  context: WorkshopContext;
  shift: ReturnType<typeof useShift>;
  closed: boolean;
}) {
  // Считаем по подтверждённому итогу, а пока его нет, по подсказке из выработки.
  const basis =
    shift.state.products.length > 0 ? shift.state.products : suggestProducts(shift.state.outputs);
  const needs = useMemo(() => calcMaterials(basis, context), [basis, context]);
  const shortage = needs.filter((n) => n.short > 0);

  // У закрытой смены материалы уже списаны, сравнивать с остатком нечего:
  // показываем то, что ушло в 1С.
  if (closed) {
    const written = shift.state.materials;
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Материалы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {written.length === 0 ? (
            <p className="text-muted-foreground">Материалы по этой смене не списывались.</p>
          ) : (
            <>
              {written.map((m) => {
                const info = context.materials.find((x) => x.id === m.item_id);
                return (
                  <div key={m.item_id} className="flex items-center justify-between gap-4">
                    <span className="truncate">{info?.name ?? m.item_id}</span>
                    <span className="shrink-0 tabular-nums">
                      {m.qty} {info?.unit ?? ""}
                    </span>
                  </div>
                );
              })}
              <p className="text-xs text-muted-foreground">Списано при закрытии смены.</p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (needs.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Материалы по норме</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Появятся, когда будет выпуск. Списывает их 1С по спецификации, вводить вручную не нужно.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={shortage.length ? "border-destructive" : undefined}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Материалы по норме</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        {needs.map((n) => (
          <div key={n.item_id} className="flex items-center justify-between gap-4">
            <span className="truncate">{n.name}</span>
            <span className="shrink-0 tabular-nums">
              <span className={n.short > 0 ? "font-medium text-destructive" : ""}>
                {n.required} {n.unit}
              </span>
              <span className="text-muted-foreground"> из {n.available}</span>
            </span>
          </div>
        ))}

        {shortage.length > 0 ? (
          <div className="flex gap-2 rounded-md bg-destructive/10 p-3 text-destructive">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">
                Не хватает сырья:{" "}
                {shortage.map((n) => `${n.name} на ${n.short} ${n.unit}`).join(", ")}
              </p>
              <p className="mt-1 text-muted-foreground">
                Пока его нет на складе цеха, смену закрыть не получится.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Сырья хватает. Списывать вручную не нужно.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ---------- закрытие ----------

function CloseSection({
  shift,
  disabled,
  workshopId,
  needsProducts,
}: {
  shift: ReturnType<typeof useShift>;
  disabled: boolean;
  workshopId?: string;
  needsProducts: boolean;
}) {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [closing, setClosing] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  const report = shift.shift?.production_report;

  if (disabled) {
    return (
      <Card>
        <CardContent className="space-y-3 pt-6 text-sm">
          <p className="font-medium">Смена закрыта.</p>
          {report ? (
            <p className="text-muted-foreground">
              В 1С создан отчёт производства за смену {report.number} от {report.date}.
            </p>
          ) : null}
          <Button variant="outline" size="sm" onClick={() => router.push("/w")}>
            К рабочему месту
          </Button>

          <ReopenBlock shift={shift} workshopId={workshopId} />
        </CardContent>
      </Card>
    );
  }

  async function handleClose() {
    setClosing(true);
    setFailure(null);
    try {
      await shift.close(comment || undefined);
      invalidateWorkshopContext(workshopId);
    } catch (e) {
      setFailure(describeError(e));
    } finally {
      setClosing(false);
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Закрытие смены</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="comment">Комментарий, необязательно</Label>
          <Input
            id="comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="станок №2 простаивал 40 минут"
          />
        </div>

        {failure ? (
          <div className="flex gap-2 rounded-md border border-destructive p-3 text-sm text-destructive">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            <div>
              <p>{failure}</p>
              <p className="mt-1 text-muted-foreground">
                Смена осталась открытой, введённое сохранено. Исправьте и попробуйте снова.
              </p>
            </div>
          </div>
        ) : null}

        {needsProducts ? (
          <p className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            Подтвердите итог выпуска: по нему 1С приходует продукцию и списывает материалы.
          </p>
        ) : null}

        <Button
          className="w-full"
          onClick={() => void handleClose()}
          disabled={closing || needsProducts}
        >
          {closing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Закрыть смену
        </Button>
        <p className="text-xs text-muted-foreground">
          При закрытии 1С проводит отчёт производства: продукция приходуется на склад цеха,
          материалы списываются, зарплата начисляется по расценкам на дату смены.
        </p>
      </CardContent>
    </Card>
  );
}

// ---------- переоткрытие ----------

/**
 * Переоткрыть закрытую смену может только администратор: 1С распроведёт отчёт
 * производства, то есть отменит приход продукции, списание материалов
 * и начисление зарплаты. Поэтому просим причину и предупреждаем, что будет.
 */
function ReopenBlock({
  shift,
  workshopId,
}: {
  shift: ReturnType<typeof useShift>;
  workshopId?: string;
}) {
  const { me } = useApi1C();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  if (!me?.is_admin) return null;

  async function handleReopen() {
    setBusy(true);
    setFailure(null);
    try {
      await shift.reopen(reason.trim());
      invalidateWorkshopContext(workshopId);
      setOpen(false);
      setReason("");
    } catch (e) {
      setFailure(describeError(e));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setOpen(true)}>
        Переоткрыть смену
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-dashed p-3">
      <p className="text-muted-foreground">
        1С распроведёт отчёт производства: приход продукции, списание материалов
        и начисление зарплаты отменятся.
      </p>

      <div className="space-y-1.5">
        <Label htmlFor="reason">Причина</Label>
        <Input
          id="reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="ошиблись в количестве"
        />
      </div>

      {failure ? (
        <div className="flex gap-2 text-destructive">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          <p>{failure}</p>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button size="sm" onClick={() => void handleReopen()} disabled={busy || !reason.trim()}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Переоткрыть
        </Button>
        <Button size="sm" variant="outline" onClick={() => setOpen(false)} disabled={busy}>
          Отмена
        </Button>
      </div>
    </div>
  );
}

// ---------- индикатор сохранения ----------

function SyncBadge({ status }: { status: SyncStatus }) {
  const map: Record<SyncStatus, { text: string; variant: "secondary" | "outline" | "destructive" }> = {
    loading: { text: "загрузка", variant: "outline" },
    saved: { text: "сохранено в 1С", variant: "secondary" },
    saving: { text: "сохраняю", variant: "outline" },
    pending: { text: "не сохранено", variant: "outline" },
    offline: { text: "нет связи, сохранено на планшете", variant: "destructive" },
    conflict: { text: "расхождение", variant: "destructive" },
    error: { text: "ошибка", variant: "destructive" },
  };
  const { text, variant } = map[status];
  return (
    <Badge variant={variant} className="gap-1.5">
      {status === "saving" ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
      {status === "offline" ? <CloudOff className="h-3 w-3" /> : null}
      {text}
    </Badge>
  );
}
