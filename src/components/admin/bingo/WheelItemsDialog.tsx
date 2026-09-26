"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  TextInput,
  Textarea,
  Button,
  Badge,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from "@tremor/react";
import { Plus, Trash2, Ticket, Copy, Check } from "lucide-react";
import { saveWheelItems } from "@/app/admin/bingo/wheel-actions";
import { redirectIfSessionExpired } from "@/lib/auth/sessionFeedback";
import { createClient } from "@/lib/supabase/client";
import type { Wheel, WheelItem, TombolaCard } from "./wheel-types";

interface WheelItemsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  wheel: Wheel | null;
  companyId?: number;
  eventId?: string;
  onSuccess: () => void;
}

interface EditableItem {
  label: string;
  color: string;
  quantity: number | string;
  initial_quantity?: number | string;
  is_active: boolean;
}

/**
 * Editor de segmentos de una ruleta.
 * - Premios/Participantes: tabla editable (texto, color, stock, activo).
 * - Cartones: vista de solo lectura; los segmentos se generan al vuelo
 *   desde los cartones vendidos del evento.
 */
export default function WheelItemsDialog({
  isOpen,
  onClose,
  wheel,
  companyId,
  eventId,
  onSuccess,
}: WheelItemsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<EditableItem[]>([]);
  const [tombolaCards, setTombolaCards] = useState<TombolaCard[] | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [loadingTombola, setLoadingTombola] = useState(false);
  const [urlCopied, setUrlCopied] = useState(false);

  // URL del formulario público de auto-registro (modo Participantes).
  // Es la que se convierte en QR para proyectar/compartir en el evento.
  const registroUrl =
    wheel && typeof window !== "undefined"
      ? `${window.location.origin}/registro?id=${wheel.id}`
      : `/registro?id=${wheel?.id}`;

  /** Copia al portapapeles el URL del formulario /registro. */
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(registroUrl);
      setUrlCopied(true);
      setTimeout(() => setUrlCopied(false), 2000);
    } catch {
      alert("No se pudo copiar. Selecciona el URL manualmente.");
    }
  };

  // Tómbola aplica a Cartones y Participantes (cartones vendidos del evento)
  const isCardsMode = wheel?.mode === "Cartones" || wheel?.mode === "Participantes";

  // Las operaciones de tómbola van por /api/tombola/cards (Route Handler):
  // las Server Actions re-renderizan /admin/bingo completo y tardaban minutos.
  const refreshTombolaCards = async () => {
    if (!companyId || !wheel) return;
    const res = await fetch(
      `/api/tombola/cards?companyId=${companyId}&wheelId=${wheel.id}`,
    );
    const json = (await res.json()) as { data?: TombolaCard[] };
    setTombolaCards(json.data || []);
  };

  useEffect(() => {
    if (!isOpen || !wheel || !companyId || !eventId) return;

    if (isCardsMode) {
      refreshTombolaCards();
      return;
    }

    // Sincronización Directa: Mantenemos el estado 'items' actualizado con la prop 'wheel'
    // pero solo si el usuario NO está interactuando activamente (para no moverle el cursor)
    const currentItems = wheel?.items || [];
    setItems(
      currentItems.map((i: WheelItem) => ({
        label: i.label,
        color: i.color || "#012060",
        quantity: i.quantity ?? 1,
        initial_quantity: i.initial_quantity ?? i.quantity ?? 1,
        is_active: i.is_active ?? true,
      })),
    );
  }, [isOpen, wheel?.items, companyId, eventId]); // Escuchamos específicamente los items del wheel

  // Realtime: cuando la tómbola marca ganadores (/api/tombola/spin) o un
  // asistente se registra (/registro), refrescamos la lista del diálogo.
  // La tabla depende del modo: Participantes usa wheels_presents_cards.
  useEffect(() => {
    if (!isOpen || !wheel || !isCardsMode || !companyId) return;

    const table =
      wheel.mode === "Participantes"
        ? "wheels_presents_cards"
        : "wheel_participating_cards";
    const supabase = createClient();
    const channel = supabase
      .channel(`tombola_admin_${wheel.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table,
          filter: `wheel_id=eq.${wheel.id}`,
        },
        () => {
          refreshTombolaCards();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, wheel?.id, isCardsMode, companyId]);

  /** Carga masiva de cartones vendidos/donados del evento a la tómbola. */
  const handleLoadTombola = async () => {
    if (!companyId || !wheel) return;
    setLoadingTombola(true);
    const res = await fetch("/api/tombola/cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, wheelId: wheel.id }),
    });
    const json = (await res.json()) as { success?: boolean; error?: string };
    setLoadingTombola(false);
    if (json.success) {
      await refreshTombolaCards();
    } else if (!redirectIfSessionExpired(json)) {
      alert("Error: " + (json.error || "No se pudieron cargar los cartones."));
    }
  };

  /** Quita un cartón no-ganador de la tómbola. */
  const handleRemoveTombolaCard = async (cardId: number) => {
    if (!companyId) return;
    const res = await fetch("/api/tombola/cards", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyId, cardId }),
    });
    const json = (await res.json()) as { success?: boolean; error?: string };
    if (json.success) {
      setTombolaCards((prev) => (prev ? prev.filter((c) => c.id !== cardId) : prev));
    } else if (!redirectIfSessionExpired(json)) {
      alert("Error: " + (json.error || "No se pudo quitar el cartón."));
    }
  };

  const updateItem = (idx: number, patch: Partial<EditableItem>) => {
    setItems((prev) =>
      prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)),
    );
  };

  const handleSave = async () => {
    if (!companyId || !eventId || !wheel) return;
    if (items.length === 0) {
      alert("La ruleta debe tener al menos un segmento.");
      return;
    }
    if (items.some((i) => !i.label.trim())) {
      alert("Todos los segmentos deben tener texto.");
      return;
    }

    setLoading(true);
    try {
      const result = await saveWheelItems(
        companyId,
        wheel.id,
        items.map((it, idx) => ({
          label: it.label.trim(),
          color: it.color || null,
          quantity: Math.max(0, parseInt(String(it.quantity)) || 0),
          initial_quantity: Math.max(0, parseInt(String(it.initial_quantity ?? it.quantity)) || 0),
          position: idx + 1,
          is_active: it.is_active,
        })),
      );

      if (result?.success) {
        onSuccess();
        setJustSaved(true);
        setTimeout(() => setJustSaved(false), 3000);
      } else if (!redirectIfSessionExpired(result)) {
        alert("Error: " + (result?.error || "No se pudieron guardar los segmentos."));
      }
    } catch (error) {
      console.error("Error saving wheel items:", error);
      alert(
        "Error inesperado al guardar. Si el problema persiste, vuelve a iniciar sesión.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!companyId || !eventId) return null;

  const totalInitial = items.reduce((sum, it) => sum + (parseInt(String(it.initial_quantity ?? it.quantity)) || 0), 0);
  const totalCurrent = items.reduce((sum, it) => sum + (parseInt(String(it.quantity)) || 0), 0);

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-[70]" />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <DialogPanel className="max-w-4xl w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <Title>{wheel?.wheel_name}</Title>
            <Badge color="blue">{wheel?.mode}</Badge>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <Text className="text-sm">Evento: {eventId}</Text>
            
            {wheel?.mode === "Premios" && (
              <div className="flex items-center gap-3">
                <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
                  <Text className="text-[10px] font-bold uppercase text-gray-400 leading-none mb-1">Total Inicial</Text>
                  <Text className="text-lg font-black text-gray-600 dark:text-gray-300 leading-none">{totalInitial}</Text>
                </div>
                <div className="bg-larioja-azul/5 dark:bg-larioja-azul/10 px-3 py-1.5 rounded-lg border border-larioja-azul/20">
                  <Text className="text-[10px] font-bold uppercase text-larioja-azul/60 leading-none mb-1">Total Actual</Text>
                  <Text className="text-lg font-black text-larioja-azul dark:text-blue-400 leading-none">{totalCurrent}</Text>
                </div>
              </div>
            )}
          </div>

          {isCardsMode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Text>
                  Cartones de la tómbola:{" "}
                  <span className="font-bold">
                    {tombolaCards === null
                      ? "cargando..."
                      : `${tombolaCards.filter((c) => !c.is_winner).length} disponibles · ${tombolaCards.filter((c) => c.is_winner).length} ganadores`}
                  </span>
                </Text>
                {wheel?.mode === "Cartones" && (
                  <Button
                    size="xs"
                    icon={Ticket}
                    loading={loadingTombola}
                    onClick={handleLoadTombola}
                    className="bg-larioja-azul"
                  >
                    Cargar cartones vendidos y donados
                  </Button>
                )}
              </div>

              {wheel?.mode === "Participantes" && (
                <div className="rounded-xl border border-larioja-azul/20 bg-larioja-azul/5 p-3 dark:border-larioja-azul/30 dark:bg-larioja-azul/10">
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    Los asistentes registran sus cartones desde el formulario
                    público — convierte este URL en QR para el evento:
                  </Text>
                  <div className="mt-2 flex items-center gap-2">
                    <a
                      href={registroUrl}
                      target="_blank"
                      className="min-w-0 flex-1 truncate rounded-lg border border-gray-200 bg-white px-3 py-2 font-mono text-xs text-larioja-azul underline dark:border-gray-700 dark:bg-gray-800"
                    >
                      {registroUrl}
                    </a>
                    <Button
                      size="xs"
                      variant="secondary"
                      icon={urlCopied ? Check : Copy}
                      onClick={handleCopyUrl}
                    >
                      {urlCopied ? "Copiado" : "Copiar"}
                    </Button>
                  </div>
                </div>
              )}

              {tombolaCards !== null && tombolaCards.length === 0 && (
                <div className="py-8 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-xl">
                  <Ticket size={36} className="mx-auto text-gray-300 mb-2" />
                  <Text className="text-gray-400 italic">
                    {wheel?.mode === "Participantes"
                      ? "Sin registros todavía. Los cartones aparecen aquí cuando los asistentes usen el formulario /registro."
                      : "Sin cartones cargados. Usa el botón para traer los vendidos y donados del evento."}
                  </Text>
                </div>
              )}

              {tombolaCards !== null && tombolaCards.length > 0 && (
                <div className="max-h-[45vh] overflow-y-auto pr-1">
                  <div className="flex flex-wrap gap-1.5">
                    {tombolaCards.map((card) => (
                      <Badge
                        key={card.id}
                        color={card.is_winner ? "amber" : "blue"}
                        className={card.is_winner ? "opacity-60 line-through" : ""}
                        title={
                          card.player_name
                            ? `${card.player_name} · ${card.player_phone_number ?? ""}`
                            : undefined
                        }
                      >
                        #{card.card_number}
                        {card.player_name ? ` · ${card.player_name}` : ""}
                        {!card.is_winner && (
                          <button
                            onClick={() => handleRemoveTombolaCard(card.id)}
                            className="ml-1 opacity-60 hover:opacity-100"
                            title="Quitar de la tómbola"
                          >
                            ×
                          </button>
                        )}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Segmento</TableHeaderCell>
                      <TableHeaderCell>Color</TableHeaderCell>
                      {wheel?.mode === "Premios" && (
                        <>
                          <TableHeaderCell>Stock Inicial</TableHeaderCell>
                          <TableHeaderCell>Stock Actual</TableHeaderCell>
                        </>
                      )}
                      <TableHeaderCell>Activo</TableHeaderCell>
                      <TableHeaderCell className="text-right">
                        Quitar
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell>
                          <Textarea
                            value={item.label}
                            onValueChange={(v) => updateItem(idx, { label: v })}
                            placeholder="Ej: Giftcard&#10;$50"
                            rows={2}
                            className="min-w-[200px]"
                          />
                        </TableCell>
                        <TableCell>
                          <input
                            type="color"
                            value={item.color}
                            onChange={(e) =>
                              updateItem(idx, { color: e.target.value })
                            }
                            className="h-9 w-14 cursor-pointer rounded border border-gray-200"
                            title="Color del segmento"
                          />
                        </TableCell>
                        {wheel?.mode === "Premios" && (
                          <>
                            <TableCell>
                              <TextInput
                                type="number"
                                min={0}
                                value={String(item.initial_quantity ?? item.quantity)}
                                onValueChange={(v) => {
                                  const val = parseInt(v) || 0;
                                  // Si estamos creando un nuevo item, sincronizamos ambos
                                  updateItem(idx, { 
                                    initial_quantity: val,
                                    quantity: item.label === "" ? val : item.quantity 
                                  });
                                }}
                                className="w-24"
                                placeholder="Base"
                              />
                            </TableCell>
                            <TableCell>
                              <TextInput
                                type="number"
                                min={0}
                                value={String(item.quantity)}
                                onValueChange={(v) =>
                                  updateItem(idx, { quantity: v })
                                }
                                className="w-24 font-bold text-larioja-azul"
                                placeholder="Actual"
                              />
                            </TableCell>
                          </>
                        )}
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={item.is_active}
                            onChange={(e) =>
                              updateItem(idx, { is_active: e.target.checked })
                            }
                            className="h-5 w-5 accent-larioja-azul"
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="light"
                            icon={Trash2}
                            size="xs"
                            color="red"
                            onClick={() =>
                              setItems((prev) => prev.filter((_, i) => i !== idx))
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Button
                variant="secondary"
                icon={Plus}
                className="mt-4"
                onClick={() =>
                  setItems((prev) => [
                    ...prev,
                    { label: "", color: "#012060", quantity: 1, is_active: true },
                  ])
                }
              >
                Agregar Segmento
              </Button>
            </>
          )}

          <div className="flex items-center justify-end gap-3 mt-6">
            {justSaved && (
              <span className="text-sm font-medium text-emerald-600">
                Segmentos guardados
              </span>
            )}
            <Button variant="secondary" onClick={onClose} disabled={loading}>
              {isCardsMode ? "Cerrar" : "Finalizar"}
            </Button>
            {!isCardsMode && (
              <Button
                onClick={handleSave}
                loading={loading}
                className="bg-larioja-azul"
              >
                Guardar Segmentos
              </Button>
            )}
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
