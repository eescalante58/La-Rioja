import { z } from "zod";

/** Estados de un pedido (CHECK de `shop_orders.status`). */
export const ORDER_STATUSES = ["nuevo", "confirmado", "listo", "entregado", "cancelado"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Etiquetas para la UI. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  nuevo: "Nuevo",
  confirmado: "Confirmado",
  listo: "Listo para entregar",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

/**
 * Datos del cliente en la canasta pública. Mismas reglas que el RPC
 * `create_shop_order` (que vuelve a validarlas en el servidor).
 */
export const checkoutSchema = z.object({
  customer_name: z
    .string()
    .trim()
    .min(2, "Ingresa tu nombre completo.")
    .max(120, "El nombre es demasiado largo."),
  customer_phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9][0-9 .-]{5,24}$/, "Ingresa un número de teléfono válido."),
  customer_email: z
    .string()
    .trim()
    .max(254)
    .email("El correo electrónico no es válido.")
    .or(z.literal("")),
  notes: z.string().trim().max(500, "Las notas no pueden superar 500 caracteres."),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;

/** Ítem de pedido (copia de nombre y precio al momento de la compra). */
export interface ShopOrderItem {
  id?: number;
  variant_id?: number | null;
  product_name: string;
  variant_label: string | null;
  unit: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
}

/** Respuesta del RPC `create_shop_order`. */
export type CreateOrderResult =
  | { success: true; order_number: number; total: number; items: ShopOrderItem[] }
  | { success: false; error: string };

/** Pedido con sus ítems (vista del admin). */
export interface ShopOrder {
  id: string;
  order_number: number;
  company_id: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  notes: string | null;
  total: number;
  status: OrderStatus;
  created_at: string;
  updated_at: string;
  items: ShopOrderItem[];
}

/** Formato de moneda de la tienda. */
export const usd = new Intl.NumberFormat("es-SV", { style: "currency", currency: "USD" });

/** Nombre del ítem con su presentación: «Tortilleros (Grande)». */
export function itemLabel(item: Pick<ShopOrderItem, "product_name" | "variant_label">): string {
  return item.variant_label ? `${item.product_name} (${item.variant_label})` : item.product_name;
}

/**
 * Mensaje de WhatsApp de un pedido registrado.
 */
export function buildOrderMessage(
  orderNumber: number,
  customerName: string,
  items: ShopOrderItem[],
  total: number,
): string {
  const lines = items.map(
    (i) =>
      `• ${i.quantity} × ${itemLabel(i)}${i.unit ? ` (${i.unit})` : ""} — ${usd.format(i.subtotal)}`,
  );
  return [
    `Hola, soy ${customerName}. Acabo de registrar el pedido #${orderNumber} en La Rioja Shop:`,
    "",
    ...lines,
    "",
    `Total: ${usd.format(total)}`,
  ].join("\n");
}

/** Normaliza solo dígitos para wa.me. */
export function waDigits(phone: string | null | undefined): string | undefined {
  const digits = phone?.replace(/\D/g, "");
  return digits ? digits : undefined;
}
