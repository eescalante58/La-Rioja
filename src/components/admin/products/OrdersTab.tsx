"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Select, SelectItem } from "@tremor/react";
import { ClipboardList, Loader2, Mail, RefreshCw } from "lucide-react";
import { callAction } from "@/lib/action-client";
import { WhatsAppIcon } from "@/components/layout/WhatsAppIcon";
import {
  itemLabel,
  ORDER_STATUS_LABELS,
  ORDER_STATUSES,
  usd,
  waDigits,
  type OrderStatus,
  type ShopOrder,
} from "@/lib/validation/shop-orders";
import { ErrorBox, type Result } from "./shared";

const ALL = "all";

/** Colores de la etiqueta de estado. */
const STATUS_STYLES: Record<OrderStatus, string> = {
  nuevo: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  confirmado: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
  listo: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  entregado: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  cancelado: "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const dateFormatter = new Intl.DateTimeFormat("es-SV", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/El_Salvador",
});

/** Fecha local (El Salvador) en formato AAAA-MM-DD. */
const dayKey = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "America/El_Salvador" }).format(new Date(iso));

/**
 * Pestaña Pedidos: pedidos enviados desde la canasta de /productos, con
 * filtro por estado, detalle de ítems, cambio de estado y contacto por
 * WhatsApp. Carga bajo demanda vía `/api/actions` (`pedidos.*`).
 */
export default function OrdersTab({ companyId }: { companyId: number }) {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await callAction<Result<ShopOrder[]>>("pedidos.listOrders", [
        companyId,
        statusFilter === ALL ? null : statusFilter,
      ]);
      if (res.success) setOrders(res.data ?? []);
      else setError(res.error);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [companyId, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const summary = useMemo(() => {
    const today = dayKey(new Date().toISOString());
    const todays = orders.filter((o) => dayKey(o.created_at) === today && o.status !== "cancelado");
    return {
      pending: orders.filter((o) => o.status === "nuevo").length,
      todayCount: todays.length,
      todayTotal: todays.reduce((sum, o) => sum + o.total, 0),
    };
  }, [orders]);

  const changeStatus = async (order: ShopOrder, status: OrderStatus) => {
    if (status === order.status) return;
    setBusyId(order.id);
    setError(null);
    try {
      const res = await callAction<Result<undefined>>("pedidos.updateOrderStatus", [
        order.id,
        status,
      ]);
      if (res.success)
        setOrders((prev) =>
          prev
            .map((o) => (o.id === order.id ? { ...o, status } : o))
            .filter((o) => statusFilter === ALL || o.status === statusFilter),
        );
      else setError(res.error);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 pt-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard label="Pedidos nuevos" value={String(summary.pending)} />
        <SummaryCard label="Pedidos de hoy" value={String(summary.todayCount)} />
        <SummaryCard label="Total de hoy" value={usd.format(summary.todayTotal)} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="w-full sm:w-64">
          <Select value={statusFilter} onValueChange={setStatusFilter} enableClear={false}>
            <SelectItem value={ALL}>Todos los estados</SelectItem>
            {ORDER_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </Select>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Actualizar
        </button>
        {statusFilter === ALL && (
          <p className="text-xs text-gray-400">Se muestran los 300 pedidos más recientes.</p>
        )}
      </div>

      <ErrorBox message={error} />

      {loading && orders.length === 0 ? (
        <div className="flex justify-center py-16 text-gray-400">
          <Loader2 className="animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 py-16 text-center text-gray-500 dark:text-gray-400">
          <ClipboardList size={40} className="mx-auto mb-3 opacity-50" />
          No hay pedidos {statusFilter === ALL ? "todavía" : "con este estado"}.
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {orders.map((o) => {
            const phone = waDigits(o.customer_phone);
            // Teléfonos locales de 8 dígitos: anteponer el código de El Salvador.
            const waNumber = phone && phone.length === 8 ? `503${phone}` : phone;
            const waText = `Hola ${o.customer_name}, te escribimos de La Rioja Shop sobre tu pedido #${o.order_number}.`;
            return (
              <article
                key={o.id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950"
              >
                <header className="flex flex-wrap items-start gap-3 border-b border-gray-100 dark:border-gray-800 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                      Pedido #{o.order_number}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_STYLES[o.status]}`}
                      >
                        {ORDER_STATUS_LABELS[o.status]}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {dateFormatter.format(new Date(o.created_at))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {busyId === o.id && (
                      <Loader2 size={16} className="animate-spin text-gray-400" />
                    )}
                    <div className="w-48">
                      <Select
                        value={o.status}
                        onValueChange={(v) => changeStatus(o, v as OrderStatus)}
                        enableClear={false}
                        disabled={busyId === o.id}
                      >
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>
                            {ORDER_STATUS_LABELS[s]}
                          </SelectItem>
                        ))}
                      </Select>
                    </div>
                  </div>
                </header>

                <div className="space-y-3 p-4">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {o.customer_name}
                    </span>
                    {waNumber ? (
                      <a
                        href={`https://wa.me/${waNumber}?text=${encodeURIComponent(waText)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-larioja-verde hover:underline"
                      >
                        <WhatsAppIcon className="w-4 h-4" />
                        {o.customer_phone}
                      </a>
                    ) : (
                      <span>{o.customer_phone}</span>
                    )}
                    {o.customer_email && (
                      <a
                        href={`mailto:${o.customer_email}`}
                        className="inline-flex items-center gap-1 text-gray-500 hover:underline"
                      >
                        <Mail size={14} />
                        {o.customer_email}
                      </a>
                    )}
                  </div>

                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                      {o.items.map((i, idx) => (
                        <tr key={i.id ?? idx}>
                          <td className="py-1.5 pr-2 text-gray-500 w-12">{i.quantity} ×</td>
                          <td className="py-1.5 pr-2 text-gray-900 dark:text-gray-100">
                            {itemLabel(i)}
                            {i.unit && <span className="text-gray-400"> ({i.unit})</span>}
                          </td>
                          <td className="py-1.5 text-right text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {usd.format(i.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-gray-200 dark:border-gray-700">
                        <td colSpan={2} className="pt-2 font-bold text-gray-900 dark:text-white">
                          Total
                        </td>
                        <td className="pt-2 text-right font-bold text-larioja-azul dark:text-larioja-amarillo">
                          {usd.format(o.total)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>

                  {o.notes && (
                    <p className="rounded-lg bg-gray-50 dark:bg-gray-900 p-2 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line">
                      <span className="font-semibold">Notas: </span>
                      {o.notes}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

/** Tarjeta de resumen numérico. */
function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
