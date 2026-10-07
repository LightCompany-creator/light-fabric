// Подкаталог, из которого раздаётся приложение.
// На Vercel и в разработке пустой. В статической сборке для сервера фабрики
// задаётся при сборке (NEXT_PUBLIC_BASE_PATH=/lightfabric): приложение лежит
// в соседнем каталоге с публикацией 1С, и все свои файлы оно должно искать там.
//
// next/link и router подставляют basePath сами. Руками его нужно добавлять
// только там, где адрес уходит мимо Next: service worker, манифест, иконки.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Статическая сборка под сервер 1С: без Supabase, без серверных действий. */
export const IS_STATIC = process.env.NEXT_PUBLIC_LF_STATIC === "1";

/** Абсолютный путь внутри приложения с учётом подкаталога. */
export function withBase(path: string): string {
  return `${BASE_PATH}${path}`;
}
