import { LogOut, UserCircle2 } from "lucide-react";
import { logoutAction } from "@/app/(auth)/logout/actions";
import { Button } from "@/components/ui/button";
import { USER_ROLE_LABELS } from "@/lib/constants";
import type { CurrentUser } from "@/lib/auth";

export function Topbar({ user }: { user: CurrentUser }) {
  const name = user.employee?.full_name ?? user.email ?? "Пользователь";
  const roleLabel = user.role ? USER_ROLE_LABELS[user.role] : "Без роли";
  const workshop = user.employee?.workshop?.name;

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-card px-6">
      <div className="flex items-center gap-3 text-sm">
        <UserCircle2 className="h-5 w-5 text-muted-foreground" />
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
          <LogOut className="mr-2 h-4 w-4" />
          Выйти
        </Button>
      </form>
    </header>
  );
}
