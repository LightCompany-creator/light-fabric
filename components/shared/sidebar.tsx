import type { Enums } from "@/lib/supabase/types";
import { NavBrand, NavList } from "./nav-list";

export function Sidebar({ role }: { role: Enums<"user_role"> | null }) {
  return (
    <aside className="hidden h-full w-60 flex-col gap-1 border-r border-border bg-card p-3 md:flex">
      <NavBrand />
      <div className="flex-1 overflow-y-auto">
        <NavList role={role} />
      </div>
    </aside>
  );
}
