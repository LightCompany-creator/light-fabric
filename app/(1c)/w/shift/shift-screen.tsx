"use client";

// Экран смены: состав, выработка, итог выпуска, закрытие.
// Денег на экране нет: расценки и суммы приложению не отдаются, ЗП считает 1С.
//
// Закрытие двухшаговое (контракт v0.2): цех закрывает смену всегда, если ввод
// корректен, а отражение в учёте идёт следом и цех не блокирует. Поэтому нехватка
// сырья здесь предупреждение, а «ждёт отражения в учёте» не ошибка цеха.

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Loader2, Plus, Save, Trash2, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { describeError, useApi1C } from "@/lib/api1c/provider";
import { useShift } from "@/lib/api1c/use-shift";
import { StatusBadge, SyncBadge } from "../status-badge";
import { SearchSelect } from "./search-select";
import {
  invalidateWorkshopContext,
  useWorkshopContext,
} from "@/lib/api1c/use-workshop-context";
import { Api1CError } from "@/lib/api1c";
import { availableOn, materialsWarehouseId, outputWarehouseId, withWarehouses } from "@/lib/api1c/warehouses";
import type {
  ShiftMaterial,
  ShiftOutput,
  ShiftProduct,
  ShiftState,
  WorkshopContext,
} from "@/lib/api1c";

const selectClass =
  "h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring";

/** Название продукции для экрана: артикул и наименование, если артикул есть. В 1С его часто нет. */
function productLabel(p: { article?: string; name: string } | undefined): string {
  if (!p) return "";
  return [p.article, p.name].filter((x) => x && x.trim()).join(", ");
}

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

const round3 = (n: number) => Math.round(n * 1000) / 1000;

/**
 * Материалы к списанию по основной спецификации, строками «продукция → материал».
 * Это то, что 1С заполнила бы сама; здесь человек может от нормы отойти.
 */
function materialsBySpec(products: ShiftProduct[], ctx: WorkshopContext): ShiftMaterial[] {
  const lines: ShiftMaterial[] = [];
  for (const p of products) {
    const spec = ctx.products.find((x) => x.id === p.product_id)?.spec ?? [];
    for (const line of spec) {
      lines.push({ item_id: line.item_id, product_id: p.product_id, qty: round3(line.qty_per_unit * p.qty) });
    }
  }
  return lines;
}


/**
 * Потребность в материалах по основной спецификации против остатка склада цеха.
 * Считаем заранее, чтобы нехватка всплывала во время работы, а не отказом 1С
 * в момент закрытия смены.
 */
