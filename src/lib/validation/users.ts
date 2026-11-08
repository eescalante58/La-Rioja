import { z } from "zod";

export const userSchema = z.object({
  email: z.string().email("Email inválido"),
  full_name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(100),
  secondary_email: z.string().email("Email secundario inválido").optional().or(z.literal("")),
  phone: z.string().optional().or(z.literal("")),
  avatar_url: z.string().url("URL de avatar inválida").optional().or(z.literal("")),
  status: z.enum(["active", "inactive"]).default("active"),
});

export type UserInput = z.infer<typeof userSchema>;
