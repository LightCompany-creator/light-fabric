// Снимки экранов цехового приложения для Claude Design: PNG на 768×1024 во всю
// высоту страницы и самодостаточные HTML-слепки (стили внутри, скриптов нет).
//
// Запуск: npm run design:screens   (нужен работающий сервер на :3000)
// Опции:  --base http://localhost:3000   --out design/screens   --width 768
//
// Управляет headless Chrome по протоколу отладки напрямую, без Playwright:
// проходит вход на заглушке, открывает смену, заполняет её, создаёт передачу
// и снимает каждый экран в том виде, в каком его видит начальник цеха.
// Работает только с заглушкой 1С (имена работников и продукции из lib/api1c/mock.ts).

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, existsSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const opt = (name, def) => {
  const i = process.argv.indexOf(name);
  return i > 0 ? process.argv[i + 1] : def;
};
const BASE = opt("--base", "http://localhost:3000").replace(/\/$/, "");
const OUT = opt("--out", "design/screens");
const WIDTH = Number(opt("--width", "768"));
const HEIGHT = 1024;
const PORT = 9333;
const PWA_DISMISS_KEY = "lf-install-dismissed-until"; // как в components/shared/pwa-register.tsx
const CHROME =
  process.env.CHROME_PATH ||
  ["C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe"].find(existsSync);

if (!CHROME) {
  console.error("Chrome не найден: задайте CHROME_PATH");
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- протокол отладки Chrome ----------

class Cdp {
  constructor(ws) {
    this.ws = ws;
    this.id = 0;
    this.pending = new Map();
    ws.addEventListener("message", (e) => {
      const msg = JSON.parse(e.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result);
      }
    });
  }
  send(method, params = {}) {
    const id = ++this.id;
    this.ws.send(JSON.stringify({ id, method, params }));
    return new Promise((resolve, reject) => this.pending.set(id, { resolve, reject }));
  }
  async eval(expression) {
    const r = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + " " + (r.exceptionDetails.exception?.description ?? ""));
    return r.result.value;
  }
}

async function connect() {
  for (let i = 0; i < 50; i++) {
    try {
      const list = await fetch(`http://127.0.0.1:${PORT}/json/list`).then((r) => r.json());
      const page = list.find((t) => t.type === "page");
      if (page) {
        const ws = new WebSocket(page.webSocketDebuggerUrl);
        await new Promise((res, rej) => { ws.addEventListener("open", res); ws.addEventListener("error", rej); });
        return new Cdp(ws);
      }
    } catch { /* Chrome ещё поднимается */ }
    await sleep(200);
  }
  throw new Error("Chrome не ответил на порту отладки");
}

// ---------- действия на странице (как пальцем на планшете) ----------

const helpers = `
  window.__lf = {
    sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
    btn: (t) => Array.from(document.querySelectorAll('button')).find((x) => x.textContent.trim() === t),
    click(t) { const b = this.btn(t); if (!b) throw new Error('нет кнопки ' + t); b.click(); },
    worker: (name) => Array.from(document.querySelectorAll('button[aria-pressed]')).find((x) => x.textContent.includes(name)),
    clickWorker(name) { const b = this.worker(name); if (!b) throw new Error('нет строки ' + name); b.click(); },
    setInput(el, v) { const s = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('input', { bubbles: true })); },
    setSelect(el, v) { const s = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set; s.call(el, v); el.dispatchEvent(new Event('change', { bubbles: true })); },
    labelOf: (i) => i.closest('div')?.querySelector('label')?.textContent ?? '',
    inputBy(label) { return Array.from(document.querySelectorAll('input')).find((i) => this.labelOf(i).startsWith(label)); },
    selectWith(text) { return Array.from(document.querySelectorAll('select')).find((s) => Array.from(s.options).some((o) => o.text.includes(text))); },
    optionValue(sel, text) { return Array.from(sel.options).find((o) => o.text.includes(text))?.value; },
  };
  true;
`;

async function waitFor(cdp, predicate, ms = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) {
    try {
      if (await cdp.eval(`(() => { ${predicate} })()`)) return;
    } catch { /* страница перезагружается */ }
    await sleep(150);
  }
  throw new Error("не дождались: " + predicate.slice(0, 80));
}
const waitButton = (cdp, text) => waitFor(cdp, `return !!Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === ${JSON.stringify(text)})`);

async function go(cdp, path) {
  await cdp.send("Page.navigate", { url: BASE + path });
  await waitFor(cdp, "return document.readyState === 'complete'");
  await cdp.eval(helpers);
}

// ---------- снимок ----------

async function inlineStyles(html) {
  const links = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)];
  for (const [tag, href] of links) {
    const css = await fetch(href.startsWith("http") ? href : BASE + href).then((r) => r.text());
    html = html.replace(tag, `<style>${css}</style>`);
  }
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/g, "")
    .replace(/<link[^>]+rel="(preload|modulepreload|prefetch)"[^>]*>/g, "")
    .replace(/<noscript>[\s\S]*?<\/noscript>/g, "");
}

async function snap(cdp, name) {
  await cdp.eval(helpers);
  await sleep(400);
  const height = await cdp.eval("Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)");
  const shot = await cdp.send("Page.captureScreenshot", {
    format: "png",
    captureBeyondViewport: true,
    clip: { x: 0, y: 0, width: WIDTH, height, scale: 1 },
  });
  writeFileSync(join(OUT, `${name}.png`), Buffer.from(shot.data, "base64"));
  const html = await cdp.eval("'<!doctype html>' + document.documentElement.outerHTML");
  writeFileSync(join(OUT, `${name}.html`), await inlineStyles(html), "utf8");
  console.log(`  ✓ ${name}  ${WIDTH}×${height}`);
}

