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
  Inbox,
  LayoutDashboard,
  Package,
  Route,
  Scale,
  Tag,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Enums } from "@/lib/supabase/types";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV: Record<Enums<"user_role">, NavItem[]> = {
  foreman: [
    { href: "/dashboard", label: "Главная", icon: Home },
    { href: "/shifts", label: "Смены", icon: ClipboardList },
    { href: "/batches/incoming", label: "Входящие партии", icon: Inbox },
    { href: "/batches", label: "Все партии", icon: Package },
  ],
  technologist: [
    { href: "/dashboard", label: "Главная", icon: Home },
    { href: "/catalog/articles", label: "Артикулы", icon: Tag },
    { href: "/catalog/rates", label: "Расценки", icon: Coins },
    { href: "/catalog/norms", label: "Нормы", icon: Scale },
    { href: "/catalog/routes", label: "Маршруты", icon: Route },
    { href: "/catalog/employees", label: "Работники", icon: Users },
    { href: "/catalog/materials", label: "Материалы", icon: Boxes },
    { href: "/catalog/workshops", label: "Цеха", icon: Factory },
  ],
  director: [
    { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
    { href: "/shifts", label: "Все смены", icon: ClipboardList },
    { href: "/batches", label: "Все партии", icon: Package },
    { href: "/reports/production", label: "Производство", icon: TrendingUp },
    { href: "/reports/payroll", label: "ФОТ", icon: Wallet },
    { href: "/reports/materials", label: "Расход материалов", icon: Beaker },
  ],
  accountant: [
    { href: "/dashboard", label: "Главная", icon: Home },
    { href: "/reports/payroll", label: "Ведомости ЗП", icon: Wallet },
    { href: "/reports/production", label: "Выпуск", icon: TrendingUp },
    { href: "/reports/materials", label: "Расход", icon: Beaker },
    { href: "/sync", label: "Обмен с 1С", icon: ArrowLeftRight },
  ],
  admin: [
    { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
    { href: "/shifts", label: "Все смены", icon: ClipboardList },
    { href: "/batches", label: "Все партии", icon: Package },
    { href: "/catalog/articles", label: "Артикулы", icon: Tag },
    { href: "/catalog/rates", label: "Расценки", icon: Coins },
    { href: "/catalog/employees", label: "Работники", icon: Users },
    { href: "/reports/payroll", label: "Ведомости ЗП", icon: Wallet },
    { href: "/sync", label: "Обмен с 1С", icon: ArrowLeftRight },
  ],
};

export function Sidebar({ role }: { role: Enums<"user_role"> | null }) {
  const pathname = usePathname();
  const items = role ? NAV[role] : [];

  return (
    <aside className="flex h-full w-60 flex-col gap-1 border-r border-border bg-card p-3">
      <div className="px-3 py-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
          Light Company
        </p>
        <p className="text-xl font-bold text-brand">LightFlow</p>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-secondary",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
