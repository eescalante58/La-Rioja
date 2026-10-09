"use client";

import { useState } from "react";
import { AlertCircle, Loader2, Send } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  checkoutSchema,
  usd,
  type CheckoutInput,
  type CreateOrderResult,
} from "@/lib/validation/shop-orders";
import { useCart } from "./CartProvider";

/** Pedido registrado (para la pantalla de confirmación). */
export interface PlacedOrder {
  orderNumber: number;
  customerName: string;
  total: number;
  items: Extract<CreateOrderResult, { success: true }>["items"];
}

interface CheckoutFormProps {
  onBack: () => void;
  onPlaced: (order: PlacedOrder) => void;
}

const EMPTY: CheckoutInput = {
  customer_name: "",
  customer_phone: "",
  customer_email: "",
  notes: "",
};

const fieldClass =
  "w-full rounded-xl border border-gray-200 dark:border-white/15 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-larioja-verde/50";

/**
 * Datos del cliente y envío del pedido. Llama al RPC `create_shop_order`
 * desde el navegador (sin Server Action → sin re-render del RSC); el servidor
 * recalcula precios, valida disponibilidad y aplica límites anti-abuso.
 */
export function CheckoutForm({ onBack, onPlaced }: CheckoutFormProps) {
  const { lines, total } = useCart();
  const [form, setForm] = useState<CheckoutInput>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutInput, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const set =
    (key: keyof CheckoutInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitError(null);

    const parsed = checkoutSchema.safeParse(form);
    if (!parsed.success) {
      const fieldErrors: Partial<Record<keyof CheckoutInput, string>> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof CheckoutInput;
        fieldErrors[key] ??= issue.message;
      }
      setErrors(fieldErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const { data, error } = await createClient().rpc("create_shop_order", {
        p_customer_name: parsed.data.customer_name,
        p_customer_phone: parsed.data.customer_phone,
        p_customer_email: parsed.data.customer_email || null,
        p_notes: parsed.data.notes || null,
        p_items: lines.map((l) => ({ variant_id: l.variantId, quantity: l.quantity })),
      });
      const result = data as CreateOrderResult | null;
      if (error || !result) {
        setSubmitError("No pudimos registrar tu pedido. Revisa tu conexión e inténtalo de nuevo.");
        return;
      }
      if (!result.success) {
        setSubmitError(result.error);
        return;
      }
      onPlaced({
        orderNumber: result.order_number,
        customerName: parsed.data.customer_name,
        total: Number(result.total),
        items: result.items.map((i) => ({
          ...i,
          unit_price: Number(i.unit_price),
          subtotal: Number(i.subtotal),
        })),
      });
    } catch {
      setSubmitError("No pudimos registrar tu pedido. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full" noValidate>
      <div className="flex-1 overflow-y-auto space-y-4 p-5">
        <p className="text-sm text-gray-600 dark:text-white/70">
          Registraremos tu pedido y luego lo enviarás por WhatsApp para coordinar el pago y la
          entrega.
        </p>

        <Field label="Nombre completo *" error={errors.customer_name}>
          <input
            autoComplete="name"
            maxLength={120}
            value={form.customer_name}
            onChange={set("customer_name")}
            className={fieldClass}
          />
        </Field>
        <Field label="Teléfono / WhatsApp *" error={errors.customer_phone}>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            maxLength={25}
            value={form.customer_phone}
            onChange={set("customer_phone")}
            className={fieldClass}
            placeholder="7777-7777"
          />
        </Field>
        <Field label="Correo electrónico (opcional)" error={errors.customer_email}>
          <input
            type="email"
            autoComplete="email"
            maxLength={254}
            value={form.customer_email}
            onChange={set("customer_email")}
            className={fieldClass}
          />
        </Field>
        <Field label="Notas (opcional)" error={errors.notes}>
          <textarea
            rows={3}
            maxLength={500}
            value={form.notes}
            onChange={set("notes")}
            className={fieldClass}
            placeholder="Colores, fecha de entrega, etc."
          />
        </Field>

        {submitError && (
          <div className="flex items-start gap-2 rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            {submitError}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 dark:border-white/10 p-5 space-y-3">
        <div className="flex items-center justify-between text-larioja-azul dark:text-white">
          <span className="font-semibold">Total</span>
          <span className="text-xl font-bold">{usd.format(total)}</span>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            disabled={submitting}
            className="rounded-full px-4 py-3 text-sm font-bold text-larioja-azul dark:text-white hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-50"
          >
            Volver
          </button>
          <button
            type="submit"
            disabled={submitting || lines.length === 0}
            className="flex-1 inline-flex items-center justify-center gap-2 rounded-full bg-larioja-verde py-3 text-sm font-bold text-white hover:bg-larioja-verde/90 disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Registrar pedido
          </button>
        </div>
      </div>
    </form>
  );
}

/** Campo con etiqueta y mensaje de error. */
function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-larioja-azul dark:text-white mb-1">
        {label}
      </span>
      {children}
      {error && <span className="block mt-1 text-xs text-red-600 dark:text-red-400">{error}</span>}
    </label>
  );
}
