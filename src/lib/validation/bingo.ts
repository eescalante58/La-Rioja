import { z } from "zod";

export const eventSchema = z.object({
  company_id: z.number().int().positive("Empresa requerida"),
  event_id: z.string().min(1, "ID de evento requerido"),
  event_name: z.string().min(3, "El nombre del evento debe tener al menos 3 caracteres"),
  event_date: z.string().min(1, "Fecha de evento requerida"),
  card_value: z.number().min(0, "El valor del cartón no puede ser negativo"),
  status: z.enum(["Activo", "Inactivo", "Realizado", "Cancelado", "Cerrado", "Finalizado"]).default("Inactivo"),
  is_active: z.boolean().default(true),
  event_manager: z.string().min(1, "Responsable del evento requerido"),
  event_venue: z.string().nullable().optional(),
  Method_of_payment: z.string().nullable().optional(),
  event_goal: z.number().nullable().optional(),
  event_cartons_number: z.number().int().nullable().optional(),
  event_start_promotion_date: z.string().nullable().optional(),
});

const invoiceBaseSchema = z.object({
  company_id: z.number().int().positive(),
  event_id: z.string().min(1),
  invoice_number: z.string().min(1, "Número de factura requerido"),
  invoice_date: z.string().min(1, "Fecha de factura requerida"),
  customer_name: z.string().min(3, "Nombre del cliente requerido"),
  customer_email: z.string().email("Email de cliente inválido").or(z.literal("")).optional(),
  phone_area: z.string().optional(),
  phone_number: z.string().optional(),
  whatsapp_number: z.string().optional(),
  manager_name: z.string().min(1, "Nombre del gestor requerido"),
  cards_number: z.number().int().positive("Debe seleccionar al menos 1 cartón"),
  card_price: z.number().min(0, "El valor del cartón no puede ser negativo"),
  total_amount: z.number().min(0, "El total no puede ser negativo"),
  payment_method: z.string().default("efectivo"),
  status: z.string().default("pagada"),
  observation: z.string().optional().or(z.literal("")),
  associated_cards: z.array(z.number().int()).min(1, "Debe asociar al menos un cartón"),
});

/**
 * Facturas normales exigen precio y total > 0; una factura 'Donada'
 * lleva valor de cartón $0 (los cartones quedan con status 'Donado').
 */
const invoiceAmountsRefine = (
  d: { status?: string; card_price?: number; total_amount?: number },
  ctx: z.RefinementCtx,
) => {
  if (d.status === "Donada") return;
  if (d.card_price !== undefined && d.card_price <= 0) {
    ctx.addIssue({
      code: "custom",
      path: ["card_price"],
      message: "El valor del cartón debe ser mayor a 0",
    });
  }
  if (d.total_amount !== undefined && d.total_amount <= 0) {
    ctx.addIssue({
      code: "custom",
      path: ["total_amount"],
      message: "El total debe ser mayor a 0",
    });
  }
};

export const invoiceSchema = invoiceBaseSchema.superRefine(invoiceAmountsRefine);
export const invoiceUpdateSchema = invoiceBaseSchema
  .partial()
  .superRefine(invoiceAmountsRefine);

export const generateCardsSchema = z.object({
  company_id: z.number().int().positive(),
  event_id: z.string().min(1),
  start: z.number().int().min(1),
  end: z.number().int().min(1),
  price: z.number().min(0),
  card_type: z.enum(["Virtual", "Fisico"]),
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
  card_status: z.enum(["Disponible", "Vendido", "Asignado", "Reservado", "Anulado", "Donado"]),
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
