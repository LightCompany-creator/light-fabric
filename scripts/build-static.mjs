// Статическая сборка цехового приложения под каталог веб-сервера 1С.
//
//   npm run build:static                       → каталог /lightfabric, заглушка 1С
//   npm run build:static -- --base /lf         → другой каталог
//   npm run build:static -- --api /base/hs/lightfabric   → боевой адрес сервиса
//   npm run build:static -- --version 2026.10.23-1       → номер версии (иначе dev-дата)
//
// Результат: dist/<каталог>/ с html, js, css и web.config для IIS, рядом zip.
// Node на сервере не нужен: папку кладут рядом с публикацией 1С.

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
// Версия сборки: показывается на экране входа и лежит в version.json, по ней
// скрипт обновления на сервере понимает, нужно ли что-то скачивать.
const version = opt("--version", process.env.NEXT_PUBLIC_APP_VERSION || `dev-${new Date().toISOString().slice(0, 10)}`);

const stubs = path.join(root, "scripts", "static");

const out = path.join(root, "out");
const dist = path.join(root, "dist", folder);

console.log(`Статическая сборка: каталог ${basePath}, сервис 1С: ${apiUrl || "заглушка"}`);
fs.rmSync(path.join(root, ".next"), { recursive: true, force: true });
fs.rmSync(out, { recursive: true, force: true });
const env = {
  ...process.env,
  LF_STATIC: "1",
  NEXT_PUBLIC_BASE_PATH: basePath,
  NEXT_PUBLIC_API_1C_URL: apiUrl,
  NEXT_PUBLIC_APP_VERSION: version,
  NEXT_TELEMETRY_DISABLED: "1",
};
const r = spawnSync(process.platform === "win32" ? "npx.cmd" : "npx", ["next", "build"], {
  cwd: root,
  env,
  stdio: "inherit",
  shell: process.platform === "win32",
});
if (r.status !== 0) {
  console.error("Сборка не удалась.");
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
fs.writeFileSync(
  path.join(dist, "version.json"),
  JSON.stringify({ version, built_at: new Date().toISOString(), base_path: basePath, api: apiUrl || null }, null, 2),
);

// Архив рядом, чтобы отправить одним файлом. На Windows через PowerShell,
// на Linux (сборка в GitHub) через zip.
const zip = path.join(root, "dist", `${folder}-${version}.zip`);
fs.rmSync(zip, { force: true });
const z =
  process.platform === "win32"
    ? spawnSync(
        "powershell",
        ["-NoProfile", "-Command", `Compress-Archive -LiteralPath '${dist}','${path.join(root, "dist", "УСТАНОВКА.md")}' -DestinationPath '${zip}' -Force`],
        { stdio: "inherit" },
      )
    : spawnSync("zip", ["-qr", zip, folder, "УСТАНОВКА.md"], { cwd: path.join(root, "dist"), stdio: "inherit" });
const pages = fs.readdirSync(dist, { recursive: true }).filter((f) => f.endsWith("index.html")).length;
console.log(`\nГотово: ${dist}\nСтраниц: ${pages}${z.status === 0 ? `\nАрхив: ${zip}` : "\nАрхив не создан (нет PowerShell)"}`);
