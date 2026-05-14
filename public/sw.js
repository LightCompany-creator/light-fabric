// LightFabric Service Worker
// Стратегия:
//  - Статика (иконки, манифест): Cache First
//  - Навигация (GET страниц): Network First → fallback на кэш → fallback на /offline
//  - API/Supabase: Network only (мутации не очередуются, требуют интернет)
//
// При обновлении кода — меняйте VERSION, чтобы старый кэш вычистился.

const VERSION = "v1";
const CACHE_STATIC = `lf-static-${VERSION}`;
const CACHE_PAGES = `lf-pages-${VERSION}`;

const STATIC_ASSETS = [
  "/manifest.webmanifest",
  "/icon.svg",
  "/icon-192.png",
  "/icon-512.png",
  "/offline",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_STATIC && k !== CACHE_PAGES)
          .map((k) => caches.delete(k)),
      ),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Игнорируем чужие домены (Supabase, шрифты Google и т.п.) —
  // браузер сам разрулит.
  if (url.origin !== self.location.origin) return;

  // Не кэшируем Next.js _next/data (фрагменты страниц) — пусть идут как есть
  if (url.pathname.startsWith("/_next/data/")) return;

  // Не кэшируем API-роуты приложения
  if (url.pathname.startsWith("/api/")) return;

  // Статика — Cache First
  const isStatic =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icon") ||
    url.pathname === "/manifest.webmanifest" ||
    /\.(svg|png|jpg|jpeg|gif|webp|woff2|woff|ttf|css|js)$/.test(url.pathname);

  if (isStatic) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_STATIC).then((c) => c.put(request, clone));
          }
          return res;
        });
      }),
    );
    return;
  }

  // Навигация — Network First → cache → /offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_PAGES).then((c) => c.put(request, clone));
          }
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached ?? caches.match("/offline")),
        ),
    );
    return;
  }
});

// Принять команду от страницы «обновись сейчас»
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
