import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <Card>
      <CardHeader className="space-y-1 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Light Company
        </p>
        <CardTitle className="text-3xl font-bold text-brand">LightFabric</CardTitle>
        <CardDescription>Вход в систему</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
      <CardFooter className="justify-center border-t pt-4">
        <Link
          href="/demo"
          className="text-sm font-medium text-brand hover:text-brand-dark"
        >
          Демо-доступ без пароля →
        </Link>
      </CardFooter>
    </Card>
  );
}
