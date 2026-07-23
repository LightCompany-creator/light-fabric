import type { Enums } from "@/lib/supabase/types";
import { NavBrand, NavList, type NavBadge } from "./nav-list";

export function Sidebar({
  role,
  ordersBadge,
}: {
  role: Enums<"user_role"> | null;
  ordersBadge: NavBadge;
}) {
  return (
    <aside className="hidden h-full w-60 flex-col gap-1 border-r border-border bg-card p-3 md:flex">
      <NavBrand />
      <div className="flex-1 overflow-y-auto">
        <NavList role={role} badge={ordersBadge} />
      </div>
    </aside>
  );
}
