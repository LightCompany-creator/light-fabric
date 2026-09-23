import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/shifts",
  "/catalog",
  "/reports",
  "/sync",
];

/**
 * Цеховое приложение работает напрямую с 1С и о Supabase не знает.
 * Пропускаем его мимо проверки сессии: вход там по учётной записи 1С,
 * а на сервере фабрики никакого Supabase не будет.
 */
const API_1C_PREFIXES = ["/enter", "/w"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (API_1C_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next();
  }

  const { response, user } = await updateSession(request);

  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("returnTo", pathname);
    return NextResponse.redirect(url);
  }

  if (pathname === "/login" && user) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: [
    // Все маршруты, кроме статики и картинок
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
