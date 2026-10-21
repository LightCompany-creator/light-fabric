// HTTPS для проверки приложения на планшете в домашней сети.
//
// Chrome на Android ставит сайт как приложение (без значка браузера, с офлайном)
// только с защищённого адреса. Этот скрипт принимает HTTPS на порту 3443
// и передаёт запросы работающему `npm run start` на :3000. Сертификат выпущен
// своим локальным ЦС (.local/certs, в репозиторий не попадает); планшету нужно
// один раз установить ca.crt, скачать его можно с http://<адрес>:3080/.
//
// Запуск: node scripts/https-proxy.mjs
// Опции: --port 3443  --http-port 3080  --target http://127.0.0.1:3000  --certs .local/certs
// Выпуск сертификатов: см. SETUP.md, раздел «Проверка на планшете по HTTPS».

import http from "node:http";
import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const opt = (name, def) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : def;
};
const PORT = Number(opt("--port", "3443"));
const HTTP_PORT = Number(opt("--http-port", "3080"));
const TARGET = new URL(opt("--target", "http://127.0.0.1:3000"));
const DIR = opt("--certs", ".local/certs");

const key = fs.readFileSync(path.join(DIR, "server.key"));
const cert = fs.readFileSync(path.join(DIR, "server.crt"));
const caPath = path.join(DIR, "ca.crt");
const caDerPath = path.join(DIR, "ca.cer");

/** Адреса компьютера в локальной сети, чтобы напечатать готовые ссылки. */
const lanAddresses = Object.values(os.networkInterfaces())
  .flat()
  .filter((a) => a && a.family === "IPv4" && !a.internal && !a.address.startsWith("172."))
  .map((a) => a.address);

function forward(req, res) {
  const headers = {
    ...req.headers,
    host: TARGET.host,
    "x-forwarded-proto": "https",
    "x-forwarded-host": req.headers.host ?? "",
  };
  const upstream = http.request(
    { hostname: TARGET.hostname, port: TARGET.port, path: req.url, method: req.method, headers },
    (r) => {
      res.writeHead(r.statusCode ?? 502, r.headers);
      r.pipe(res);
    },
  );
  upstream.on("error", (e) => {
    res.writeHead(502, { "content-type": "text/plain; charset=utf-8" });
    res.end(`Сервер приложения на ${TARGET.host} не отвечает: ${e.message}`);
  });
  req.pipe(upstream);
}

https.createServer({ key, cert }, forward).listen(PORT, "0.0.0.0", () => {
  for (const a of lanAddresses) console.log(`приложение: https://${a}:${PORT}/w`);
});

// Сертификат ЦС раздаём по обычному http: планшет скачивает его отсюда один раз.
http
  .createServer((req, res) => {
    // Один и тот же сертификат ЦС в двух форматах: PEM (.crt) и DER (.cer),
    // разные оболочки Android принимают разные.
    const file = req.url === "/lightfabric-ca.crt" ? caPath : req.url === "/lightfabric-ca.cer" ? caDerPath : null;
    if (file && fs.existsSync(file)) {
      res.writeHead(200, {
        "content-type": "application/x-x509-ca-cert",
        "content-disposition": `attachment; filename="${path.basename(req.url)}"`,
      });
      fs.createReadStream(file).pipe(res);
      return;
    }
    res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
    res.end(
      `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width">` +
        `<body style="font:20px system-ui;padding:24px;line-height:1.6">` +
        `<p><a href="/lightfabric-ca.crt">Скачать сертификат LightFabric (.crt)</a></p>` +
        `<p><a href="/lightfabric-ca.cer">Тот же сертификат в формате .cer</a></p>` +
        `<p>Установка: Настройки → поиск «сертификат» → «Установка сертификата» → «Сертификат ЦС» → выбрать скачанный файл.</p>` +
        `<p>После установки открыть: ` +
        lanAddresses.map((a) => `<a href="https://${a}:${PORT}/w">https://${a}:${PORT}/w</a>`).join(", ") +
        `</p></body>`,
    );
  })
  .listen(HTTP_PORT, "0.0.0.0", () => {
    for (const a of lanAddresses) console.log(`сертификат: http://${a}:${HTTP_PORT}/`);
  });
