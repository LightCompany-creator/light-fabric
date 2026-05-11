import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable();

export const NormSchema = z.object({
  article_id: z.string().uuid("Выберите артикул"),
  material_id: z.string().uuid("Выберите материал"),
  qty_per_pair: z.coerce.number().positive("Расход должен быть больше нуля"),
  notes: optionalText,
});

export type NormInput = z.infer<typeof NormSchema>;
