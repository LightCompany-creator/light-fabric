"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowLeft, ArrowRight, Check, Loader2, LockOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import {
  acceptOrderAction,
  addOrderLineAction,
  closeOrderAction,
  createSuborderAction,
  deleteOrderAction,
  removeOrderLineAction,
  reopenOrderAction,
  type FormState,
} from "../actions";

const INITIAL: FormState = { error: null };

const SUBORDER_STATUS_LABEL: Record<string, string> = {
  assigned: "назначен",
  correction_requested: "правка запрошена",
  in_progress: "в работе",
  closed: "закрыт",
};

type DocProps = {
  id: string;
  docNumber: string;
  orderDate: string;
  dueDate: string | null;
  status: string;
  comment: string | null;
  createdByName: string | null;
  closedByName: string | null;
  closedAt: string | null;
};

type LineProps = { id: string; qty: number; articleCode: string; articleName: string };
type SuborderProps = {
  id: string;
  docNumber: string;
  status: string;
  dueDate: string | null;
  workshop: string;
  planned: number;
  produced: number;
};
type ArticleOption = { id: string; code: string; name: string };
type WorkshopOption = { id: string; code: string; name: string };

export function OrderDoc({
  doc,
  lines,
  suborders,
  articles,
  workshops,
  canManage,
  canCreate,
}: {
  doc: DocProps;
  lines: LineProps[];
  suborders: SuborderProps[];
  articles: ArticleOption[];
  workshops: WorkshopOption[];
  canManage: boolean;
  canCreate: boolean;
}) {
  const isDraft = doc.status === "draft";
  const isClosed = doc.status === "closed";
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);
  const allClosed = suborders.length > 0 && suborders.every((s) => s.status === "closed");

  const addLineWithId = addOrderLineAction.bind(null, doc.id);
  const [addState, addAction] = useFormState(addLineWithId, INITIAL);

  const acceptWithId = acceptOrderAction.bind(null, doc.id);
  const [acceptState, acceptAction] = useFormState(acceptWithId, INITIAL);

  const createSubWithId = createSuborderAction.bind(null, doc.id);
  const [subState, subAction] = useFormState(createSubWithId, INITIAL);

  const closeWithId = closeOrderAction.bind(null, doc.id);
  const [closeState, closeAction] = useFormState(closeWithId, INITIAL);

  const reopenWithId = reopenOrderAction.bind(null, doc.id);
  const [reopenState, reopenAction] = useFormState(reopenWithId, INITIAL);

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Заказ ${doc.docNumber}`}
        description={`${format(parseISO(doc.orderDate), "d MMMM yyyy", { locale: ru })}${
          doc.dueDate ? ` · срок до ${format(parseISO(doc.dueDate), "d MMM yyyy", { locale: ru })}` : ""
        }`}
        actions={
          <Button asChild variant="ghost">
            <Link href="/orders">
              <ArrowLeft className="mr-2 h-4 w-4" />К списку
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        {isClosed ? (
          <Badge variant="outline">
            закрыт
            {doc.closedByName ? ` · ${doc.closedByName}` : ""}
            {doc.closedAt
              ? ` · ${format(parseISO(doc.closedAt), "d MMM HH:mm", { locale: ru })}`
              : ""}
          </Badge>
        ) : isDraft ? (
          <Badge variant="destructive">черновик · ждёт приёма начальником производства</Badge>
        ) : (
          <Badge className="bg-accent text-accent-foreground">в работе</Badge>
        )}
        {doc.createdByName ? (
          <span className="text-sm text-muted-foreground">Создал: {doc.createdByName}</span>
        ) : null}
        {doc.comment ? (
          <span className="text-sm text-muted-foreground">«{doc.comment}»</span>
        ) : null}
      </div>

      {isDraft && canManage ? (
        <Card className="border-accent/40 bg-accent/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <p className="text-sm text-muted-foreground">
              Заказ от коммерческого директора ждёт приёма в работу
            </p>
            <form action={acceptAction} className="flex items-center gap-3">
              {acceptState.error ? (
                <p className="text-sm text-destructive">{acceptState.error}</p>
              ) : null}
              <AcceptOrderButton />
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Строки заказа</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Артикул</TableHead>
                <TableHead>Наименование</TableHead>
                <TableHead className="w-28 text-right">Кол-во, пар</TableHead>
                {!isClosed && canCreate ? <TableHead className="w-16"></TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={!isClosed && canCreate ? 4 : 3}
                    className="text-center text-muted-foreground"
                  >
                    Строк пока нет — добавьте артикулы ниже
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-sm">{l.articleCode}</TableCell>
                    <TableCell>{l.articleName}</TableCell>
                    <TableCell className="text-right font-mono-tabular">{l.qty}</TableCell>
                    {!isClosed && canCreate ? (
                      <TableCell>
                        <form action={removeOrderLineAction}>
                          <input type="hidden" name="order_id" value={doc.id} />
                          <input type="hidden" name="id" value={l.id} />
                          <Button type="submit" variant="ghost" size="icon" title="Удалить строку">
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </form>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))
              )}
              {lines.length > 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="font-medium">
                    Итого
                  </TableCell>
                  <TableCell className="text-right font-mono-tabular font-medium">
                    {totalQty}
                  </TableCell>
                  {!isClosed && canCreate ? <TableCell /> : null}
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          {!isClosed && canCreate ? (
            <form
              action={addAction}
              className="grid grid-cols-1 items-end gap-3 border-t pt-4 sm:grid-cols-[1fr_140px_auto]"
            >
              <div className="space-y-1.5">
                <Label htmlFor="article_id">Артикул</Label>
                <Select name="article_id">
                  <SelectTrigger id="article_id">
                    <SelectValue placeholder="Выберите артикул" />
                  </SelectTrigger>
                  <SelectContent>
                    {articles.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.code} · {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qty">Кол-во, пар</Label>
                <Input id="qty" name="qty" type="number" min={1} inputMode="numeric" />
              </div>
              <AddLineButton />
              {addState.error ? (
                <p className="text-sm text-destructive sm:col-span-3">{addState.error}</p>
              ) : null}
            </form>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Дерево заказа</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-md border bg-secondary/30 px-4 py-3 text-sm font-medium">
            Заказ {doc.docNumber} · {totalQty} пар план
          </div>

          {suborders.length === 0 ? (
            <p className="pl-4 text-sm text-muted-foreground">
              Заказ ещё не распределён по цехам
            </p>
          ) : (
            <div className="space-y-2 border-l-2 border-border pl-4">
              {suborders.map((s) => {
                const pct = s.planned > 0 ? Math.min(100, Math.round((s.produced / s.planned) * 100)) : 0;
                return (
                  <Link
                    key={s.id}
                    href={`/orders/suborders/${s.id}`}
                    className="-ml-[18px] flex items-center gap-3 rounded-md border bg-card px-3 py-2.5 pl-4 transition-colors hover:bg-secondary"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-border" />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm">{s.docNumber}</span>
                        <span className="text-sm font-medium">{s.workshop}</span>
                        {s.status === "closed" ? (
                          <Badge variant="outline">закрыт</Badge>
                        ) : s.status === "correction_requested" ? (
                          <Badge variant="destructive">правка запрошена</Badge>
                        ) : (
                          <Badge className="bg-accent text-accent-foreground">
                            {SUBORDER_STATUS_LABEL[s.status] ?? s.status}
                          </Badge>
                        )}
                        {s.dueDate ? (
                          <span className="text-xs text-muted-foreground">
                            срок {format(parseISO(s.dueDate), "d MMM", { locale: ru })}
                          </span>
                        ) : null}
                      </div>
                      {s.planned > 0 ? (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1.5 w-32 overflow-hidden rounded-full bg-secondary">
                            <div
                              className="h-full rounded-full bg-brand"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono-tabular text-xs text-muted-foreground">
                            {s.produced}/{s.planned}
                          </span>
                        </div>
                      ) : null}
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </Link>
                );
              })}
            </div>
          )}

          {!isDraft && !isClosed && canManage ? (
            <form
              action={subAction}
              className="grid grid-cols-1 items-end gap-3 border-t pt-4 sm:grid-cols-[1fr_160px_auto]"
            >
              <div className="space-y-1.5">
                <Label htmlFor="workshop_id">Назначить цеху</Label>
                <Select name="workshop_id">
                  <SelectTrigger id="workshop_id">
                    <SelectValue placeholder="Выберите цех" />
                  </SelectTrigger>
                  <SelectContent>
                    {workshops.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.code} · {w.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="due_date">Срок</Label>
                <Input id="due_date" name="due_date" type="date" />
              </div>
              <CreateSubButton />
              {subState.error ? (
                <p className="text-sm text-destructive sm:col-span-3">{subState.error}</p>
              ) : null}
            </form>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {!isClosed && canCreate ? (
          <form action={deleteOrderAction}>
            <input type="hidden" name="id" value={doc.id} />
            <Button type="submit" variant="ghost" className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить заказ
            </Button>
          </form>
        ) : (
          <span />
        )}

        {!isDraft && !isClosed && canManage ? (
          <form action={closeAction} className="flex items-center gap-3">
            {closeState.error ? <p className="text-sm text-destructive">{closeState.error}</p> : null}
            <CloseButton disabled={!allClosed} />
          </form>
        ) : isClosed && canManage ? (
          <form action={reopenAction} className="flex items-center gap-3">
            {reopenState.error ? (
              <p className="text-sm text-destructive">{reopenState.error}</p>
            ) : null}
            <ReopenButton />
          </form>
        ) : isClosed ? (
          <p className="text-sm text-muted-foreground">
            Заказ закрыт. Переоткрыть может начальник производства или администратор.
          </p>
        ) : null}
      </div>
      {!isDraft && !isClosed && canManage && !allClosed ? (
        <p className="text-right text-xs text-muted-foreground">
          Закрыть заказ можно, когда закрыты все подзаказы
        </p>
      ) : null}
    </div>
  );
}

function AddLineButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Добавить
    </Button>
  );
}

function AcceptOrderButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
      Принять заказ в работу
    </Button>
  );
}

function CreateSubButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="secondary" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Создать подзаказ
    </Button>
  );
}

function CloseButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={disabled || pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
      Закрыть заказ
    </Button>
  );
}

function ReopenButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <LockOpen className="mr-2 h-4 w-4" />
      )}
      Переоткрыть (админ)
    </Button>
  );
}
