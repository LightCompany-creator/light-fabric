/** @type {import('next').NextConfig} */

// Два режима сборки.
// Обычный: `next build` для Vercel и разработки, все разделы, сервер Next.
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
      // Старые разделы на время сборки убраны из проекта (см. scripts/build-static.mjs),
      // и проверка типов спотыкается о компоненты, которые их импортируют.
      // Сам цеховой раздел проверяется обычной сборкой `next build`.
      typescript: { ignoreBuildErrors: true },
      eslint: { ignoreDuringBuilds: true },
    }
  : {};

export default nextConfig;
