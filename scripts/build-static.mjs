// Статическая сборка цехового приложения под каталог веб-сервера 1С.
//
//   npm run build:static                       → каталог /lightfabric, заглушка 1С
//   npm run build:static -- --base /lf         → другой каталог
//   npm run build:static -- --api /base/hs/lightfabric   → боевой адрес сервиса
//
// Результат: dist/<каталог>/ с html, js, css и web.config для IIS, рядом zip.
// Node на сервере не нужен: папку кладут рядом с публикацией 1С.
//
// Как это работает. Старые разделы на Supabase (серверные действия, cookies,
// middleware) со статикой несовместимы, поэтому на время сборки они
// отодвигаются в .static-aside/, а в конце возвращаются на место, даже если
// сборка упала. В репозитории ничего не меняется.

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const basePath = opt("--base", "/lightfabric").replace(/\/$/, "");
const apiUrl = opt("--api", "");
const folder = basePath.replace(/^\//, "") || "lightfabric";

const aside = path.join(root, ".static-aside");
const stubs = path.join(root, "scripts", "static");

// Что убираем из сборки: [путь в проекте, чем подменить (или null)]
const swaps = [
  ["app/(app)", null],
  ["app/(auth)", null],
  ["app/api", null],
  ["app/demo", null],
  ["middleware.ts", null],
  ["app/page.tsx", "page.tsx"],
  ["lib/offline-replay-actions.ts", "offline-replay-actions.ts"],
];

const moved = [];
function putAside() {
  fs.rmSync(aside, { recursive: true, force: true });
  for (const [rel, stub] of swaps) {
    const src = path.join(root, rel);
    if (!fs.existsSync(src)) continue;
    const dst = path.join(aside, rel);
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.renameSync(src, dst);
    moved.push([src, dst]);
    if (stub) fs.copyFileSync(path.join(stubs, stub), src);
  }
}
function restore() {
  for (const [src, dst] of moved.reverse()) {
    if (fs.existsSync(src)) fs.rmSync(src, { recursive: true, force: true });
    fs.renameSync(dst, src);
  }
  moved.length = 0;
  fs.rmSync(aside, { recursive: true, force: true });
}

const out = path.join(root, "out");
const dist = path.join(root, "dist", folder);

console.log(`Статическая сборка: каталог ${basePath}, сервис 1С: ${apiUrl || "заглушка"}`);
putAside();
let ok = false;
try {
  fs.rmSync(path.join(root, ".next"), { recursive: true, force: true });
  fs.rmSync(out, { recursive: true, force: true });
  const env = {
    ...process.env,
    LF_STATIC: "1",
    NEXT_PUBLIC_LF_STATIC: "1",
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_API_1C_URL: apiUrl,
    NEXT_TELEMETRY_DISABLED: "1",
  };
  const r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "build"], {
    cwd: root,
    env,
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  ok = r.status === 0;
} finally {
  restore();
}
if (!ok) {
  console.error("Сборка не удалась, файлы проекта возвращены на место.");
  process.exit(1);
}

// Папка для сервера: out/ → dist/<каталог>/ + web.config
fs.rmSync(path.join(root, "dist", folder), { recursive: true, force: true });
fs.mkdirSync(path.join(root, "dist"), { recursive: true });
fs.cpSync(out, dist, { recursive: true });
fs.copyFileSync(path.join(stubs, "web.config"), path.join(dist, "web.config"));

// Презентации и макеты из public/ фабрике не нужны
for (const extra of ["decks", "designs"]) {
  fs.rmSync(path.join(dist, extra), { recursive: true, force: true });
}

// Next 14.2 пишет ссылку на манифест без basePath (в остальных ссылках
// подкаталог подставлен). Правим прямо в готовых страницах.
if (basePath) {
  const htmlFiles = fs
    .readdirSync(dist, { recursive: true })
    .filter((f) => f.endsWith(".html"))
    .map((f) => path.join(dist, f));
  let fixed = 0;
  for (const file of htmlFiles) {
    const html = fs.readFileSync(file, "utf8");
    const patched = html.replace(/href="\/manifest\.webmanifest"/g, `href="${basePath}/manifest.webmanifest"`);
    if (patched !== html) {
      fs.writeFileSync(file, patched);
      fixed += 1;
    }
  }
  console.log(`Ссылка на манифест поправлена в ${fixed} страницах`);
}
fs.copyFileSync(path.join(stubs, "УСТАНОВКА.md"), path.join(root, "dist", "УСТАНОВКА.md"));

// Архив рядом, чтобы отправить одним файлом
const stamp = new Date().toISOString().slice(0, 10);
const zip = path.join(root, "dist", `${folder}-static-${stamp}.zip`);
fs.rmSync(zip, { force: true });
const z = spawnSync(
  "powershell",
  ["-NoProfile", "-Command", `Compress-Archive -LiteralPath '${dist}','${path.join(root, "dist", "УСТАНОВКА.md")}' -DestinationPath '${zip}' -Force`],
  { stdio: "inherit" },
);
const pages = fs.readdirSync(dist, { recursive: true }).filter((f) => f.endsWith("index.html")).length;
console.log(`\nГотово: ${dist}\nСтраниц: ${pages}${z.status === 0 ? `\nАрхив: ${zip}` : "\nАрхив не создан (нет PowerShell)"}`);
