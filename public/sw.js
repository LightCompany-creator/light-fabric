// LightFabric Service Worker
// Стратегия:
//  - Статика (иконки, манифест): Cache First
//  - Навигация (GET страниц): Network First → fallback на кэш → fallback на /offline
//  - API/Supabase/1С: Network only (мутации не очередуются, требуют сети)
//
// Приложение может лежать в подкаталоге (например, /lightfabric рядом
// с публикацией 1С). Подкаталог берём из области регистрации, поэтому один
// и тот же файл работает и в корне, и в подкаталоге.
//
// При обновлении кода — меняйте VERSION, чтобы старый кэш вычистился.

const VERSION = "v2";
const CACHE_STATIC = `lf-static-${VERSION}`;
const CACHE_PAGES = `lf-pages-${VERSION}`;

const BASE = new URL(self.registration.scope).pathname.replace(/\/$/, "");
const OFFLINE_PAGE = `${BASE}/offline/`;

const STATIC_ASSETS = [
  `${BASE}/manifest.webmanifest`,
  `${BASE}/icon.svg`,
  `${BASE}/icon-192.png`,
  `${BASE}/icon-512.png`,
  OFFLINE_PAGE,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) =>
      // Один недоступный файл не должен ломать установку всего воркера.
      Promise.all(STATIC_ASSETS.map((url) => cache.add(url).catch(() => undefined))),
    ),
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

  // Файлы вне нашего каталога (например, публикация 1С рядом) не трогаем.
  if (BASE && !url.pathname.startsWith(`${BASE}/`)) return;

  // Не кэшируем Next.js _next/data (фрагменты страниц) — пусть идут как есть
  if (url.pathname.startsWith(`${BASE}/_next/data/`)) return;

  // Не кэшируем API-роуты приложения и сервис 1С
  if (url.pathname.startsWith(`${BASE}/api/`) || url.pathname.includes("/hs/")) return;

  // Статика — Cache First
  const isStatic =
    url.pathname.startsWith(`${BASE}/_next/static/`) ||
    url.pathname.startsWith(`${BASE}/icon`) ||
    url.pathname === `${BASE}/manifest.webmanifest` ||
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
          caches.match(request).then((cached) => cached ?? caches.match(OFFLINE_PAGE)),
        ),
    );
    return;
  }
});

// Принять команду от страницы «обновись сейчас»
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
