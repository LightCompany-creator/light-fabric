"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { ru } from "date-fns/locale";
import { ArrowLeft, Check, Loader2, LockOpen, Trash2 } from "lucide-react";
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
  acceptTransferAction,
  addLineAction,
  deleteTransferAction,
  removeLineAction,
  reopenTransferAction,
  type FormState,
} from "../actions";

const INITIAL: FormState = { error: null };

type DocProps = {
  id: string;
  docNumber: string;
  transferDate: string;
  status: "open" | "accepted";
  comment: string | null;
  fromWorkshop: string;
  toWorkshop: string;
  createdByName: string | null;
  acceptedByName: string | null;
  acceptedAt: string | null;
};

type LineProps = {
  id: string;
  qty: number;
  articleCode: string;
  articleName: string;
};

type ArticleOption = {
  id: string;
  code: string;
  name: string;
  stockQty: number;
};

export function TransferDoc({
  doc,
  lines,
  articles,
  isAdmin,
}: {
  doc: DocProps;
  lines: LineProps[];
  articles: ArticleOption[];
  isAdmin: boolean;
}) {
  const isOpen = doc.status === "open";
  const totalQty = lines.reduce((s, l) => s + l.qty, 0);

  const addLineWithId = addLineAction.bind(null, doc.id);
  const [addState, addAction] = useFormState(addLineWithId, INITIAL);

  const acceptWithId = acceptTransferAction.bind(null, doc.id);
  const [acceptState, acceptAction] = useFormState(acceptWithId, INITIAL);

  const reopenWithId = reopenTransferAction.bind(null, doc.id);
  const [reopenState, reopenAction] = useFormState(reopenWithId, INITIAL);

  return (
    <div className="space-y-4">
      <PageHeader
        title={`Перемещение ${doc.docNumber}`}
        description={`${doc.fromWorkshop} → ${doc.toWorkshop} · ${format(
          parseISO(doc.transferDate),
          "d MMMM yyyy",
          { locale: ru },
        )}`}
        actions={
          <Button asChild variant="ghost">
            <Link href="/transfers">
              <ArrowLeft className="mr-2 h-4 w-4" />К списку
            </Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        {isOpen ? (
          <Badge className="bg-accent text-accent-foreground">открыт</Badge>
        ) : (
          <Badge variant="outline">
            принят
            {doc.acceptedByName ? ` · ${doc.acceptedByName}` : ""}
            {doc.acceptedAt
              ? ` · ${format(parseISO(doc.acceptedAt), "d MMM HH:mm", { locale: ru })}`
              : ""}
          </Badge>
        )}
        {doc.createdByName ? (
          <span className="text-sm text-muted-foreground">
            Создал: {doc.createdByName}
          </span>
        ) : null}
        {doc.comment ? (
          <span className="text-sm text-muted-foreground">«{doc.comment}»</span>
        ) : null}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Строки документа</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-32">Артикул</TableHead>
                <TableHead>Наименование</TableHead>
                <TableHead className="w-28 text-right">Кол-во, пар</TableHead>
                {isOpen ? <TableHead className="w-16"></TableHead> : null}
              </TableRow>
            </TableHeader>
            <TableBody>
              {lines.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isOpen ? 4 : 3}
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
                    <TableCell className="text-right font-mono-tabular">
                      {l.qty}
                    </TableCell>
                    {isOpen ? (
                      <TableCell>
                        <form action={removeLineAction}>
                          <input type="hidden" name="transfer_id" value={doc.id} />
                          <input type="hidden" name="id" value={l.id} />
                          <Button
                            type="submit"
                            variant="ghost"
                            size="icon"
                            title="Удалить строку"
                          >
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
                  {isOpen ? <TableCell /> : null}
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          {isOpen ? (
            <form
              action={addAction}
              className="grid grid-cols-1 items-end gap-3 border-t pt-4 sm:grid-cols-[1fr_140px_auto]"
            >
              <div className="space-y-1.5">
                <Label htmlFor="article_id">Артикул (остаток отправителя)</Label>
                <Select name="article_id">
                  <SelectTrigger id="article_id">
                    <SelectValue placeholder="Выберите артикул" />
                  </SelectTrigger>
                  <SelectContent>
                    {articles.length === 0 ? (
                      <SelectItem value="none" disabled>
                        На складе отправителя пусто
                      </SelectItem>
                    ) : (
                      articles.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.code} · {a.name} (ост. {a.stockQty})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qty">Кол-во, пар</Label>
                <Input id="qty" name="qty" type="number" min={1} inputMode="numeric" />
              </div>
              <AddLineButton />
              {addState.error ? (
                <p className="text-sm text-destructive sm:col-span-3">
                  {addState.error}
                </p>
              ) : null}
            </form>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {isOpen ? (
          <form action={deleteTransferAction}>
            <input type="hidden" name="id" value={doc.id} />
            <Button type="submit" variant="ghost" className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить документ
            </Button>
          </form>
        ) : (
          <span />
        )}

        {isOpen ? (
          <form action={acceptAction} className="flex items-center gap-3">
            {acceptState.error ? (
              <p className="text-sm text-destructive">{acceptState.error}</p>
            ) : null}
            <AcceptButton />
          </form>
        ) : isAdmin ? (
          <form action={reopenAction} className="flex items-center gap-3">
            {reopenState.error ? (
              <p className="text-sm text-destructive">{reopenState.error}</p>
            ) : null}
            <ReopenButton />
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            Документ закрыт. Переоткрыть может только администратор.
          </p>
        )}
      </div>
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
    <Button type="submit" size="lg" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Check className="mr-2 h-4 w-4" />
      )}
      Принять (закрыть документ)
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