function calcMaterials(materials: ShiftMaterial[], ctx: WorkshopContext, warehouseId: string): MaterialNeed[] {
  const need = new Map<string, number>();
  for (const m of materials) {
    need.set(m.item_id, (need.get(m.item_id) ?? 0) + m.qty);
  }
  const round = round3;

  return Array.from(need.entries()).map(([item_id, raw]) => {
    const required = round(raw);
    // Материалы списываются со склада материалов участка (v0.4): остаток той же
    // позиции на складе продукции для смены не в счёт.
    const stock = ctx.stock.find((s) => s.item_id === item_id);
    const material = ctx.materials.find((m) => m.id === item_id);
    const available = round(availableOn(ctx.stock, warehouseId, item_id));
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
  // Версия из кэша цеха нужна, если смену открыли без связи: по ней 1С потом
  // поймёт, не изменили ли документ, пока планшет был офлайн.
  const knownVersion = context?.open_shifts.find((s) => s.id === shiftId)?.version;
  const shift = useShift(shiftId, { knownVersion });

  if (shift.sync === "loading" || !context) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Загрузка смены
      </div>
    );
  }

  // Без связи документ из 1С не пришёл: шапку берём из кэша контекста цеха,
  // чтобы человек видел, какую смену он ведёт.
  const head = shift.shift ?? context.open_shifts.find((s) => s.id === shiftId) ?? null;
  const closed = head?.status === "closed";

  // Итог выпуска подтверждает человек. Пока он не подтверждён, закрывать нельзя:
  // иначе 1С не приходует продукцию и не спишет материалы, а смена будет выглядеть сданной.
  const needsProducts =
    shift.state.outputs.some((o) => o.product_id) && shift.state.products.length === 0;

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-32">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/w" aria-label="Назад">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-bold">
              {head?.number ?? "Смена"}
              {closed ? <StatusBadge kind="closed" className="ml-2 align-middle" /> : null}
              {closed && shift.shift?.accounting?.status === "pending" ? (
                <StatusBadge kind="pending" className="ml-2 align-middle" />
              ) : null}
            </h1>
            <p className="text-sm text-muted-foreground">
              {head?.date} · {head?.shift_no} смена · {workshop?.name}
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

      <SectionNav shift={shift} context={context} closed={closed} />

      {shift.sync === "conflict" ? (
        <Card className="border-destructive">
          <CardContent className="space-y-3 pt-6 text-sm">
            <p className="font-medium text-destructive">{shift.error}</p>
            <p className="text-muted-foreground">
              Введённое на этом планшете сохранено и никуда не пропадёт.
            </p>
            <Button size="sm" onClick={() => void shift.retryConflict()}>
              Получить версию 1С
            </Button>
          </CardContent>
        </Card>
      ) : shift.error ? (
        <Card className="border-destructive">
          <CardContent className="pt-6 text-sm text-destructive">{shift.error}</CardContent>
        </Card>
      ) : null}

      {shift.mine ? (
        <MineCopy context={context} mine={shift.mine} onDismiss={shift.dismissMine} />
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
        context={context}
      />
    </div>
  );
}

// ---------- полоса разделов ----------

/**
 * Якоря к блокам смены с цифрами заполнения (Д-5): блоков шесть, друг под другом,
 * и прокрутка в перчатках утомляет. Полоса липнет к верху экрана, цифры
 * показывают, что уже внесено.
 */
function SectionNav({
  shift,
  context,
  closed,
}: {
  shift: ReturnType<typeof useShift>;
  context: WorkshopContext;
  closed: boolean;
}) {
  const { workers, outputs, products, materials } = shift.state;
  const basis = products.length > 0 ? products : suggestProducts(outputs);
  const produced = basis.reduce((sum, p) => sum + p.qty, 0);
  const materialLines = (materials.length > 0 ? materials : materialsBySpec(basis, context)).length;

  const items: { id: string; label: string; count: number | null }[] = [
    { id: "who", label: "Кто вышел", count: workers.length },
    { id: "out", label: "Выработка", count: outputs.length },
    { id: "total", label: "Итог", count: produced },
    { id: "mat", label: "Материалы", count: materialLines },
    { id: "close", label: closed ? "Закрыта" : "Закрыть", count: null },
  ];

  const go = (id: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Разделы смены"
      className="sticky top-0 z-10 -mx-4 bg-background/95 px-4 py-2 backdrop-blur"
    >
      <div className="flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {items.map((it) => (
          <a
            key={it.id}
            href={`#${it.id}`}
            onClick={go(it.id)}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border border-input bg-card px-4 text-[15px] font-medium text-primary no-underline hover:bg-muted/60"
          >
            {it.label}
            {it.count !== null ? <b className="font-bold tabular-nums">{it.count}</b> : null}
          </a>
        ))}
      </div>
    </nav>
  );
}

// ---------- своя копия после расхождения ----------

/**
 * При расхождении побеждает 1С: в работе её версия, а то, что было введено
 * на этом планшете, показывается рядом только для чтения. Человек переносит
 * нужное руками и убирает копию. Автоматически ничего не сливаем.
 */
