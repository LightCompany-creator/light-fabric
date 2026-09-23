"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { describeError, useApi1C } from "@/lib/api1c/provider";

export function EnterForm() {
  const router = useRouter();
  const { status, signIn, isMock } = useApi1C();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // Уже вошли (например, вернулись на вкладку): сразу на рабочее место.
  useEffect(() => {
    if (status === "ready") router.replace("/w");
  }, [status, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      await signIn(login.trim(), password);
      router.replace("/w");
    } catch (e) {
      setError(describeError(e));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          Light Company
        </p>
        <CardTitle className="text-3xl font-bold text-brand">LightFabric</CardTitle>
        <CardDescription>Вход по учётной записи 1С</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="login">Пользователь 1С</Label>
            <Input
              id="login"
              name="login"
              autoComplete="username"
              autoCapitalize="off"
              required
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="цех_литейка"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Пароль</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={pending || status === "loading"}>
            {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Войти
          </Button>

          {isMock ? (
            <p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">
              Сервис 1С ещё не подключён: работает заглушка по контракту этапа 1.
              Подойдёт любой логин и пароль.
            </p>
          ) : null}
        </form>
      </CardContent>
    </Card>
  );
}
