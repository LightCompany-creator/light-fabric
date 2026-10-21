"use client";

// Статусы смен, передач и индикатор сохранения: одна палитра на весь цеховой
// раздел (Д-3). Один смысл, один цвет: открыта синяя, ждёт учёта янтарная,
// проведено зелёное, «вас ждут» оранжевое с точкой, прочее серое.
// Слова статусов те же, что были: меняется только подача.

import type { ReactNode } from "react";
import { CloudOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SyncStatus } from "@/lib/api1c/use-shift";

export type StatusKind =
  | "open"
  | "closed"
  | "pending"
  | "posted"
  | "waiting-me"
  | "waiting-other"
  | "unconfirmed"
  | "confirmed";

const STATUS: Record<StatusKind, { label: string; className: string; dot?: string }> = {
  open: { label: "открыта", className: "bg-primary/10 text-primary" },
  closed: { label: "закрыта", className: "bg-slate-200 text-slate-700" },
  pending: { label: "ждёт учёта", className: "bg-amber-100 text-amber-900", dot: "bg-amber-600" },
  posted: { label: "проведено", className: "bg-emerald-100 text-emerald-800" },
  "waiting-me": { label: "вас ждут", className: "bg-orange-100 text-orange-900", dot: "bg-orange-600" },
  "waiting-other": {
    label: "ждёт вторую сторону",
    className: "border border-dashed border-slate-400 bg-slate-50 text-slate-600",
  },
  unconfirmed: { label: "не подтверждено", className: "bg-slate-100 text-slate-600" },
  confirmed: { label: "подтверждено", className: "bg-emerald-100 text-emerald-800" },
};

const base =
  "inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-[13px] font-semibold";

export function StatusBadge({
  kind,
  children,
  className,
}: {
  kind: StatusKind;
  /** Свой текст вместо подписи по умолчанию: «вас ждут: 2», «Размела, 15:30». */
  children?: ReactNode;
  className?: string;
}) {
  const s = STATUS[kind];
  return (
    <span className={cn(base, s.className, className)}>
      {s.dot ? <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", s.dot)} /> : null}
      {children ?? s.label}
    </span>
  );
}

// ---------- индикатор сохранения в шапке смены ----------

const SYNC: Record<SyncStatus, { text: string; className: string; dot?: string }> = {
  loading: { text: "загрузка", className: "bg-slate-100 text-slate-600" },
  saved: { text: "сохранено в 1С", className: "bg-emerald-100 text-emerald-800", dot: "bg-emerald-600" },
  saving: { text: "сохраняю", className: "bg-slate-100 text-slate-600" },
  pending: { text: "не сохранено", className: "bg-amber-100 text-amber-900", dot: "bg-amber-600" },
  offline: { text: "нет связи, сохранено на планшете", className: "bg-slate-700 text-white" },
  conflict: { text: "расхождение", className: "bg-red-100 text-red-800", dot: "bg-red-600" },
  error: { text: "ошибка", className: "bg-red-100 text-red-800", dot: "bg-red-600" },
};

export function SyncBadge({ status }: { status: SyncStatus }) {
  const s = SYNC[status];
  return (
    <span className={cn(base, s.className)} role="status">
      {status === "saving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : null}
      {status === "offline" ? <CloudOff className="h-3.5 w-3.5" aria-hidden="true" /> : null}
      {s.dot ? <span aria-hidden="true" className={cn("h-2 w-2 rounded-full", s.dot)} /> : null}
      {s.text}
    </span>
  );
}
