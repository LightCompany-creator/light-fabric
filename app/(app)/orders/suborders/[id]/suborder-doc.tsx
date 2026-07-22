"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowLeft, Check, Loader2, LockOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  acceptSuborderAction,
  addSuborderLineAction,
  closeSuborderProductionAction,
  closeSuborderWorkshopAction,
  removeSuborderLineAction,
  reopenSuborderAction,
  requestCorrectionAction,
  resolveCorrectionAction,
  type FormState,
} from "../actions";

const INITIAL: FormState = { error: null };

const STATUS_LABEL: Record<string, string> = {
  assigned: "назначен",
  correction_requested: "правка запрошена",
  in_progress: "в работе",
  closed: "закрыт",
};

type DocProps = {
  id: string;
  docNumber: string;
  orderDocNumber: string;
  workshop: string;
  dueDate: string | null;
  status: string;
  correctionComment: string | null;
  acceptedByName: string | null;
  workshopConfirmedByName: string | null;
  workshopConfirmedAt: string | null;
  productionConfirmedByName: string | null;
  productionConfirmedAt: string | null;
};

type LineProps = {
  id: string;
  qty: number;
  articleCode: string;
  articleName: string;
  producedQty: number;
};

type ArticleOption = { id: string; code: string; name: string };

export function SuborderDoc({
  doc,
  lines,
  articles,
  canEditLines,
  canActWorkshopSide,
  canActProductionSide,
  isAdmin,
}: {
  doc: DocProps;
  lines: LineProps[];
  articles: ArticleOption[];
  canEditLines: boolean;
  canActWorkshopSide: boolean;
  canActProductionSide: boolean;
  isAdmin: boolean;
}) {
  const isClosed = doc.status === "closed";
  const isAssigned = doc.status === "assigned";
  const isCorrectionRequested = doc.status === "correction_requested";
  const isInProgress = doc.status === "in_progress";
  const totalPlanned = lines.reduce((s, l) => s + l.qty, 0);
  const totalProduced = lines.reduce((s, l) => s + l.producedQty, 0);

  const addLineWithId = addSuborderLineAction.bind(null, doc.id);
  const [addState, addAction] = useFormState(addLineWithId, INITIAL);

  const acceptWithId = acceptSuborderAction.bind(null, doc.id);
  const [acceptState, acceptAction] = useFormState(acceptWithId, INITIAL);

  const requestCorrWithId = requestCorrectionAction.bind(null, doc.id);
  const [reqCorrState, reqCorrAction] = useFormState(requestCorrWithId, INITIAL);

  const resolveCorrWithId = resolveCorrectionAction.bind(null, doc.id);
  const [resolveCorrState, resolveCorrAction] = useFormState(resolveCorrWithId, INITIAL);

  const closeWsWithId = closeSuborderWorkshopAction.bind(null, doc.id);
  const [closeWsState, closeWsAction] = useFormState(closeWsWithId, INITIAL);

  const closeProdWithId = closeSuborderProductionAction.bind(null, doc.id);
  const [closeProdState, closeProdAction] = useFormState(closeProdWithId, INITIAL);

  const reopenWithId = reopenSuborderAction.bind(null, doc.id);
  const [reopenState, reopenAction] = useFormState(reopenWithId, INITIAL);

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Подзаказ ${doc.docNumber}`}
        description={`${doc.workshop} · заказ ${doc.orderDocNumber}${
          doc.dueDate ? ` · срок до ${format(parseISO(doc.dueDate), "d MMM yyyy", { locale: ru })}` : ""
        }`}
        actions={
          <Button asChild variant="ghost">
            <Link href="/orders/suborders">
              <ArrowLeft className="mr-2 h-4 w-4" />К списку
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        {isClosed ? (
          <Badge variant="outline">закрыт</Badge>
        ) : isCorrectionRequested ? (
          <Badge variant="destructive">правка запрошена</Badge>
        ) : (
          <Badge className="bg-accent text-accent-foreground">
            {STATUS_LABEL[doc.status] ?? doc.status}
          </Badge>
        )}
        {doc.acceptedByName ? (
          <span className="text-sm text-muted-foreground">Принял: {doc.acceptedByName}</span>
        ) : null}
      </div>

      {isCorrectionRequested && doc.correctionComment ? (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="p-4 text-sm">
            <span className="font-medium">Цех просит скорректировать: </span>
            {doc.correctionComment}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>План / факт</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Артикул</TableHead>
                <TableHead>Наименование</TableHead>
                <TableHead className="w-24 text-right">План</TableHead>
                <TableHead className="w-24 text-right">Факт</TableHead>
                {canEditLines && !isClosed ? <TableHead className="w-16"></TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={canEditLines && !isClosed ? 5 : 4}
                    className="text-center text-muted-foreground"
                  >
                    Строк пока нет
                  </TableCell>
                </TableRow>
              ) : (
                lines.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-sm">{l.articleCode}</TableCell>
                    <TableCell>{l.articleName}</TableCell>
                    <TableCell className="text-right font-mono-tabular">{l.qty}</TableCell>
                    <TableCell className="text-right font-mono-tabular">
                      {l.producedQty}
                    </TableCell>
                    {canEditLines && !isClosed ? (
                      <TableCell>
                        <form action={removeSuborderLineAction}>
                          <input type="hidden" name="suborder_id" value={doc.id} />
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
                    {totalPlanned}
                  </TableCell>
                  <TableCell className="text-right font-mono-tabular font-medium">
                    {totalProduced}
                  </TableCell>
                  {canEditLines && !isClosed ? <TableCell /> : null}
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          {canEditLines && !isClosed ? (
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

      {(isAssigned || isCorrectionRequested) && canActWorkshopSide ? (
        <Card>
          <CardHeader>
            <CardTitle>Решение цеха</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={acceptAction} className="flex items-center gap-3">
              {acceptState.error ? (
                <p className="text-sm text-destructive">{acceptState.error}</p>
              ) : null}
              <AcceptButton />
            </form>
            {isAssigned ? (
              <form action={reqCorrAction} className="space-y-2 border-t pt-4">
                <Label htmlFor="comment">Или запросить корректировку (например, срок)</Label>
                <Textarea id="comment" name="comment" placeholder="Что нужно поправить?" />
                {reqCorrState.error ? (
                  <p className="text-sm text-destructive">{reqCorrState.error}</p>
                ) : null}
                <RequestCorrectionButton />
              </form>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {isCorrectionRequested && canActProductionSide ? (
        <Card>
          <CardHeader>
            <CardTitle>Ответ на корректировку</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={resolveCorrAction} className="flex flex-wrap items-end gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="due_date">Новый срок</Label>
                <Input id="due_date" name="due_date" type="date" defaultValue={doc.dueDate ?? ""} />
              </div>
              <ResolveCorrectionButton />
              {resolveCorrState.error ? (
                <p className="w-full text-sm text-destructive">{resolveCorrState.error}</p>
              ) : null}
            </form>
          </CardContent>
        </Card>
      ) : null}

      {isInProgress ? (
        <Card>
          <CardHeader>
            <CardTitle>Закрытие подзаказа</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Закрывается, когда подтвердят обе стороны — цех и производство.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              {doc.workshopConfirmedByName ? (
                <Badge variant="outline">
                  Цех подтвердил: {doc.workshopConfirmedByName}
                  {doc.workshopConfirmedAt
                    ? ` · ${format(parseISO(doc.workshopConfirmedAt), "d MMM HH:mm", { locale: ru })}`
                    : ""}
                </Badge>
              ) : canActWorkshopSide ? (
                <form action={closeWsAction} className="flex items-center gap-2">
                  {closeWsState.error ? (
                    <p className="text-sm text-destructive">{closeWsState.error}</p>
                  ) : null}
                  <ConfirmButton label="Подтвердить выполнение (цех)" />
                </form>
              ) : (
                <Badge variant="outline">Цех ещё не подтвердил</Badge>
              )}

              {doc.productionConfirmedByName ? (
                <Badge variant="outline">
                  Производство подтвердило: {doc.productionConfirmedByName}
                  {doc.productionConfirmedAt
                    ? ` · ${format(parseISO(doc.productionConfirmedAt), "d MMM HH:mm", { locale: ru })}`
                    : ""}
                </Badge>
              ) : canActProductionSide ? (
                <form action={closeProdAction} className="flex items-center gap-2">
                  {closeProdState.error ? (
                    <p className="text-sm text-destructive">{closeProdState.error}</p>
                  ) : null}
                  <ConfirmButton label="Подтвердить приёмку (производство)" />
                </form>
              ) : (
                <Badge variant="outline">Производство ещё не подтвердило</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {isClosed ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              Цех: {doc.workshopConfirmedByName ?? "—"}
              {doc.workshopConfirmedAt
                ? ` · ${format(parseISO(doc.workshopConfirmedAt), "d MMM HH:mm", { locale: ru })}`
                : ""}
            </p>
            <p>
              Производство: {doc.productionConfirmedByName ?? "—"}
              {doc.productionConfirmedAt
                ? ` · ${format(parseISO(doc.productionConfirmedAt), "d MMM HH:mm", { locale: ru })}`
                : ""}
            </p>
          </div>
          {isAdmin ? (
            <form action={reopenAction} className="flex items-center gap-3">
              {reopenState.error ? (
                <p className="text-sm text-destructive">{reopenState.error}</p>
              ) : null}
              <ReopenButton />
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">
              Переоткрыть может только администратор.
            </p>
          )}
        </div>
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

function AcceptButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
      Принять в работу
    </Button>
  );
}

function RequestCorrectionButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Запросить корректировку
    </Button>
  );
}

function ResolveCorrectionButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
      Вернуть цеху
    </Button>
  );
}

function ConfirmButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
      {label}
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