// ---------- сценарий ----------

async function main() {
  mkdirSync(OUT, { recursive: true });
  const profile = join(tmpdir(), "lf-design-screens");
  rmSync(profile, { recursive: true, force: true });
  const chrome = spawn(CHROME, [
    "--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`,
    `--window-size=${WIDTH},${HEIGHT}`, "--hide-scrollbars", "--no-first-run", "--no-default-browser-check", "about:blank",
  ], { stdio: "ignore" });

  try {
    const cdp = await connect();
    await cdp.send("Page.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2, mobile: true });
    console.log(`Снимки экранов: ${BASE}, ${WIDTH}×${HEIGHT}, в ${OUT}`);

    // чистый планшет: ни сеанса, ни данных заглушки
    await go(cdp, "/enter");
    await cdp.eval("Object.keys(localStorage).filter(k => k.startsWith('lf.1c.')).forEach(k => localStorage.removeItem(k)); true");
    // плашку «Установить LightFabric» на снимках не показываем
    await cdp.eval(`localStorage.setItem(${JSON.stringify(PWA_DISMISS_KEY)}, String(Date.now() + 864e5)); true`);
    await go(cdp, "/enter");
    await waitFor(cdp, "return document.querySelectorAll('input').length >= 2");
    await snap(cdp, "enter");

    // вход
    await cdp.eval(`(() => { const i = document.querySelectorAll('input'); __lf.setInput(i[0], 'цех_литейка'); __lf.setInput(i[1], 'x'); return true; })()`);
    await cdp.eval("document.querySelector('button[type=submit]').click(); true");
    await waitButton(cdp, "Открыть 1 смену");

    // смена с данными: состав, три строки выработки, итог выпуска
    await cdp.eval("__lf.click('Открыть 1 смену'); true");
    await waitFor(cdp, "return !!window.__lf && !!__lf.worker('Работник Л-01')");
    for (const who of ["Работник Л-01", "Работник Л-02", "Работник Л-03"]) {
      await cdp.eval(`__lf.clickWorker(${JSON.stringify(who)}); true`);
      await sleep(250);
    }
    await waitFor(cdp, "return document.querySelectorAll('[role=group] button').length >= 3");
    await cdp.eval(`(async () => {
      const $ = (id) => document.getElementById(id);
      // Форма строки собирается кнопками-таблетками (Д-2), ищем их по тексту.
      const pill = (t) => {
        const b = Array.from(document.querySelectorAll('[role=group] button')).find((x) => x.textContent.includes(t));
        if (!b) throw new Error('нет кнопки ' + t);
        b.click();
      };
      const row = async (who, work, product, qty, defect, machine) => {
        pill(who);
        await __lf.sleep(200);
        pill(work);
        await __lf.sleep(250);
        if (product) pill(product);
        await __lf.sleep(250);
        __lf.setInput($('qty'), qty);
        if (defect) __lf.setInput($('defect'), defect);
        if (machine) __lf.setInput($('machine'), machine);
        await __lf.sleep(150);
        __lf.click('Добавить строку');
        await __lf.sleep(500);
      };
      await row('Л-01', '6-парка', '112', '96', '2', 'KCLKA 1');
      await row('Л-02', '4-парка', '137', '60', '', 'KCLKA 2');
      await row('Л-03', 'Простой', null, '0.5', '', '');
      if (__lf.btn('Принять как есть')) __lf.click('Принять как есть');
      await __lf.sleep(600);
      return true;
    })()`);
    await sleep(4500); // автосохранение, чтобы индикатор показал «сохранено в 1С»
    await snap(cdp, "shift");

    // рабочее место с открытой сменой
    await go(cdp, "/w");
    await waitButton(cdp, "Передать в другой цех");
    await snap(cdp, "workplace");

    // история
    await cdp.eval("__lf.click('История смен'); true");
    await waitFor(cdp, "return document.querySelectorAll('a[href^=\"/w/shift?id=\"]').length > 0");
    await snap(cdp, "history");

    // новая передача: заполненная форма
    await go(cdp, "/w/transfers/new");
    await waitButton(cdp, "Передать");
    await waitFor(cdp, "return document.querySelector('select')?.options.length > 1");
    await cdp.eval(`(async () => {
      const sel = document.querySelector('select');
      __lf.setSelect(sel, __lf.optionValue(sel, 'Обшив') ?? sel.options[1].value);
      await __lf.sleep(300);
      const inputs = Array.from(document.querySelectorAll('input[placeholder="0"]'));
      const input = inputs.find((i) => (i.closest('.grid')?.innerText || '').includes('Галоша')) ?? inputs[0];
      if (!input) return false;
      const m = (input.closest('.grid')?.innerText || '').match(/доступно +([0-9.,]+)/);
      const avail = m ? Number(m[1].replace(',', '.')) : 0;
      __lf.setInput(input, String(Math.min(50, Math.floor(avail)) || 1));
      await __lf.sleep(300);
      return true;
    })()`);
    await snap(cdp, "transfer-new");

    // карточка передачи
    await cdp.eval("__lf.click('Передать'); true");
    await waitButton(cdp, "Удалить передачу");
    await snap(cdp, "transfer");

    // список передач: исходящие, чтобы было содержимое
    await go(cdp, "/w/transfers");
    await waitButton(cdp, "Исходящие");
    await cdp.eval("__lf.click('Исходящие'); true");
    await waitFor(cdp, "return document.querySelectorAll('a[href^=\"/w/transfer?id=\"]').length > 0");
    await snap(cdp, "transfers");

    console.log("Готово.");
  } finally {
    chrome.kill();
  }
}

main().catch((e) => {
  console.error("Ошибка:", e.message);
  process.exit(1);
});
