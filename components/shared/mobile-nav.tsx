"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { Enums } from "@/lib/supabase/types";
import { NavList, type NavBadge } from "./nav-list";

export function MobileNav({
  role,
  badge,
}: {
  role: Enums<"user_role"> | null;
  badge: NavBadge;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Меню">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-3">
        <SheetHeader className="text-left">
          <SheetTitle className="text-brand">LightFabric</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <NavList role={role} badge={badge} onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
