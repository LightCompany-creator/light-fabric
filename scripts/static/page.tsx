"use client";

// Главная страница статической сборки: в цеховом приложении на 1С нет
// витрины, поэтому с корня каталога сразу уходим на рабочее место.
// Если вход не выполнен, рабочее место само отправит на страницу входа.

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/w");
  }, [router]);
  return null;
}
