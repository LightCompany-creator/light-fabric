// Генерит splash screens для iOS PWA (Add to Home Screen).
// Каждое устройство требует своего размера + media query.
// Здесь — минимальный набор для основных iPad и iPhone.
// Запуск: node scripts/generate-splash.mjs

import sharp from "sharp";
import fs from "node:fs";

const BRAND = "#214A8C"; // основной цвет
const ICON_SVG = fs.readFileSync("app/icon.svg");

const OUT_DIR = "public/splash";
if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true });

// Размеры устройств в формате [width, height, name].
// Учитывая что iPhone и iPad имеют 2 ориентации — генерим обе.
const DEVICES = [
  // iPad Pro 12.9" — крупный
  { w: 2048, h: 2732, name: "ipad-pro-129-portrait" },
  { w: 2732, h: 2048, name: "ipad-pro-129-landscape" },
  // iPad Pro 11" / Air
  { w: 1668, h: 2388, name: "ipad-pro-11-portrait" },
  { w: 2388, h: 1668, name: "ipad-pro-11-landscape" },
  // iPad 10.2" / 10.9"
  { w: 1620, h: 2160, name: "ipad-102-portrait" },
  { w: 2160, h: 1620, name: "ipad-102-landscape" },
  // iPad mini
  { w: 1488, h: 2266, name: "ipad-mini-portrait" },
  { w: 2266, h: 1488, name: "ipad-mini-landscape" },
  // iPhone Pro Max (15/14 Pro Max)
  { w: 1290, h: 2796, name: "iphone-pro-max-portrait" },
  // iPhone 14/15
  { w: 1170, h: 2532, name: "iphone-portrait" },
  // iPhone SE / small
  { w: 750, h: 1334, name: "iphone-se-portrait" },
];

console.log(`Генерация splash-screens (${DEVICES.length} шт) в ${OUT_DIR}/:`);
for (const d of DEVICES) {
  // Размер иконки — 25% от меньшей стороны
  const iconSize = Math.round(Math.min(d.w, d.h) * 0.25);

  // Рендерим SVG-иконку в нужный размер
  const iconBuf = await sharp(ICON_SVG)
    .resize(iconSize, iconSize)
    .png()
    .toBuffer();

  // Создаём фон бренд-цвета, накладываем иконку по центру
  await sharp({
    create: {
      width: d.w,
      height: d.h,
      channels: 4,
      background: BRAND,
    },
  })
    .composite([{ input: iconBuf, gravity: "center" }])
    .png()
    .toFile(`${OUT_DIR}/${d.name}.png`);

  console.log(`  ✓ ${d.name}.png  ${d.w}×${d.h}`);
}

// Генерация HTML-сниппета с тегами link
console.log("\nMedia queries для layout.tsx — добавь в metadata.appleWebApp.startupImage:");
const queries = DEVICES.map((d) => {
  const orient = d.w > d.h ? "landscape" : "portrait";
  // Используем point-размеры (CSS pixels) — делим на ratio 2 или 3
  // Для упрощения берём media по device-width в pt (физический/2)
  return `  {
    url: "/splash/${d.name}.png",
    media: "(device-width: ${Math.round(d.w / 2)}px) and (device-height: ${Math.round(d.h / 2)}px) and (orientation: ${orient})",
  }`;
}).join(",\n");
console.log(`\nstartupImage: [\n${queries}\n],`);

console.log("\nГотово.");
