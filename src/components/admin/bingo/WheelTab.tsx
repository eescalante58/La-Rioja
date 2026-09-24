"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  Title,
  Text,
  Button,
  Badge,
  Select,
  SelectItem,
  Dialog,
  DialogPanel,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from "@tremor/react";
import { Dices, Plus, Edit, Trash2, Eye, EyeOff, History } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getWheels,
  getWheelSpins,
  toggleWheelPublished,
  deleteWheelConfig,
} from "@/app/admin/bingo/wheel-actions";
import { redirectIfSessionExpired } from "@/lib/auth/sessionFeedback";
import WheelConfigDialog from "./WheelConfigDialog";
import WheelItemsDialog from "./WheelItemsDialog";

interface Event {
  id: number;
  company_id: number;
  event_id: string;
  event_name: string;
}

interface WheelTabProps {
  events: Event[];
}

const MODE_COLORS: Record<string, string> = {
  Premios: "amber",
  Cartones: "blue",
  Participantes: "emerald",
};

/**
 * Pestaña "Ruleta" de Gestión de Bingo.
 * Permite crear/editar ruletas por evento (Premios, Cartones, Participantes),
 * administrar sus segmentos, publicarlas para proyección en /ruleta y
 * consultar el historial de giros.
 */
export default function WheelTab({ events }: WheelTabProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [wheels, setWheels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editingWheel, setEditingWheel] = useState<any>(null);
  const [itemsWheel, setItemsWheel] = useState<any>(null);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [historyWheel, setHistoryWheel] = useState<any>(null);
  const [spins, setSpins] = useState<any[]>([]);

  const supabase = createClient();
  /**
   * Marca si ya se hizo la primera carga de ruletas del evento actual.
   * Se usa un ref porque loadWheels puede invocarse desde closures de
   * Realtime donde 'wheels' estaría obsoleto.
   */
  const initialLoadDone = useRef(false);

  const loadWheels = async (ev: Event) => {
    // Spinner global solo en la primera carga para evitar parpadeo con Realtime
    if (!initialLoadDone.current) setLoading(true);
    try {
      const result = await getWheels(ev.company_id, ev.event_id);
      if (result?.data) {
        setWheels(result.data);
        initialLoadDone.current = true;
        // Si el modal de segmentos está abierto, refrescamos su wheel.
        // Se usa update funcional para leer el estado actual, no el del closure.
        setItemsWheel((prev: any) =>
          prev
            ? (result.data.find((w: any) => w.id === prev.id) ?? prev)
            : prev,
        );
      } else {
        setWheels([]);
        initialLoadDone.current = true;
      }
    } finally {
      setLoading(false);
    }
  };

  // Real-time subscription for wheel items and configs
  useEffect(() => {
    if (!selectedEvent) return;

    const channelName = `realtime_wheel_admin_${selectedEvent.event_id}`;
    console.log(`[WheelTab] Conectando a Realtime: ${channelName}`);
    
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wheel_items",
          filter: `company_id=eq.${selectedEvent.company_id}`,
        },
        (payload) => {
          console.log("[WheelTab] Cambio detectado en wheel_items:", payload);
          const isDelete = payload.eventType === "DELETE";
          // En DELETE, payload.new está vacío: hay que leer payload.old
          const item = (isDelete ? payload.old : payload.new) as any;
          if (!item?.id) return;

          /**
           * Aplica el cambio de un item sobre un wheel.
           * En DELETE se filtra por id en todas las ruletas porque
           * payload.old puede no incluir wheel_id (REPLICA IDENTITY).
           */
          const applyItemChange = (w: any) => {
            const items = (w.items || []) as any[];
            if (isDelete) {
              return { ...w, items: items.filter((it: any) => it.id !== item.id) };
            }
            if (w.id !== item.wheel_id) return w;
            const exists = items.some((it: any) => it.id === item.id);
            return {
              ...w,
              items: exists
                ? items.map((it: any) => (it.id === item.id ? { ...it, ...item } : it))
                : [...items, item],
            };
          };

          // Actualización Atómica: modificamos estado local inmediatamente con el dato de Supabase
          setWheels(prevWheels => prevWheels.map(applyItemChange));
          // Si el modal de segmentos está abierto, sincronizamos su wheel también
          setItemsWheel((prev: any) => (prev ? applyItemChange(prev) : prev));
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wheel_configs",
          filter: `company_id=eq.${selectedEvent.company_id}`,
        },
        (payload) => {
          console.log("[WheelTab] Cambio detectado en wheel_configs:", payload);
          loadWheels(selectedEvent);
        }
      )
      .subscribe((status) => {
        console.log(`[WheelTab] Estado de suscripción: ${status}`);
      });

    return () => {
      console.log(`[WheelTab] Desconectando de Realtime: ${channelName}`);
      supabase.removeChannel(channel);
    };
  }, [selectedEvent?.event_id, selectedEvent?.company_id]);

  const handleTogglePublish = async (wheel: any) => {
    const result = await toggleWheelPublished(
      wheel.company_id,
      wheel.id,
      !wheel.published,
    );
    if (result?.success) {
      if (selectedEvent) loadWheels(selectedEvent);
    } else if (!redirectIfSessionExpired(result)) {
      alert("Error: " + (result?.error || "No se pudo cambiar la publicación."));
    }
  };

  const handleDelete = async (wheel: any) => {
    if (
      !confirm(
        `¿Eliminar la ruleta "${wheel.wheel_name}"? Se borrarán sus segmentos e historial.`,
      )
    )
      return;
    const result = await deleteWheelConfig(wheel.company_id, wheel.id);
    if (result?.success) {
      if (selectedEvent) loadWheels(selectedEvent);
    } else if (!redirectIfSessionExpired(result)) {
      alert("Error: " + (result?.error || "No se pudo eliminar la ruleta."));
    }
  };

  const handleShowHistory = async (wheel: any) => {
    setHistoryWheel(wheel);
    setSpins([]);
    const result = await getWheelSpins(
      wheel.company_id,
      wheel.event_id,
      wheel.id,
    );
    if (result?.data) setSpins(result.data);
  };

  return (
    <>
      <Card className="mt-4 shadow-sm sm:shadow-md border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div>
            <Title>Ruletas por Evento</Title>
            <Text>
              Crea ruletas de Premios, Cartones o Participantes y publícalas
              para proyectarlas en /ruleta.
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <Select
              placeholder="Selecciona un evento..."
              className="min-w-64"
              onValueChange={(val) => {
                const [cId, eId] = val.split("|");
                const ev = events.find(
                  (e) => e.company_id === parseInt(cId) && e.event_id === eId,
                );
                setSelectedEvent(ev || null);
                setWheels([]);
                initialLoadDone.current = false;
                if (ev) loadWheels(ev);
              }}
            >
              {events.map((ev) => (
                <SelectItem
                  key={`${ev.company_id}-${ev.event_id}`}
                  value={`${ev.company_id}|${ev.event_id}`}
                >
                  {ev.event_id} - {ev.event_name}
                </SelectItem>
              ))}
            </Select>
            {selectedEvent && (
              <Button
                icon={Plus}
                className="bg-larioja-azul"
                onClick={() => {
                  setEditingWheel(null);
                  setIsConfigOpen(true);
                }}
              >
                Nueva Ruleta
              </Button>
            )}
          </div>
        </div>

        {!selectedEvent ? (
          <div className="py-16 flex flex-col items-center gap-2 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
            <Dices size={48} className="text-gray-200" />
            <Text className="text-gray-400 italic">
              Selecciona un evento para gestionar sus ruletas.
            </Text>
          </div>
        ) : loading ? (
          <div className="py-16 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-larioja-azul mx-auto mb-4" />
            <Text>Cargando ruletas...</Text>
          </div>
        ) : wheels.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-2 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
            <Dices size={48} className="text-gray-200" />
            <Text className="text-gray-400 italic">
              Este evento no tiene ruletas. Crea la primera con "Nueva Ruleta".
            </Text>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {wheels.map((wheel) => (
              <Card
                key={wheel.id}
                className="bg-white dark:bg-black border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <Text className="font-bold text-larioja-azul">
                      {wheel.wheel_name}
                    </Text>
                    <Text className="text-xs text-gray-500">
                      {wheel.mode === "Cartones"
                        ? "Segmentos: cartones vendidos"
                        : `${(wheel.items || []).length} segmentos`}
                    </Text>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge color={MODE_COLORS[wheel.mode] || "gray"} size="xs">
                      {wheel.mode}
                    </Badge>
                    {wheel.published && (
                      <Badge color="emerald" size="xs">
                        Publicada
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    size="xs"
                    variant="secondary"
                    icon={Edit}
                    onClick={() => {
                      setItemsWheel(wheel);
                      setIsItemsOpen(true);
                    }}
                  >
                    {wheel.mode === "Cartones"
                      ? "Ver Segmentos"
                      : "Editar Segmentos"}
                  </Button>
                  <Button
                    size="xs"
                    variant="secondary"
                    tooltip="Editar nombre y tipo de la ruleta"
                    onClick={() => {
                      setEditingWheel(wheel);
                      setIsConfigOpen(true);
                    }}
                  >
                    Datos
                  </Button>
                  <Button
                    size="xs"
                    variant="secondary"
                    icon={wheel.published ? EyeOff : Eye}
                    tooltip={
                      wheel.published
                        ? "Ocultar de la página pública"
                        : "Publicar en /ruleta"
                    }
                    onClick={() => handleTogglePublish(wheel)}
                  >
                    {wheel.published ? "Ocultar" : "Publicar"}
                  </Button>
                  <Button
                    size="xs"
                    variant="light"
                    icon={History}
                    tooltip="Historial de giros"
                    onClick={() => handleShowHistory(wheel)}
                  />
                  <Button
                    size="xs"
                    variant="light"
                    color="red"
                    icon={Trash2}
                    tooltip="Eliminar ruleta"
                    onClick={() => handleDelete(wheel)}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      <WheelConfigDialog
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        companyId={selectedEvent?.company_id}
        eventId={selectedEvent?.event_id}
        wheel={editingWheel}
        onSuccess={() => selectedEvent && loadWheels(selectedEvent)}
      />

      <WheelItemsDialog
        isOpen={isItemsOpen}
        onClose={() => setIsItemsOpen(false)}
        wheel={itemsWheel}
        companyId={selectedEvent?.company_id}
        eventId={selectedEvent?.event_id}
        onSuccess={() => selectedEvent && loadWheels(selectedEvent)}
      />

      {/* Historial de giros */}
      <Dialog
        open={!!historyWheel}
        onClose={() => setHistoryWheel(null)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-[70]" />
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <Title>Historial — {historyWheel?.wheel_name}</Title>
              <Badge color="blue">{historyWheel?.mode}</Badge>
            </div>
            <div className="max-h-[55vh] overflow-y-auto">
              {spins.length === 0 ? (
                <Text className="py-10 text-center text-gray-400 italic">
                  Sin giros registrados.
                </Text>
              ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Fecha</TableHeaderCell>
                      <TableHeaderCell>Ganador</TableHeaderCell>
                      <TableHeaderCell>Premio</TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {spins.map((spin) => (
                      <TableRow key={spin.id}>
                        <TableCell>
                          {new Date(spin.spun_at).toLocaleString("es-SV")}
                        </TableCell>
                        <TableCell className="font-bold">
                          {spin.winner_label}
                        </TableCell>
                        <TableCell>{spin.prize_label || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
            <div className="flex justify-end mt-6">
              <Button variant="secondary" onClick={() => setHistoryWheel(null)}>
                Cerrar
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </>
  );
}
