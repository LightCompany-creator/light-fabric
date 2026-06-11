"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  Beaker,
  Boxes,
  ClipboardList,
  Coins,
  Factory,
  Home,
  LayoutDashboard,
  Presentation,
  Printer,
  Scale,
  Tag,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Enums } from "@/lib/supabase/types";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
};

const PRESENTATION: NavItem = {
  href: "/decks/presentation.html",
  label: "Презентация",
  icon: Presentation,
  external: true,
};
const WALL_POSTER: NavItem = {
  href: "/decks/wall-poster.html",
  label: "Инструкция на стену (A4)",
  icon: Printer,
  external: true,
};

const NAV: Record<Enums<"user_role">, NavItem[]> = {
  foreman: [
    { href: "/dashboard", label: "Главная", icon: Home },
    { href: "/shifts", label: "Смены", icon: ClipboardList },
    { href: "/transfers", label: "Перемещения", icon: ArrowLeftRight },
    { href: "/stocks", label: "Остатки", icon: Boxes },
    WALL_POSTER,
  ],
  technologist: [
    { href: "/dashboard", label: "Главная", icon: Home },
    { href: "/catalog/articles", label: "Артикулы", icon: Tag },
    { href: "/catalog/rates", label: "Расценки", icon: Coins },
    { href: "/catalog/norms", label: "Нормы", icon: Scale },
    { href: "/catalog/employees", label: "Работники", icon: Users },
    { href: "/catalog/materials", label: "Материалы", icon: Boxes },
    { href: "/catalog/workshops", label: "Цеха", icon: Factory },
    WALL_POSTER,
  ],
  director: [
    { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
    { href: "/shifts", label: "Все смены", icon: ClipboardList },
    { href: "/transfers", label: "Перемещения", icon: ArrowLeftRight },
    { href: "/stocks", label: "Остатки", icon: Boxes },
    { href: "/reports/production", label: "Производство", icon: TrendingUp },
    { href: "/reports/payroll", label: "ФОТ", icon: Wallet },
    { href: "/reports/materials", label: "Расход материалов", icon: Beaker },
    PRESENTATION,
  ],
  accountant: [
    { href: "/dashboard", label: "Главная", icon: Home },
    { href: "/stocks", label: "Остатки", icon: Boxes },
    { href: "/reports/payroll", label: "Ведомости ЗП", icon: Wallet },
    { href: "/reports/production", label: "Выпуск", icon: TrendingUp },
    { href: "/reports/materials", label: "Расход", icon: Beaker },
    { href: "/sync", label: "Обмен с 1С", icon: ArrowLeftRight },
  ],
  // Admin видит всё и управляет всем — это объединение всех ролей.
  admin: [
    { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
    { href: "/shifts", label: "Все смены", icon: ClipboardList },
    { href: "/transfers", label: "Перемещения", icon: ArrowLeftRight },
    { href: "/stocks", label: "Остатки", icon: Boxes },
    { href: "/catalog/articles", label: "Артикулы", icon: Tag },
    { href: "/catalog/rates", label: "Расценки", icon: Coins },
    { href: "/catalog/norms", label: "Нормы", icon: Scale },
    { href: "/catalog/employees", label: "Работники", icon: Users },
    { href: "/catalog/materials", label: "Материалы", icon: Boxes },
    { href: "/catalog/workshops", label: "Цеха", icon: Factory },
    { href: "/reports/production", label: "Производство", icon: TrendingUp },
    { href: "/reports/payroll", label: "Ведомости ЗП", icon: Wallet },
    { href: "/reports/materials", label: "Расход материалов", icon: Beaker },
    { href: "/sync", label: "Обмен с 1С", icon: ArrowLeftRight },
    PRESENTATION,
    WALL_POSTER,
  ],
};

export function NavList({
  role,
  onNavigate,
}: {
  role: Enums<"user_role"> | null;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = role ? NAV[role] : [];

  return (
    <nav className="flex flex-col gap-0.5">
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          !item.external &&
          (pathname === item.href || pathname.startsWith(item.href + "/"));
        const className = cn(
          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          active
            ? "bg-primary text-primary-foreground"
            : "text-foreground hover:bg-secondary",
        );

        if (item.external) {
          return (
            <a
              key={item.href}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onNavigate}
              className={className}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </a>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={className}
          >
            <Icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function NavBrand() {
  return (
    <Link
      href="/dashboard"
      className="block px-3 py-4 transition-opacity hover:opacity-80"
    >
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        Light Company
      </p>
      <p className="text-xl font-bold text-brand">LightFabric</p>
    </Link>
  );
}
