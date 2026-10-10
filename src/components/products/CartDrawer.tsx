"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Minus, Package, Plus, ShoppingBasket, Trash2, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/layout/WhatsAppIcon";
import { buildOrderMessage, itemLabel, usd } from "@/lib/validation/shop-orders";
import { useCart } from "./CartProvider";
import { CheckoutForm, type PlacedOrder } from "./CheckoutForm";

type Step = "cart" | "checkout" | "done";

interface CartDrawerProps {
  /** Número de WhatsApp de la tienda (solo dígitos). */
  whatsappDigits?: string;
}

/**
 * Botón de la canasta para la barra fija de la tienda (junto a los catálogos):
 * muestra cantidad y total y abre el panel lateral.
 */
export function CartButton() {
  const cart = useCart();
  const empty = cart.count === 0;
  return (
    <button
      type="button"
      onClick={cart.open}
      className={`relative inline-flex shrink-0 items-center gap-2 rounded-full py-2.5 px-3 sm:pl-3.5 sm:pr-4 text-sm font-bold shadow-sm border transition-colors ${
        empty
          ? "bg-white text-larioja-azul border-gray-200 hover:border-larioja-azul dark:bg-slate-800 dark:text-white dark:border-white/10"
          : "bg-larioja-azul text-white border-larioja-azul hover:bg-larioja-azul/90 dark:bg-larioja-amarillo dark:text-larioja-azul dark:border-larioja-amarillo"
      }`}
      aria-label={
        empty ? "Canasta vacía" : `Ver canasta: ${cart.count} productos, ${usd.format(cart.total)}`
      }
    >
      <span className="relative">
        <ShoppingBasket size={20} />
        {!empty && (
          <span className="absolute -top-2 -right-2.5 min-w-[1.25rem] rounded-full bg-larioja-verde px-1 text-center text-[11px] font-bold leading-5 text-white">
            {cart.count}
          </span>
        )}
      </span>
      {/* En móvil solo el ícono con el contador (deja espacio a los catálogos). */}
      <span className="hidden sm:inline">{empty ? "Canasta" : usd.format(cart.total)}</span>
    </button>
  );
}

/**
 * Panel lateral de la canasta con tres pasos:
 * canasta → datos del cliente → pedido registrado (enviar por WhatsApp).
 */
