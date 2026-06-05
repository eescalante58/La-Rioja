import { z } from "zod";

export const eventSchema = z.object({
  company_id: z.number().int().positive("Empresa requerida"),
  event_id: z.string().min(1, "ID de evento requerido"),
  event_name: z.string().min(3, "El nombre del evento debe tener al menos 3 caracteres"),
  event_date: z.string().min(1, "Fecha de evento requerida"),
  card_value: z.number().min(0, "El valor del cartón no puede ser negativo"),
  status: z.enum(["Activo", "Inactivo", "Finalizado"]).default("Inactivo"),
  event_manager: z.string().min(1, "Responsable del evento requerido"),
  event_goal: z.number().nullable().optional(),
  event_cartons_number: z.number().int().nullable().optional(),
  event_start_promotion_date: z.string().nullable().optional(),
});

export const invoiceSchema = z.object({
  company_id: z.number().int().positive(),
  event_id: z.string().min(1),
  invoice_number: z.string().min(1, "Número de factura requerido"),
  invoice_date: z.string().min(1, "Fecha de factura requerida"),
  customer_name: z.string().min(3, "Nombre del cliente requerido"),
  customer_email: z.string().email("Email de cliente inválido"),
  phone_area: z.string().optional(),
  phone_number: z.string().optional(),
  whatsapp_number: z.string().optional(),
  manager_name: z.string().min(1, "Nombre del gestor requerido"),
  cards_number: z.number().int().positive("Debe seleccionar al menos 1 cartón"),
  card_price: z.number().positive(),
  total_amount: z.number().positive(),
  payment_method: z.string().min(1, "Método de pago requerido"),
  status: z.string().default("Pagado"),
  associated_cards: z.array(z.number().int()).min(1, "Debe asociar al menos un cartón"),
});

export const generateCardsSchema = z.object({
  company_id: z.number().int().positive(),
  event_id: z.string().min(1),
  start: z.number().int().min(1),
  end: z.number().int().min(1),
  price: z.number().min(0),
  deleteExisting: z.boolean().default(false),
});

export const updateCardTypeSchema = z.object({
  company_id: z.number().int().positive(),
  event_id: z.string().min(1),
  card_number: z.number().int().min(1),
  new_type: z.enum(["Virtual", "Fisico"]),
  official_name: z.string().min(1),
});

export const updateCardRangeTypeSchema = z.object({
  company_id: z.number().int().positive(),
  event_id: z.string().min(1),
  start: z.number().int().min(1),
  end: z.number().int().min(1),
  new_type: z.enum(["Virtual", "Fisico"]),
  official_name: z.string().min(1),
});

export const singleCardSchema = z.object({
  card_type: z.enum(["Virtual", "Fisico"]),
  card_status: z.enum(["Disponible", "Vendido", "Reservado", "Anulado"]),
  card_price: z.number().min(0),
  sales_price: z.number().min(0).nullable().optional(),
  sold_by: z.string().optional().or(z.literal("")),
  player_name: z.string().optional().or(z.literal("")),
  player_phone_number: z.string().optional().or(z.literal("")),
  player_email: z.string().email().optional().or(z.literal("")),
  prize: z.string().optional().or(z.literal("")),
  comment: z.string().optional().or(z.literal("")),
  invoice_number: z.string().optional().or(z.literal("")),
});

export type EventInput = z.infer<typeof eventSchema>;
export type InvoiceInput = z.infer<typeof invoiceSchema>;
export type GenerateCardsInput = z.infer<typeof generateCardsSchema>;
export type UpdateCardTypeInput = z.infer<typeof updateCardTypeSchema>;
export type UpdateCardRangeTypeInput = z.infer<typeof updateCardRangeTypeSchema>;
export type SingleCardInput = z.infer<typeof singleCardSchema>;
