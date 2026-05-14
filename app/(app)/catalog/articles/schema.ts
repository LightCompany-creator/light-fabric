import { z } from "zod";

const optionalNumber = z
  .union([z.string().length(0), z.coerce.number()])
  .transform((v) => (typeof v === "number" ? v : null))
  .nullable();

export const ArticleSchema = z.object({
  code: z.string().trim().min(1, "Код обязателен").max(50),
  name: z.string().trim().min(1, "Название обязательно").max(200),
  material: z.enum(["ЭВА", "ПВХ", "силикон", "текстиль", "фурнитура", "прочее"]),
  box_qty: z.coerce.number().int().min(1, "Минимум 1 пара в коробке"),
  size_min: optionalNumber,
  size_max: optionalNumber,
  wholesale_price: optionalNumber,
  weight_per_pair: optionalNumber,
  is_active: z.coerce.boolean().default(true),
});

export type ArticleInput = z.infer<typeof ArticleSchema>;

export const MATERIAL_OPTIONS = [
  "ЭВА",
  "ПВХ",
  "силикон",
  "текстиль",
  "фурнитура",
  "прочее",
] as const;
