import { z } from "zod";

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable();

const optionalUuid = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 || v === "none" ? null : v))
  .nullable();

const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v.length === 0 ? null : v))
  .nullable();

export const RateSchema = z.object({
  workshop_id: z.string().uuid("Выберите цех"),
  article_id: optionalUuid,
  operation: optionalText,
  rate_per_unit: z.coerce.number().min(0, "Расценка не может быть отрицательной"),
  unit_type: z.enum(["пара", "деталь", "операция", "единица", "кг"]),
  valid_from: z.string().min(1, "Дата начала обязательна"),
  valid_to: optionalDate,
});

export type RateInput = z.infer<typeof RateSchema>;

export const UNIT_TYPE_OPTIONS = [
  { value: "пара", label: "за пару" },
  { value: "деталь", label: "за деталь" },
  { value: "операция", label: "за операцию" },
  { value: "единица", label: "за единицу" },
  { value: "кг", label: "за кг" },
] as const;
