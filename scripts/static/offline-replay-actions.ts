// Заглушка для статической сборки: старого раздела на Supabase в ней нет,
// его оффлайн-очередь не используется, а сам код остаётся только ради типов.
const unavailable = async (): Promise<never> => {
  throw new Error("Старый раздел недоступен в статической сборке");
};

export const addOutputAction = unavailable as (shiftId: string, formData: FormData) => Promise<never>;
export const addWorkerOperationAction = unavailable as (shiftId: string, formData: FormData) => Promise<never>;
