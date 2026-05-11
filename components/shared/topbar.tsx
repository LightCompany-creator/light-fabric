import { LogOut, UserCircle2 } from "lucide-react";
import { logoutAction } from "@/app/(auth)/logout/actions";
import { Button } from "@/components/ui/button";
import { USER_ROLE_LABELS } from "@/lib/constants";
import type { CurrentUser } from "@/lib/auth";
import { MobileNav } from "./mobile-nav";

export function Topbar({ user }: { user: CurrentUser }) {
  const name = user.employee?.full_name ?? user.email ?? "Пользователь";
  const roleLabel = user.role ? USER_ROLE_LABELS[user.role] : "Без роли";
  const workshop = user.employee?.workshop?.name;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-3 sm:px-6">
      <div className="flex items-center gap-2 text-sm sm:gap-3">
        <MobileNav role={user.role} />
        <UserCircle2 className="hidden h-5 w-5 text-muted-foreground sm:block" />
        <div className="flex flex-col leading-tight">
          <span className="font-medium">{name}</span>
          <span className="text-xs text-muted-foreground">
            {roleLabel}
            {workshop ? ` · ${workshop}` : ""}
          </span>
        </div>
      </div>

      <form action={logoutAction}>
        <Button type="submit" variant="ghost" size="sm">
          <LogOut className="h-4 w-4 sm:mr-2" />
          <span className="hidden sm:inline">Выйти</span>
        </Button>
      </form>
    </header>
  );
}
