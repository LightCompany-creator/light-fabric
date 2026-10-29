/** @type {import('next').NextConfig} */

// Два режима сборки.
// Обычный: `next build` для разработки и проверок, сервер Next.
// Статический: `npm run build:static` (scripts/build-static.mjs ставит LF_STATIC=1).
// Получается папка с html/js/css под подкаталог сервера 1С, Node на сервере не нужен.
const isStatic = process.env.LF_STATIC === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig = isStatic
  ? {
      output: "export",
      basePath,
      // Каждая страница становится папкой с index.html: так IIS и любой другой
      // веб-сервер отдают /lightfabric/w/ без правил переписывания адресов.
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : {};

export default nextConfig;