export function CartDrawer({ whatsappDigits }: CartDrawerProps) {
  const cart = useCart();
  const [step, setStep] = useState<Step>("cart");
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Esc cierra; el foco entra al panel solo al abrir (no en cada cambio de la canasta).
  const closeRef = useRef(cart.close);
  closeRef.current = cart.close;
  useEffect(() => {
    if (!cart.isOpen) return;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cart.isOpen]);

  // Al cerrar después de registrar, la siguiente apertura empieza de nuevo.
  useEffect(() => {
    if (!cart.isOpen && step === "done") {
      setStep("cart");
      setPlaced(null);
    }
  }, [cart.isOpen, step]);

  const handlePlaced = (order: PlacedOrder) => {
    setPlaced(order);
    setStep("done");
    cart.clear();
  };

  const waLink =
    placed && whatsappDigits
      ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
          buildOrderMessage(placed.orderNumber, placed.customerName, placed.items, placed.total),
        )}`
      : undefined;

  const title =
    step === "cart" ? "Tu canasta" : step === "checkout" ? "Tus datos" : "¡Pedido registrado!";

  return (
    <>
      {cart.isOpen && (
        <div className="fixed inset-0 z-[130]" role="dialog" aria-modal="true" aria-label={title}>
          <button
            type="button"
            className="absolute inset-0 bg-black/50 backdrop-blur-sm cursor-default"
            onClick={cart.close}
            aria-label="Cerrar canasta"
            tabIndex={-1}
          />
          <div
            ref={panelRef}
            tabIndex={-1}
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white dark:bg-slate-950 shadow-2xl outline-none"
          >
            <header className="flex items-center justify-between border-b border-gray-100 dark:border-white/10 px-5 py-4">
              <h2 className="text-lg font-bold text-larioja-azul dark:text-white">{title}</h2>
              <button
                type="button"
                onClick={cart.close}
                className="rounded-full p-2 text-gray-500 hover:bg-gray-100 dark:text-white/70 dark:hover:bg-white/10"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </header>

            {step === "cart" && (
              <>
                <div className="flex-1 overflow-y-auto p-5">
                  {cart.lines.length === 0 ? (
                    <div className="py-20 text-center text-gray-500 dark:text-white/60">
                      <ShoppingBasket size={48} className="mx-auto mb-4 opacity-40" />
                      Tu canasta está vacía.
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {cart.lines.map((l) => (
                        <li key={l.variantId} className="flex gap-3">
                          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-[#f3efe7] dark:bg-slate-800">
                            {l.imageUrl ? (
                              <Image
                                src={l.imageUrl}
                                alt=""
                                fill
                                sizes="64px"
                                className="object-contain p-1"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center text-[#d8cfbf]">
                                <Package size={24} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-larioja-azul dark:text-white leading-tight">
                              {itemLabel({
                                product_name: l.productName,
                                variant_label: l.variantLabel,
                              })}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-white/60">
                              {usd.format(l.price)}
                              {l.unit ? ` por ${l.unit}` : ""}
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="inline-flex items-center rounded-full border border-gray-200 dark:border-white/15">
                                <button
                                  type="button"
                                  onClick={() => cart.setQuantity(l.variantId, l.quantity - 1)}
                                  className="p-1.5 text-gray-600 dark:text-white/70"
                                  aria-label="Quitar uno"
                                >
                                  <Minus size={14} />
                                </button>
                                <input
                                  type="number"
                                  min={1}
                                  max={999}
                                  value={l.quantity}
                                  onChange={(e) =>
                                    cart.setQuantity(
                                      l.variantId,
                                      Math.max(1, Math.floor(Number(e.target.value)) || 1),
                                    )
                                  }
                                  className="w-10 bg-transparent text-center text-sm font-bold text-larioja-azul dark:text-white [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                                  aria-label={`Cantidad de ${l.productName}`}
                                />
                                <button
                                  type="button"
                                  onClick={() => cart.setQuantity(l.variantId, l.quantity + 1)}
                                  className="p-1.5 text-gray-600 dark:text-white/70"
                                  aria-label="Agregar uno"
                                >
                                  <Plus size={14} />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => cart.setQuantity(l.variantId, 0)}
                                className="p-1.5 text-gray-400 hover:text-red-600"
                                aria-label={`Quitar ${l.productName}`}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <p className="shrink-0 text-sm font-bold text-larioja-azul dark:text-larioja-amarillo">
                            {usd.format(l.price * l.quantity)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {cart.lines.length > 0 && (
                  <div className="border-t border-gray-100 dark:border-white/10 p-5 space-y-3">
                    <div className="flex items-center justify-between text-larioja-azul dark:text-white">
                      <span className="font-semibold">Total</span>
                      <span className="text-xl font-bold">{usd.format(cart.total)}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStep("checkout")}
                      className="w-full rounded-full bg-larioja-verde py-3 text-sm font-bold text-white hover:bg-larioja-verde/90"
                    >
                      Continuar con el pedido
                    </button>
                  </div>
                )}
              </>
            )}

            {step === "checkout" && (
              <CheckoutForm onBack={() => setStep("cart")} onPlaced={handlePlaced} />
            )}

            {step === "done" && placed && (
              <div className="flex-1 overflow-y-auto p-5 space-y-5 text-center">
                <CheckCircle2 size={56} className="mx-auto text-larioja-verde" />
                <div>
                  <p className="text-2xl font-bold text-larioja-azul dark:text-white">
                    Pedido #{placed.orderNumber}
                  </p>
                  <p className="text-gray-600 dark:text-white/70">
                    Total {usd.format(placed.total)}
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-white/70">
                  Último paso: envíanos el pedido por WhatsApp para coordinar el pago y la entrega.
                </p>
                {waLink ? (
                  <a
                    href={waLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-larioja-verde py-3 text-sm font-bold text-white hover:bg-larioja-verde/90"
                  >
                    <WhatsAppIcon className="w-5 h-5" />
                    Enviar pedido por WhatsApp
                  </a>
                ) : (
                  <p className="text-sm text-gray-500">
                    Te contactaremos al teléfono que registraste.
                  </p>
                )}
                <button
                  type="button"
                  onClick={cart.close}
                  className="text-sm font-semibold text-larioja-azul dark:text-white hover:underline"
                >
                  Seguir viendo productos
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
