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

export const EmployeeSchema = z.object({
  tab_number: z.string().trim().min(1, "Табельный номер обязателен").max(50),
  full_name: z.string().trim().min(1, "ФИО обязательно").max(200),
  workshop_id: optionalUuid,
  position: optionalText,
  role: z
    .union([
      z.enum(["foreman", "technologist", "director", "accountant", "admin"]),
      z.literal("none"),
      z.literal(""),
    ])
    .transform((v) => (v === "none" || v === "" ? null : v))
    .nullable(),
  is_active: z.coerce.boolean().default(true),
  hire_date: optionalDate,
});

export type EmployeeInput = z.infer<typeof EmployeeSchema>;

export const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: "none", label: "Без логина (рабочий)" },
  { value: "foreman", label: "Бригадир" },
  { value: "technologist", label: "Технолог" },
  { value: "director", label: "Директор" },
  { value: "accountant", label: "Бухгалтер" },
  { value: "admin", label: "Администратор" },
];
