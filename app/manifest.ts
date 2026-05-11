import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LightFlow — MES Light Company",
    short_name: "LightFlow",
    description: "Оперативный цеховой учёт",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F4F7FC",
    theme_color: "#214A8C",
    lang: "ru",
    orientation: "any",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
