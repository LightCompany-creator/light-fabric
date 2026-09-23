import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LightFabric — MES Light Company",
    short_name: "LightFabric",
    description: "Оперативный цеховой учёт: смены, выработка, передачи между цехами.",
    // Планшет в цеху открывается сразу на рабочем месте. Если вход не выполнен,
    // приложение само отправит на страницу входа.
    start_url: "/w",
    scope: "/",
    display: "standalone",
    background_color: "#F4F7FC",
    theme_color: "#214A8C",
    lang: "ru",
    dir: "ltr",
    orientation: "any",
    categories: ["business", "productivity"],
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
    shortcuts: [
      {
        name: "Рабочее место цеха",
        short_name: "Цех",
        url: "/w",
        description: "Смены, остатки и передачи своего цеха",
      },
      {
        name: "История смен",
        short_name: "История",
        url: "/w/shifts",
      },
      {
        name: "Перемещения",
        short_name: "Передачи",
        url: "/w/transfers",
      },
    ],
  };
}
