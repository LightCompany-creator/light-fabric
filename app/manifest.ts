import type { MetadataRoute } from "next";
import { withBase } from "@/lib/base-path";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LightFabric — MES Light Company",
    short_name: "LightFabric",
    description: "Оперативный цеховой учёт: смены, выработка, передачи между цехами.",
    // Планшет в цеху открывается сразу на рабочем месте. Если вход не выполнен,
    // приложение само отправит на страницу входа.
    start_url: withBase("/w"),
    scope: withBase("/"),
    display: "standalone",
    background_color: "#F4F7FC",
    theme_color: "#214A8C",
    lang: "ru",
    dir: "ltr",
    orientation: "any",
    categories: ["business", "productivity"],
    icons: [
      {
        src: withBase("/icon-192.png"),
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBase("/icon-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: withBase("/icon-maskable-512.png"),
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: withBase("/icon.svg"),
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Рабочее место цеха",
        short_name: "Цех",
        url: withBase("/w"),
        description: "Смены, остатки и передачи своего цеха",
      },
      {
        name: "История смен",
        short_name: "История",
        url: withBase("/w/shifts"),
      },
      {
        name: "Перемещения",
        short_name: "Передачи",
        url: withBase("/w/transfers"),
      },
    ],
  };
}
