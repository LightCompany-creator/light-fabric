import { z } from "zod";

export const MaterialSchema = z.object({
  code: z.string().trim().min(1, "Код обязателен").max(50),
  name: z.string().trim().min(1, "Название обязательно").max(200),
  unit: z.enum(["кг", "шт", "м", "м²", "л"]),
  current_stock: z.coerce.number().min(0).default(0),
  min_stock: z.coerce.number().min(0).default(0),
  is_active: z.coerce.boolean().default(true),
});

export type MaterialInput = z.infer<typeof MaterialSchema>;

export const UNIT_OPTIONS = ["кг", "шт", "м", "м²", "л"] as const;
