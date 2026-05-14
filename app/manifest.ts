import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LightFabric — MES Light Company",
    short_name: "LightFabric",
    description: "Оперативный цеховой учёт. Смены, выработка, ЗП, обмен с 1С.",
    start_url: "/dashboard",
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
        name: "Открыть смену",
        short_name: "Смена",
        url: "/shifts/new",
        description: "Открыть новую сменy в цехе",
      },
      {
        name: "Мои смены",
        short_name: "Смены",
        url: "/shifts",
      },
      {
        name: "Дашборд",
        short_name: "Дашборд",
        url: "/dashboard",
      },
    ],
  };
}
