// Генерит PNG-иконки из app/icon.svg для PWA (iOS + Android).
// Запуск: node scripts/generate-icons.mjs

import sharp from "sharp";
import fs from "node:fs";

const svg = fs.readFileSync("app/icon.svg");

const targets = [
  // Standard PWA icons
  { path: "app/icon.png", size: 512 },
  { path: "public/icon-192.png", size: 192 },
  { path: "public/icon-512.png", size: 512 },
  // iOS Apple Touch Icon (180×180 рекомендованный)
  { path: "app/apple-icon.png", size: 180 },
  // Maskable icon (safe area inside, для Android Adaptive)
  { path: "public/icon-maskable-512.png", size: 512 },
];

console.log("Генерация иконок из app/icon.svg:");
for (const t of targets) {
  await sharp(svg)
    .resize(t.size, t.size)
    .png()
    .toFile(t.path);
  const stat = fs.statSync(t.path);
  console.log(`  ✓ ${t.path}  ${t.size}×${t.size}  ${Math.round(stat.size / 1024)}KB`);
}

console.log("Готово.");
