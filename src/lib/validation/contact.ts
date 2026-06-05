import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100),
  email: z.string().email("Email inválido"),
  phone: z.string().optional(),
  type: z.string().min(1, "Seleccione un tipo de consulta"),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres").max(1000),
  targetEmail: z.string().min(1, "Canal de destino requerido"),
});

export type ContactInput = z.infer<typeof contactSchema>;