function MineCopy({
  context,
  mine,
  onDismiss,
}: {
  context: WorkshopContext;
  mine: ShiftState;
  onDismiss: () => void;
}) {
  const nameOf = (id: string | null | undefined, list: { id: string; name: string }[]) =>
    list.find((x) => x.id === id)?.name ?? "";

  return (
    <Card className="border-destructive">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Ваша версия с этого планшета</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          Смену изменили с другого устройства, в работе версия из 1С. Ниже то, что
          было введено здесь и в 1С не попало.
        </p>

        {mine.workers.length > 0 ? (
          <p>
            <span className="font-medium">Кто вышел: </span>
            {mine.workers.map((w) => nameOf(w.employee_id, context.employees)).join(", ")}
          </p>
        ) : null}

        {mine.outputs.length > 0 ? (
          <div>
            <p className="font-medium">Выработка</p>
            {mine.outputs.map((o, i) => (
              <p key={i} className="text-muted-foreground">
                {nameOf(o.employee_id, context.employees)} ·{" "}
                {nameOf(o.work_type_id, context.work_types)}
                {o.product_id ? ` · ${nameOf(o.product_id, context.products)}` : ""}: {o.qty}
                {o.defect_qty ? `, брак ${o.defect_qty}` : ""}
              </p>
            ))}
          </div>
        ) : null}

        {mine.products.length > 0 ? (
          <div>
            <p className="font-medium">Итог выпуска</p>
            {mine.products.map((p) => (
              <p key={p.product_id} className="text-muted-foreground">
                {nameOf(p.product_id, context.products)}: {p.qty}
                {p.defect_qty ? `, брак ${p.defect_qty}` : ""}
              </p>
            ))}
          </div>
        ) : null}

        {mine.comment ? (
          <p>
            <span className="font-medium">Комментарий: </span>
            {mine.comment}
          </p>
        ) : null}

        <Button size="sm" variant="outline" onClick={onDismiss}>
          Убрать копию
        </Button>
      </CardContent>
    </Card>
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
    <Card id="who" className="scroll-mt-16">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Кто вышел
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {shift.state.workers.length} из {context.employees.length}
          </span>
        </CardTitle>
      </CardHeader>
      {/* Строки 56 px на всю ширину: в перчатках по чипам промахивались (Д-1).
          Порядок людей при отметке не меняется, чтобы строка не уезжала из-под пальца. */}
      <CardContent className="grid gap-2 sm:grid-cols-2">
        {context.employees.map((e) => {
          const on = selected.has(e.id);
          return (
            <button
              key={e.id}
              type="button"
              aria-pressed={on}
              disabled={disabled}
              onClick={() => toggle(e.id, e.default_work_type_id)}
              className={cn(
                "flex h-14 w-full items-center gap-3 rounded-md border px-3 text-left text-[17px] font-semibold transition-colors disabled:opacity-60",
                on ? "border-primary bg-primary/10" : "border-input bg-card hover:bg-muted/60",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2",
                  on ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50",
                )}
              >
                {on ? <Check className="h-4 w-4" strokeWidth={3} /> : null}
              </span>
              <span className="min-w-0 flex-1 truncate">{e.name}</span>
              {e.position ? (
                <span className="shrink-0 text-sm font-medium text-muted-foreground">{e.position}</span>
              ) : null}
            </button>
          );
        })}
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

  // Форма строки собирается кнопками, а не выпадающими списками (Д-2): это самое
  // частое действие смены, 10–30 раз подряд. Работник остаётся выбранным после
  // добавления, вид работ берётся из его умолчания, количество очищается.
  const [employeeId, setEmployeeId] = useState("");
  const [workTypeId, setWorkTypeId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState("");
  const [defectQty, setDefectQty] = useState("");
  const [machine, setMachine] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  // Пока человек ничего не выбрал, работник первый из вышедших, а вид работ его
  // умолчание из 1С: типовую строку можно добавить, задав одно только количество.
  const employee = workers.find((e) => e.id === employeeId) ?? workers[0];
  const activeWorkTypeId = workTypeId || employee?.default_work_type_id || "";
  const workType = context.work_types.find((w) => w.id === activeWorkTypeId);
  // Без продукции бывает не только простой: чистка форм, погрузка, уборка.
  const noProduct = workType ? !workType.requires_product : false;
  const unitOf = (wt: { unit: string; requires_product: boolean } | undefined) =>
    wt?.unit || (wt && !wt.requires_product ? "ч" : "шт");

  function pickEmployee(id: string) {
    setEmployeeId(id);
    const picked = workers.find((e) => e.id === id);
    if (picked?.default_work_type_id) setWorkTypeId(picked.default_work_type_id);
    setFormError(null);
  }

  function add() {
    const amount = Number(qty.replace(",", "."));
    if (!employee) return setFormError("Выберите работника");
    if (!activeWorkTypeId) return setFormError("Выберите вид работ");
    if (!noProduct && !productId) return setFormError("Выберите продукцию");
    if (!amount || amount <= 0) return setFormError("Укажите количество");

    const line: ShiftOutput = {
      employee_id: employee.id,
      work_type_id: activeWorkTypeId,
      product_id: noProduct ? null : productId,
      qty: amount,
      defect_qty: noProduct ? 0 : Number(defectQty.replace(",", ".")) || 0,
      machine: noProduct ? undefined : machine || undefined,
    };
    shift.update({ outputs: [...shift.state.outputs, line] });
    setEmployeeId(employee.id);
    setWorkTypeId(employee.default_work_type_id ?? activeWorkTypeId);
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
    <Card id="out" className="scroll-mt-16">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Выработка</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {shift.state.outputs.length > 0 ? (
          <div className="divide-y rounded-md border">
            {shift.state.outputs.map((line, index) => {
              const lineType = context.work_types.find((w) => w.id === line.work_type_id);
              return (
                <div key={index} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <p className="truncate text-[17px] font-semibold">
                      {nameOf(line.employee_id, context.employees)}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {nameOf(line.work_type_id, context.work_types)}
                      {line.product_id ? ` · ${nameOf(line.product_id, context.products)}` : ""}
                      {line.machine ? ` · ${line.machine}` : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="text-lg font-semibold tabular-nums">
                      {line.qty}{" "}
                      <span className="text-sm font-medium text-muted-foreground">{unitOf(lineType)}</span>
                    </span>
                    {line.defect_qty ? (
                      <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                        брак {line.defect_qty}
                      </span>
                    ) : null}
                    {!disabled ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11"
                        onClick={() => remove(index)}
                        aria-label="Убрать строку"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Строк пока нет.</p>
        )}

        {!disabled ? (
          <div className="space-y-4 rounded-md border border-dashed bg-muted/30 p-3">
            {workers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Сначала отметьте, кто вышел на смену.
              </p>
            ) : (
              <>
                <PillGroup label="Работник" id="pick-employee">
                  {workers.map((e) => (
                    <Pill key={e.id} on={employee?.id === e.id} onClick={() => pickEmployee(e.id)}>
                      {e.name}
                    </Pill>
                  ))}
                </PillGroup>

                {/* Видов работ и продукции в 1С у участка десятки: выпадающий список
                    с поиском, а не кнопки (по замечанию Наиры на живых данных). */}
                <SearchSelect
                  id="pick-work-type"
                  label="Вид работ"
                  options={context.work_types.map((w) => ({ id: w.id, label: w.name }))}
                  value={activeWorkTypeId}
                  onChange={(id) => {
                    setWorkTypeId(id);
                    setFormError(null);
                  }}
                />

                {!noProduct ? (
                  <SearchSelect
                    id="pick-product"
                    label="Продукция"
                    options={context.products.map((p) => ({ id: p.id, label: productLabel(p) }))}
                    value={productId}
                    onChange={(id) => {
                      setProductId(id);
                      setFormError(null);
                    }}
                  />
                ) : null}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="qty">Количество, {unitOf(workType)}</Label>
                    <Input
                      id="qty"
                      inputMode="decimal"
                      className="h-[52px] text-xl font-semibold"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                    />
                  </div>

                  {!noProduct ? (
                    <div className="space-y-1.5">
                      <Label htmlFor="defect">Брак</Label>
                      <Input
                        id="defect"
                        inputMode="decimal"
                        className="h-[52px] text-lg"
                        value={defectQty}
                        onChange={(e) => setDefectQty(e.target.value)}
                      />
                    </div>
                  ) : null}

                  {!noProduct ? (
                    <div className="col-span-2 space-y-1.5 sm:col-span-1">
                      <Label htmlFor="machine">Станок, необязательно</Label>
                      <Input
                        id="machine"
                        className="h-[52px] text-lg"
                        value={machine}
                        onChange={(e) => setMachine(e.target.value)}
                      />
                    </div>
                  ) : null}
                </div>

                {formError ? <p className="text-sm text-destructive">{formError}</p> : null}

                <Button onClick={add} className="h-14 w-full text-[17px]">
                  <Plus className="mr-2 h-5 w-5" />
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

/** Группа кнопок-таблеток: один выбор из нескольких, 44 px под палец. */
function PillGroup({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <p id={id} className="text-sm font-medium text-muted-foreground">
        {label}
      </p>
      <div role="group" aria-labelledby={id} className="flex flex-wrap gap-2">
        {children}
      </div>
    </div>
  );
}

function Pill({ on, onClick, children }: { on: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center rounded-full border px-4 text-[15px] font-medium transition-colors",
        on ? "border-primary bg-primary text-primary-foreground" : "border-input bg-card text-primary hover:bg-muted/60",
      )}
    >
      {children}
    </button>
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

  // Пока человек печатает, поле показывает ровно то, что он набрал: иначе «12.»
  // превращалось бы в «12» на каждой букве, и дробь ввести было нельзя.
  const [typing, setTyping] = useState<Record<string, string>>({});
  const typingKey = (productId: string, field: string) => `${productId}:${field}`;

  function setQty(productId: string, value: string, field: "qty" | "defect_qty") {
    const amount = Number(value.replace(",", ".")) || 0;
    // Первая правка подтверждает всю подсказку целиком, а не одну строку:
    // иначе остальные позиции выпадали из итога, и в 1С уходил неполный выпуск.
    const base = shift.state.products.length > 0 ? shift.state.products : suggestion;
    const exists = base.some((p) => p.product_id === productId);
    const products = exists
      ? base.map((p) => (p.product_id === productId ? { ...p, [field]: amount } : p))
      : [...base, { product_id: productId, qty: 0, defect_qty: 0, [field]: amount }];
    shift.update({ products });
  }

  const rows = shift.state.products.length > 0 ? shift.state.products : suggestion;

  return (
    <Card id="total" className="scroll-mt-16">
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
                    <p className="font-medium">{product?.article || product?.name}</p>
                    {product?.article ? <p className="truncate text-muted-foreground">{product.name}</p> : null}
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Изготовлено</Label>
                    <Input
                      inputMode="decimal"
                      disabled={disabled}
                      value={typing[typingKey(row.product_id, "qty")] ?? String(row.qty)}
                      onChange={(e) => {
                        setTyping((t) => ({ ...t, [typingKey(row.product_id, "qty")]: e.target.value }));
                        setQty(row.product_id, e.target.value, "qty");
                      }}
                      onBlur={() =>
                        setTyping((t) => {
                          const next = { ...t };
                          delete next[typingKey(row.product_id, "qty")];
                          return next;
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Брак</Label>
                    <Input
                      inputMode="decimal"
                      disabled={disabled}
                      value={typing[typingKey(row.product_id, "defect_qty")] ?? String(row.defect_qty)}
                      onChange={(e) => {
                        setTyping((t) => ({
                          ...t,
                          [typingKey(row.product_id, "defect_qty")]: e.target.value,
                        }));
                        setQty(row.product_id, e.target.value, "defect_qty");
                      }}
                      onBlur={() =>
                        setTyping((t) => {
                          const next = { ...t };
                          delete next[typingKey(row.product_id, "defect_qty")];
                          return next;
                        })
                      }
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

// ---------- материалы к списанию ----------

/**
 * Материалы к списанию заполняются по спецификации сами, как только есть выпуск,
 * и уходят в 1С вместе со сменой. Начальник цеха может от нормы отойти: заменить
 * материал на тот, что есть по факту, разбить строку на два материала или
 * поправить количество. Пока он ничего не трогал, в 1С уходит ровно норма.
 */
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
  const { products, outputs, materials } = shift.state;
  const basis = useMemo(
    () => (products.length > 0 ? products : suggestProducts(outputs)),
    [products, outputs],
  );
  const norm = useMemo(() => materialsBySpec(basis, context), [basis, context]);
  // Пока человек не правил строки, показываем норму; как только поправил, его версию.
  const edited = materials.length > 0;
  const shown = edited ? materials : norm;
  const { workshop } = useApi1C();
  const materialsWarehouse = materialsWarehouseId(withWarehouses(workshop, context.workshop));
  const needs = useMemo(
    () => calcMaterials(shown, context, materialsWarehouse),
    [shown, context, materialsWarehouse],
  );
  const shortage = needs.filter((n) => n.short > 0);
  const reflected = shift.shift?.accounting?.status === "done";

  const productOf = (id: string) => {
    const p = context.products.find((x) => x.id === id);
    return p?.article || p?.name || id;
  };

  // Любая правка начинается с копии нормы: дальше в 1С уходит то, что на экране.
  const commit = (next: ShiftMaterial[]) => shift.update({ materials: next });
  const replaceItem = (index: number, itemId: string) =>
    commit(shown.map((m, i) => (i === index ? { ...m, item_id: itemId } : m)));
  const setQty = (index: number, value: string) => {
    const qty = Number(value.replace(",", ".")) || 0;
    commit(shown.map((m, i) => (i === index ? { ...m, qty } : m)));
  };
  // Вторая строка с тем же материалом: какой подставить вместо него, знает только
  // человек, а случайный первый из списка только сбивал с толку.
  const split = (index: number) => {
    const line = shown[index];
    const half = round3(line.qty / 2);
    const next = [...shown];
    next.splice(index, 1, { ...line, qty: half }, { ...line, qty: round3(line.qty - half) });
    commit(next);
  };
  const remove = (index: number) => commit(shown.filter((_, i) => i !== index));
  const resetToNorm = () => shift.update({ materials: [] });

  // ---- закрытая смена: только чтение ----
  if (closed) {
    return (
      <Card id="mat" className="scroll-mt-16">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Материалы</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {shown.length === 0 ? (
            <p className="text-muted-foreground">Материалы по этой смене не списывались.</p>
          ) : (
            <>
              {needs.map((n) => (
                <div key={n.item_id} className="flex items-center justify-between gap-4">
                  <span className="truncate">{n.name}</span>
                  <span className="shrink-0 tabular-nums">
                    {n.required} {n.unit}
                  </span>
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                {reflected ? "Списано при отражении в учёте." : "Будет списано при отражении в учёте."}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    );
  }

  if (shown.length === 0) {
    return (
      <Card id="mat" className="scroll-mt-16">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Материалы к списанию</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Заполнятся по норме, как только будет выпуск. Если по факту списано другое,
          здесь можно будет заменить материал или разбить строку.
        </CardContent>
      </Card>
    );
  }

  const byProduct = new Map<string, number[]>();
  shown.forEach((m, i) => byProduct.set(m.product_id, [...(byProduct.get(m.product_id) ?? []), i]));

  return (
    <Card id="mat" className={cn("scroll-mt-16", shortage.length ? "border-destructive" : undefined)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">
          Материалы к списанию
          {edited ? (
            <span className="ml-2 text-sm font-normal text-muted-foreground">изменено вручную</span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from(byProduct.entries()).map(([productId, indexes]) => (
          <div key={productId} className="space-y-2">
            <p className="text-sm font-medium">{productOf(productId)}</p>
            {indexes.map((index) => {
              const line = shown[index];
              const lack = needs.find((n) => n.item_id === line.item_id)?.short ?? 0;
              return (
                <div key={index} className="grid gap-2 sm:grid-cols-[1fr_7rem_auto]">
                  <select
                    className={selectClass}
                    value={line.item_id}
                    onChange={(e) => replaceItem(index, e.target.value)}
                  >
                    {context.materials.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                  <Input
                    inputMode="decimal"
                    value={String(line.qty)}
                    className={lack > 0 ? "border-destructive" : undefined}
                    onChange={(e) => setQty(index, e.target.value)}
                  />
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => split(index)} title="Разбить на два материала">
                      Разбить
                    </Button>
                    {indexes.length > 1 ? (
                      <Button variant="ghost" size="icon" onClick={() => remove(index)} aria-label="Убрать строку">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        <div className="space-y-1 text-sm">
          {needs.map((n) => (
            <div key={n.item_id} className="flex items-center justify-between gap-4">
              <span className="truncate text-muted-foreground">{n.name}, всего</span>
              <span className="shrink-0 tabular-nums">
                <span className={n.short > 0 ? "font-medium text-destructive" : ""}>
                  {n.required} {n.unit}
                </span>
                <span className="text-muted-foreground"> из {n.available}</span>
              </span>
            </div>
          ))}
        </div>

        {shortage.length > 0 ? (
          <div className="flex gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">
                Не хватает сырья:{" "}
                {shortage.map((n) => `${n.name} на ${n.short} ${n.unit}`).join(", ")}
              </p>
              <p className="mt-1 text-muted-foreground">
                Смена закроется, но в учёте отразится только после поступления сырья.
                Если по факту списан другой материал, замените его в строке.
              </p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2">
          {edited ? (
            <Button variant="outline" size="sm" onClick={resetToNorm}>
              Вернуть норму
            </Button>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {edited
              ? "В 1С уйдёт то, что здесь указано."
              : "Заполнено по норме. В 1С уйдёт как есть, если ничего не менять."}
          </p>
        </div>
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
  context,
}: {
  shift: ReturnType<typeof useShift>;
  disabled: boolean;
  workshopId?: string;
  needsProducts: boolean;
  context: WorkshopContext;
}) {
  const router = useRouter();
  const [closing, setClosing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  /** Все нарушения ввода, которые 1С вернула разом. */
  const [problems, setProblems] = useState<string[]>([]);

  const accounting = shift.shift?.accounting;

  async function handleRefresh() {
    setRefreshing(true);
    setFailure(null);
    try {
      await shift.refresh();
      invalidateWorkshopContext(workshopId);
    } catch (e) {
      setFailure(describeError(e));
    } finally {
      setRefreshing(false);
    }
  }

  if (disabled) {
    const docs = accounting?.documents;
    const reflected = [
      docs?.production_report ? `отчёт производства ${docs.production_report.number}` : "",
      docs?.payroll ? `начисление зарплаты ${docs.payroll.number}` : "",
    ].filter(Boolean);

    return (
      <Card id="close" className="scroll-mt-16">
        <CardContent className="space-y-3 pt-6 text-sm">
          <p className="font-medium">Смена закрыта.</p>

          {accounting?.status === "done" ? (
            <p className="text-muted-foreground">
              Отражена в учёте{reflected.length ? `: ${reflected.join(", ")}` : ""}.
            </p>
          ) : null}

          {accounting?.status === "pending" ? (
            <div className="space-y-2 rounded-md bg-muted p-3">
              <p className="font-medium">Ждёт отражения в учёте</p>
              {accounting.message ? (
                <p className="text-muted-foreground">{accounting.message}</p>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleRefresh()}
                disabled={refreshing}
              >
                {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Обновить
              </Button>
            </div>
          ) : null}

          {failure ? <p className="text-destructive">{failure}</p> : null}

          <Button variant="outline" size="sm" onClick={() => router.push("/w")}>
            К рабочему месту
          </Button>

          <ReopenBlock shift={shift} workshopId={workshopId} context={context} />
        </CardContent>
      </Card>
    );
  }

  async function handleClose() {
    setClosing(true);
    setFailure(null);
    setProblems([]);
    try {
      await shift.close();
      invalidateWorkshopContext(workshopId);
    } catch (e) {
      const all = e instanceof Api1CError ? e.validationMessages : [];
      if (all.length > 0) setProblems(all);
      else setFailure(describeError(e));
    } finally {
      setClosing(false);
    }
  }

  return (
    <Card id="close" className="scroll-mt-16">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Закрытие смены</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="comment">Комментарий, необязательно</Label>
          {/* Комментарий часть документа: уходит в 1С обычным сохранением, до закрытия. */}
          <Input
            id="comment"
            value={shift.state.comment}
            onChange={(e) => shift.update({ comment: e.target.value })}
            placeholder="станок №2 простаивал 40 минут"
          />
        </div>

        {problems.length > 0 ? (
          <div className="flex gap-2 rounded-md border border-destructive p-3 text-sm text-destructive">
            <TriangleAlert className="h-4 w-4 shrink-0" />
            <div>
              {problems.map((text, i) => (
                <p key={i}>{text}</p>
              ))}
              <p className="mt-1 text-muted-foreground">Смена осталась открытой.</p>
            </div>
          </div>
        ) : null}

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

        <DeleteDraft shift={shift} workshopId={workshopId} />

        {/* Кнопка закрытия прижата к низу экрана (Д-5): видна без прокрутки,
            пока смена открыта. Логика закрытия остаётся здесь же. */}
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 p-3 backdrop-blur">
          <div className="mx-auto max-w-3xl">
            <Button
              className="h-[60px] w-full text-lg"
              onClick={() => void handleClose()}
              disabled={closing || needsProducts}
            >
              {closing ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
              Закрыть смену
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------- удаление черновика ----------

/**
 * Открытая смена это черновик: в учёте её ещё нет, удалить безопасно (решение
 * Наиры 29.10). Например, смену открыли по ошибке не той датой или не тем номером.
 * Закрытую смену удалить нельзя: сначала её переоткрывает администратор.
 */
function DeleteDraft({ shift, workshopId }: { shift: ReturnType<typeof useShift>; workshopId?: string }) {
  const router = useRouter();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);

  async function handleDelete() {
    setBusy(true);
    setFailure(null);
    try {
      await shift.remove();
      invalidateWorkshopContext(workshopId);
      router.replace("/w");
    } catch (e) {
      // Метода удаления у сервиса 1С может ещё не быть: платформа отвечает 404/405 без тела.
      if (e instanceof Api1CError && (e.httpStatus === 405 || (e.httpStatus === 404 && !e.isUserFacing))) {
        setFailure("1С не удалила смену: удаление черновиков на стороне 1С ещё не включено.");
      } else {
        setFailure(describeError(e));
      }
      setBusy(false);
    }
  }

  if (!asking) {
    return (
      <Button
        variant="ghost"
        className="h-11 text-destructive hover:text-destructive"
        onClick={() => setAsking(true)}
      >
        <Trash2 className="mr-2 h-4 w-4" />
        Удалить смену
      </Button>
    );
  }

  return (
    <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
      <p className="font-medium">
        Удалить смену {shift.shift?.number ?? ""}? Всё введённое в ней пропадёт.
      </p>
      {failure ? <p className="text-destructive">{failure}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="destructive" className="h-11" onClick={() => void handleDelete()} disabled={busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
          Удалить
        </Button>
        <Button variant="outline" className="h-11" onClick={() => setAsking(false)} disabled={busy}>
          Отмена
        </Button>
      </div>
    </div>
  );
}

// ---------- переоткрытие ----------

/**
 * Переоткрыть закрытую смену может только администратор: 1С отменит отражение
 * в учёте, то есть приход продукции, списание материалов и начисление зарплаты.
 * Поэтому просим причину и предупреждаем, что будет.
 *
 * Если продукцию смены уже передали дальше, 1С переоткрыть не даст (отказ
 * posting_failed с деталями). Предупреждаем об этом заранее по остатку, который
 * знаем, чтобы администратор не искал причину в тексте отказа.
 */
function ReopenBlock({
  shift,
  workshopId,
  context,
}: {
  shift: ReturnType<typeof useShift>;
  workshopId?: string;
  context: WorkshopContext;
}) {
  const { me, workshop } = useApi1C();
  const reflected = shift.shift?.accounting?.status === "done";
  // Выпуск лежит на складе продукции участка (v0.4): по нему и проверяем, не ушла ли продукция дальше.
  const outputWarehouse = outputWarehouseId(withWarehouses(workshop, context.workshop));
  const gone = reflected
    ? shift.state.products
        .map((p) => {
          const line = context.stock.find((x) => x.item_id === p.product_id);
          const have = availableOn(context.stock, outputWarehouse, p.product_id);
          const info = context.products.find((x) => x.id === p.product_id);
          return {
            name: info?.name ?? line?.name ?? p.product_id,
            unit: info?.unit ?? line?.unit ?? "",
            lack: Math.round((p.qty - have) * 1000) / 1000,
          };
        })
        .filter((x) => x.lack > 0)
    : [];
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
        {reflected
          ? "1С отменит отражение в учёте: приход продукции, списание материалов и начисление зарплаты."
          : "В учёте смена ещё не отражена, отменять нечего."}
      </p>

      {gone.length > 0 ? (
        <div className="flex gap-2 rounded-md bg-destructive/10 p-3 text-destructive">
          <TriangleAlert className="h-4 w-4 shrink-0" />
          <p>
            Продукции этой смены на складе уже меньше:{" "}
            {gone.map((g) => `${g.name}, не хватает ${g.lack} ${g.unit}`).join("; ")}. 1С не даст
            переоткрыть, пока её не вернут на склад.
          </p>
        </div>
      ) : null}

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
