import { redirect } from "next/navigation";
import { Sidebar } from "@/components/shared/sidebar";
import { Topbar } from "@/components/shared/topbar";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  countNewSubordersForWorkshop,
  countOrdersAwaitingAcceptance,
  countSuborderConfirmationsPending,
} from "@/lib/services/orders";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const ordersBadge = await getOrdersBadge(user);

  return (
    <div className="flex h-screen overflow-hidden bg-brand-mist">
      <Sidebar role={user.role} ordersBadge={ordersBadge} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Topbar user={user} ordersBadge={ordersBadge} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

async function getOrdersBadge(
  user: Awaited<ReturnType<typeof getCurrentUser>>,
): Promise<{ href: string; count: number } | null> {
  if (!user) return null;
  const supabase = createClient();

  if (user.role === "foreman" && user.employee?.workshop_id) {
    const count = await countNewSubordersForWorkshop(supabase, user.employee.workshop_id);
    return count > 0 ? { href: "/orders/suborders", count } : null;
  }

  if (user.role === "production_manager" || user.role === "admin") {
    const [awaiting, pendingConfirm] = await Promise.all([
      countOrdersAwaitingAcceptance(supabase),
      countSuborderConfirmationsPending(supabase),
    ]);
    const count = awaiting + pendingConfirm;
    return count > 0 ? { href: "/orders", count } : null;
  }

  return null;
}
