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
import { Plus, Trash2, Ticket } from "lucide-react";
import {
  saveWheelItems,
  getSoldCards,
} from "@/app/admin/bingo/wheel-actions";
import { redirectIfSessionExpired } from "@/lib/auth/sessionFeedback";

interface WheelItemsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  wheel: any;
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
  const [soldCards, setSoldCards] = useState<number[] | null>(null);
  const [justSaved, setJustSaved] = useState(false);

  const isCardsMode = wheel?.mode === "Cartones";

  useEffect(() => {
    if (!isOpen || !wheel || !companyId || !eventId) return;

    if (isCardsMode) {
      setSoldCards(null);
      getSoldCards(companyId, eventId).then((res) => {
        if (res?.data) setSoldCards(res.data);
        else setSoldCards([]);
      });
      return;
    }

    setItems(
      (wheel.items || []).map((i: any) => ({
        label: i.label,
        color: i.color || "#012060",
        quantity: i.quantity ?? 1,
        initial_quantity: i.initial_quantity ?? i.quantity ?? 1,
        is_active: i.is_active ?? true,
      })),
    );
  }, [isOpen, wheel, isCardsMode, companyId, eventId]);

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
            <div className="py-6 text-center space-y-3">
              <Ticket size={40} className="mx-auto text-larioja-azul" />
              <Text>
                Los segmentos de esta ruleta se generan automáticamente con los
                cartones <span className="font-bold">vendidos</span> del evento.
              </Text>
              {soldCards === null ? (
                <Text className="text-gray-400">Contando cartones...</Text>
              ) : (
                <Badge size="lg" color="emerald">
                  {soldCards.length} cartones vendidos
                </Badge>
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
