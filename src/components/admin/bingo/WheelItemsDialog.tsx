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
import { Plus, Trash2, Ticket, Copy, Check, ExternalLink, Ban } from "lucide-react";
import { callAction } from "@/lib/action-client";
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
  /**
   * Segmentos sin premio (solo modo Premios): cantidad y texto único.
   * Al guardar se expanden a N wheel_items con is_prize=false que el
   * servidor intercala aleatoriamente sin adyacentes.
   */
  const [noPrizeCount, setNoPrizeCount] = useState<number>(0);
  const [noPrizeLabel, setNoPrizeLabel] = useState<string>("Sigue participando");
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

  /**
   * URL de la página pública de proyección correspondiente al modo:
   * Premios → /ruleta; Cartones y Participantes → /tombola.
   * Los params evento/nombre fijan esta ruleta puntual en la página.
   */
  const publicProjectionUrl = wheel
    ? wheel.mode === "Premios"
      ? `/ruleta?evento=${encodeURIComponent(eventId ?? "")}&tipo=${encodeURIComponent(wheel.mode)}&nombre=${encodeURIComponent(wheel.wheel_name)}`
      : `/tombola?evento=${encodeURIComponent(eventId ?? "")}&nombre=${encodeURIComponent(wheel.wheel_name)}`
    : "/ruleta";

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
    // Los segmentos sin premio (is_prize=false) no se editan en la tabla:
    // se administran por cantidad+texto en el bloque "Sin premio".
    const losers = currentItems.filter((i: WheelItem) => i.is_prize === false);
    setNoPrizeCount(losers.length);
    if (losers.length > 0) setNoPrizeLabel(losers[0].label);
    setItems(
      currentItems
        .filter((i: WheelItem) => i.is_prize !== false)
        .map((i: WheelItem) => ({
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

    const isPremios = wheel.mode === "Premios";
    const nLosers = isPremios ? Math.max(0, noPrizeCount) : 0;
    if (
      nLosers > items.length &&
      !window.confirm(
        `Hay ${nLosers} segmentos sin premio y solo ${items.length} con premio: algunos quedarán adyacentes (en el círculo hay un hueco por premio). ¿Continuar?`,
      )
    ) {
      return;
    }

    // Los segmentos sin premio se envían al final; el servidor los
    // intercala aleatoriamente en huecos distintos (sin adyacentes).
    const loserItems = Array.from({ length: nLosers }, () => ({
      label: noPrizeLabel.trim() || "Sigue participando",
      color: "#6b7280",
      quantity: 1,
      initial_quantity: 1,
      is_active: true,
      is_prize: false,
    }));

    setLoading(true);
    try {
      const result = await callAction<{ success?: boolean; error?: string }>(
        "bingo.saveWheelItems",
        [
          companyId,
          wheel.id,
          [
            ...items.map((it, idx) => ({
              label: it.label.trim(),
              color: it.color || null,
              quantity: Math.max(0, parseInt(String(it.quantity)) || 0),
              initial_quantity: Math.max(0, parseInt(String(it.initial_quantity ?? it.quantity)) || 0),
              position: idx + 1,
              is_active: it.is_active,
              is_prize: true,
            })),
            ...loserItems,
          ],
        ],
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
        <DialogPanel className="max-w-4xl w-full bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[98vh]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <Title>{wheel?.wheel_name}</Title>
              <div className="flex items-center gap-2 mt-1">
                <Badge size="xs" color="blue">{wheel?.mode}</Badge>
                <Text className="text-xs">Evento: {eventId}</Text>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {wheel?.mode === "Premios" && (
                <>
                  <div className="bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700 text-center">
                    <Text className="text-[9px] font-bold uppercase text-gray-400 leading-none mb-1">Inicial</Text>
                    <Text className="text-sm font-black text-gray-600 dark:text-gray-300 leading-none">{totalInitial}</Text>
                  </div>
                  <div className="bg-larioja-azul/5 dark:bg-larioja-azul/10 px-3 py-1.5 rounded-lg border border-larioja-azul/20 text-center">
                    <Text className="text-[9px] font-bold uppercase text-larioja-azul/60 leading-none mb-1">Actual</Text>
                    <Text className="text-sm font-black text-larioja-azul dark:text-blue-400 leading-none">{totalCurrent}</Text>
                  </div>
                </>
              )}
              <Button
                size="xs"
                variant="secondary"
                icon={ExternalLink}
                tooltip={
                  wheel?.mode === "Premios"
                    ? "Abrir la página de proyección /ruleta"
                    : "Abrir la página de proyección /tombola"
                }
                onClick={() => window.open(publicProjectionUrl, "_blank")}
              >
                {wheel?.mode === "Premios" ? "Ruleta" : "Tómbola"}
              </Button>
            </div>
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
              {wheel?.mode === "Premios" && (
                <div className="mb-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-2 shrink-0">
                      <Ban size={14} className="text-gray-400" />
                      <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                        Sin premio
                      </Text>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-[100px_1fr] gap-2 items-center">
                      <TextInput
                        type="number"
                        min={0}
                        placeholder="Cant."
                        value={String(noPrizeCount)}
                        onValueChange={(v) =>
                          setNoPrizeCount(Math.max(0, parseInt(v) || 0))
                        }
                      />
                      <TextInput
                        value={noPrizeLabel}
                        onValueChange={setNoPrizeLabel}
                        placeholder="Texto (ej: Sigue participando)"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="max-h-[70vh] overflow-y-auto pr-1 custom-scrollbar">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell className="py-2">Segmento</TableHeaderCell>
                      <TableHeaderCell className="py-2 text-center">Color</TableHeaderCell>
                      {wheel?.mode === "Premios" && (
                        <>
                          <TableHeaderCell className="py-2 text-center">Stock Base</TableHeaderCell>
                          <TableHeaderCell className="py-2 text-center">Actual</TableHeaderCell>
                        </>
                      )}
                      <TableHeaderCell className="py-2 text-center">Activo</TableHeaderCell>
                      <TableHeaderCell className="py-2 text-right">
                        Quitar
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {items.map((item, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="py-1 px-1">
                          <Textarea
                            value={item.label}
                            onValueChange={(v) => updateItem(idx, { label: v })}
                            placeholder="Ej: Giftcard&#10;$50"
                            rows={1}
                            className="min-w-[200px] text-xs"
                          />
                        </TableCell>
                        <TableCell className="py-1 px-1 text-center">
                          <div className="flex justify-center">
                            <input
                              type="color"
                              value={item.color}
                              onChange={(e) =>
                                updateItem(idx, { color: e.target.value })
                              }
                              className="h-8 w-10 cursor-pointer rounded border border-gray-200"
                              title="Color del segmento"
                            />
                          </div>
                        </TableCell>
                        {wheel?.mode === "Premios" && (
                          <>
                            <TableCell className="py-1 px-1">
                              <TextInput
                                type="number"
                                min={0}
                                value={String(item.initial_quantity ?? item.quantity)}
                                onValueChange={(v) => {
                                  const val = parseInt(v) || 0;
                                  updateItem(idx, { 
                                    initial_quantity: val,
                                    quantity: item.label === "" ? val : item.quantity 
                                  });
                                }}
                                className="w-16 mx-auto text-xs"
                                placeholder="Base"
                              />
                            </TableCell>
                            <TableCell className="py-1 px-1">
                              <TextInput
                                type="number"
                                min={0}
                                value={String(item.quantity)}
                                onValueChange={(v) =>
                                  updateItem(idx, { quantity: v })
                                }
                                className="w-16 mx-auto font-bold text-larioja-azul text-xs"
                                placeholder="Actual"
                              />
                            </TableCell>
                          </>
                        )}
                        <TableCell className="py-1 px-1 text-center">
                          <input
                            type="checkbox"
                            checked={item.is_active}
                            onChange={(e) =>
                              updateItem(idx, { is_active: e.target.checked })
                            }
                            className="h-4 w-4 accent-larioja-azul"
                          />
                        </TableCell>
                        <TableCell className="py-1 px-1 text-right">
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
