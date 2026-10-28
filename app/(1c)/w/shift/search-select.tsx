"use client";

// Выпадающий список с поиском для длинных справочников 1С: видов работ
// и продукции у участка десятки, искать их по кнопкам неудобно.
// Список раскрывается под полем (не поверх), чтобы на планшете ничего
// не обрезалось и не пряталось под клавиатуру.

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchOption = { id: string; label: string; hint?: string };

/** Поиск по всем словам запроса, без учёта регистра и ё/е. */
function normalize(text: string): string {
  return text.toLowerCase().replace(/ё/g, "е");
}

export function SearchSelect({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = "Выберите",
}: {
  id: string;
  label: string;
  options: SearchOption[];
  value: string;
  onChange: (id: string) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);

  const selected = options.find((o) => o.id === value);

  const shown = useMemo(() => {
    const words = normalize(query).split(/\s+/).filter(Boolean);
    if (words.length === 0) return options;
    return options.filter((o) => {
      const text = normalize(`${o.label} ${o.hint ?? ""}`);
      return words.every((w) => text.includes(w));
    });
  }, [options, query]);

  // Закрыть по касанию вне списка.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (root.current && !root.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
    };
  }, [open]);

  useEffect(() => {
    if (open) search.current?.focus();
    else setQuery("");
  }, [open]);

  function pick(optionId: string) {
    onChange(optionId);
    setOpen(false);
  }

  return (
    <div ref={root} className="space-y-1.5">
      <p id={`${id}-label`} className="text-sm font-medium text-muted-foreground">
        {label}
      </p>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={`${id}-label ${id}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-12 w-full items-center justify-between gap-2 rounded-md border bg-card px-3 text-left text-[15px] transition-colors",
          open ? "border-primary ring-2 ring-primary/20" : "border-input hover:bg-muted/40",
        )}
      >
        <span className={cn("min-w-0 truncate", selected ? "font-medium" : "text-muted-foreground")}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown
          className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {open ? (
        <div className="rounded-md border bg-card shadow-sm">
          <div className="border-b p-2">
            <input
              ref={search}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") setOpen(false);
                if (e.key === "Enter" && shown.length === 1) pick(shown[0].id);
              }}
              placeholder="Поиск"
              aria-label={`Поиск: ${label}`}
              className="h-11 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div role="listbox" aria-labelledby={`${id}-label`} className="max-h-72 overflow-y-auto py-1">
            {shown.length === 0 ? (
              <p className="px-3 py-3 text-sm text-muted-foreground">Ничего не найдено</p>
            ) : (
              shown.map((o) => {
                const on = o.id === value;
                return (
                  <button
                    key={o.id}
                    type="button"
                    role="option"
                    aria-selected={on}
                    onClick={() => pick(o.id)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-2 px-3 py-2 text-left text-[15px] transition-colors",
                      on ? "bg-primary/10 font-semibold text-primary" : "hover:bg-muted/60",
                    )}
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center" aria-hidden="true">
                      {on ? <Check className="h-4 w-4" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">{o.label}</span>
                    {o.hint ? <span className="shrink-0 text-sm text-muted-foreground">{o.hint}</span> : null}
                  </button>
                );
              })
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
