import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
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
        <CardTitle className="text-3xl font-bold text-brand">LightFlow</CardTitle>
        <CardDescription>Вход в систему</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  );
}
