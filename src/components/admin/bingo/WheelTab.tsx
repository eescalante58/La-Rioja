"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import {
  Dices,
  Download,
  Plus,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  History,
  Monitor,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { callAction } from "@/lib/action-client";
import { redirectIfSessionExpired } from "@/lib/auth/sessionFeedback";
import WheelConfigDialog from "./WheelConfigDialog";
import WheelItemsDialog from "./WheelItemsDialog";
import type { Wheel, WheelItem, WheelSpin } from "./wheel-types";

interface Event {
  id: number;
  company_id: number;
  event_id: string;
  event_name: string;
}

interface WheelTabProps {
  events: Event[];
  /** Evento por defecto de la empresa (companies.def_dash_event_id). */
  defaultEvent?: Event | null;
}

const MODE_COLORS: Record<string, string> = {
  Premios: "amber",
  Cartones: "blue",
  Participantes: "emerald",
};

/**
 * Pestaña "Sorteos/Juegos" de Gestión de Bingo.
 * Permite crear/editar ruletas por evento (Premios, Cartones, Participantes),
 * administrar sus segmentos, publicarlas para proyección en /ruleta y
 * consultar el historial de giros.
 */
export default function WheelTab({ events, defaultEvent }: WheelTabProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [eventSelectValue, setEventSelectValue] = useState<string>("");
  const [wheels, setWheels] = useState<Wheel[]>([]);
  const [loading, setLoading] = useState(false);

  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [editingWheel, setEditingWheel] = useState<Wheel | null>(null);
  const [itemsWheel, setItemsWheel] = useState<Wheel | null>(null);
  const [isItemsOpen, setIsItemsOpen] = useState(false);
  const [historyWheel, setHistoryWheel] = useState<Wheel | null>(null);
  const [spins, setSpins] = useState<WheelSpin[]>([]);
  /** Error de la última carga del historial (null = sin error). */
  const [spinsError, setSpinsError] = useState<string | null>(null);
  /** Filtro por juego dentro del Historial General ("all" = todos). */
  const [historyGameFilter, setHistoryGameFilter] = useState<string>("all");
  /** Formato elegido para exportar el historial. */
  const [exportFormat, setExportFormat] = useState<"csv" | "pdf">("csv");
  const [exporting, setExporting] = useState(false);
  /**
   * Ref del historial abierto: permite que el listener Realtime sepa a qué
   * ruleta/evento recargar sin depender del closure del estado.
   */
  const historyWheelRef = useRef<Wheel | null>(null);
  useEffect(() => {
    historyWheelRef.current = historyWheel;
  }, [historyWheel]);

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
      const result = await callAction<{ data?: Wheel[] }>("bingo.getWheels", [
        ev.company_id,
        ev.event_id,
      ]);
      if (result?.data) {
        const wheelList = result.data;
        setWheels(wheelList);
        initialLoadDone.current = true;
        // Si el modal de segmentos está abierto, refrescamos su wheel.
        // Se usa update funcional para leer el estado actual, no el del closure.
        setItemsWheel((prev) =>
          prev
            ? (wheelList.find((w: Wheel) => w.id === prev.id) ?? prev)
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

  /**
   * Recarga el historial de giros de `wheel` (`wheel.id === null` → todos los
   * juegos del evento). Distingue "sin datos" de un error de la acción para
   * que el operador no vea un vacío silencioso (p. ej. sesión expirada).
   */
  const fetchSpins = useCallback(async (wheel: Wheel) => {
    const result = await callAction<{
      success?: boolean;
      data?: WheelSpin[];
      error?: string;
    }>("bingo.getWheelSpins", [wheel.company_id, wheel.event_id, wheel.id]);
    if (result?.data) {
      setSpins(result.data);
      setSpinsError(null);
    } else {
      setSpins([]);
      if (!redirectIfSessionExpired(result)) {
        setSpinsError(result?.error ?? "No se pudo cargar el historial.");
      }
    }
  }, []);

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
          const item = (isDelete ? payload.old : payload.new) as Partial<WheelItem>;
          if (!item?.id) return;

          /**
           * Aplica el cambio de un item sobre un wheel.
           * En DELETE se filtra por id en todas las ruletas porque
           * payload.old puede no incluir wheel_id (REPLICA IDENTITY).
           */
          const applyItemChange = (w: Wheel): Wheel => {
            const items = w.items || [];
            if (isDelete) {
              return { ...w, items: items.filter((it) => it.id !== item.id) };
            }
            if (w.id !== item.wheel_id) return w;
            const exists = items.some((it) => it.id === item.id);
            return {
              ...w,
              items: exists
                ? items.map((it) => (it.id === item.id ? ({ ...it, ...item } as WheelItem) : it))
                : [...items, item as WheelItem],
            };
          };

          // Actualización Atómica: modificamos estado local inmediatamente con el dato de Supabase
          setWheels(prevWheels => prevWheels.map(applyItemChange));
          // Si el modal de segmentos está abierto, sincronizamos su wheel también
          setItemsWheel((prev) => (prev ? applyItemChange(prev) : prev));
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
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "wheel_spins",
          filter: `company_id=eq.${selectedEvent.company_id}`,
        },
        (payload) => {
          console.log("[WheelTab] Nuevo giro en wheel_spins:", payload);
          /**
           * Si el diálogo de historial está abierto, lo refresca en vivo:
           * evita que quede "Sin giros registrados." para giros posteriores
           * a la apertura del diálogo.
           */
          const openWheel = historyWheelRef.current;
          if (openWheel) void fetchSpins(openWheel);
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

  /**
   * Aplica la selección de evento (manual o por defecto de la empresa):
   * limpia la lista y recarga las ruletas del evento.
   */
  const applyEventSelection = (val: string) => {
    const [cId, eId] = val.split("|");
    const ev = events.find(
      (e) => e.company_id === parseInt(cId) && e.event_id === eId,
    );
    setEventSelectValue(val);
    setSelectedEvent(ev || null);
    setWheels([]);
    initialLoadDone.current = false;
    if (ev) loadWheels(ev);
  };

  // Preselecciona el evento por defecto de la empresa al entrar a la pestaña.
  useEffect(() => {
    if (defaultEvent && !eventSelectValue) {
      applyEventSelection(`${defaultEvent.company_id}|${defaultEvent.event_id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultEvent]);

  const handleTogglePublish = async (wheel: Wheel) => {
    const result = await callAction<{ success?: boolean; error?: string }>(
      "bingo.toggleWheelPublished",
      [wheel.company_id, wheel.id, !wheel.published],
    );
    if (result?.success) {
      if (selectedEvent) loadWheels(selectedEvent);
    } else if (!redirectIfSessionExpired(result)) {
      alert("Error: " + (result?.error || "No se pudo cambiar la publicación."));
    }
  };

  const handleDelete = async (wheel: Wheel) => {
    if (
      !confirm(
        `¿Eliminar la ruleta "${wheel.wheel_name}"? Se borrarán sus segmentos e historial.`,
      )
    )
      return;
    const result = await callAction<{ success?: boolean; error?: string }>(
      "bingo.deleteWheelConfig",
      [wheel.company_id, wheel.id],
    );
    if (result?.success) {
      if (selectedEvent) loadWheels(selectedEvent);
    } else if (!redirectIfSessionExpired(result)) {
      alert("Error: " + (result?.error || "No se pudo eliminar la ruleta."));
    }
  };

  const handleShowHistory = (wheel: Wheel) => {
    setHistoryWheel(wheel);
    setSpins([]);
    setSpinsError(null);
    setHistoryGameFilter("all");
    void fetchSpins(wheel);
  };

  /**
   * Giros actualmente visibles en el diálogo de historial: respeta el
   * filtro por juego cuando el historial es del evento completo.
   */
  const filteredSpins =
    historyWheel?.id === null && historyGameFilter !== "all"
      ? spins.filter((s) => s.wheel_id === Number(historyGameFilter))
      : spins;

  /**
   * Exporta el historial visible (respeta el filtro por juego) al formato
   * elegido en `exportFormat`. En PDF agrega una fila de totales con el
   * número de ganadores.
   */
  const handleExportHistory = async () => {
    const rows = filteredSpins;
    if (rows.length === 0 || !historyWheel) return;
    setExporting(true);
    try {
      const includeGameCol = historyWheel.id === null;
      /** Nombre del juego mostrado como encabezado del archivo. */
      const gameLabel =
        historyWheel.id !== null
          ? historyWheel.wheel_name
          : historyGameFilter !== "all"
            ? (wheels.find((w) => w.id === Number(historyGameFilter))
                ?.wheel_name ?? "Juego seleccionado")
            : "Todos los juegos del evento";
      const slug = gameLabel
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
      const fileName = `historial_giros_${historyWheel.event_id}_${slug}`;

      if (exportFormat === "csv") {
        const csvCell = (v: unknown) =>
          `"${String(v ?? "").replace(/"/g, '""')}"`;
        const headers = [
          "Fecha",
          ...(includeGameCol ? ["Juego"] : []),
          "Ganador",
          "Premio",
          "Integridad",
        ];
        const metaLines = [
          `Evento,${csvCell(historyWheel.event_id)}`,
          `Juego,${csvCell(gameLabel)}`,
          "",
        ];
        const body = rows.map((s) =>
          [
            csvCell(new Date(s.spun_at).toLocaleString("es-SV")),
            ...(includeGameCol ? [csvCell(s.wheel_name)] : []),
            csvCell(s.winner_label),
            csvCell(s.prize_label ?? ""),
            csvCell(s.verification_hash ? "Verificado" : "Legacy"),
          ].join(","),
        );
        const csvContent =
          "data:text/csv;charset=utf-8,﻿" +
          [
            ...metaLines,
            headers.join(","),
            ...body,
            "",
            `Total ganadores,${rows.length}`,
          ].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent).replace(/#/g, "%23"));
        link.setAttribute("download", `${fileName}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        const [{ default: JsPDF }, autoTableModule] = await Promise.all([
          import("jspdf"),
          import("jspdf-autotable"),
        ]);
        const autoTable = autoTableModule.default;

        const doc = new JsPDF({ orientation: "landscape" });
        doc.setFontSize(14);
        doc.text(`Historial de giros — ${gameLabel}`, 14, 15);
        doc.setFontSize(10);
        doc.text(
          `Evento: ${historyWheel.event_id}   |   Ganadores: ${rows.length}`,
          14,
          22,
        );

        const colSpan = includeGameCol ? 5 : 4;
        autoTable(doc, {
          startY: 26,
          head: [
            [
              "Fecha",
              ...(includeGameCol ? ["Juego"] : []),
              "Ganador",
              "Premio",
              "Integridad",
            ],
          ],
          body: [
            ...rows.map((s) => [
              new Date(s.spun_at).toLocaleString("es-SV"),
              ...(includeGameCol ? [s.wheel_name] : []),
              s.winner_label,
              s.prize_label || "—",
              s.verification_hash ? "Verificado" : "Legacy",
            ]),
            [
              {
                content: `TOTAL GANADORES: ${rows.length}`,
                colSpan,
                styles: {
                  fontStyle: "bold",
                  fillColor: [1, 22, 64],
                  textColor: [255, 255, 255],
                  halign: "right",
                },
              },
            ],
          ],
          styles: { fontSize: 8 },
          headStyles: { fillColor: [1, 22, 64] },
        });

        doc.save(`${fileName}.pdf`);
      }
    } catch (error) {
      console.error("Error exportando historial de giros:", error);
      alert("Error al exportar el historial.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <Card className="mt-4 shadow-sm sm:shadow-md border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
          <div>
            <Title>Sorteos/Juegos por Evento</Title>
            <Text>
              Crea ruletas de Premios, Cartones o Participantes y publícalas
              para proyectarlas en /ruleta.
            </Text>
          </div>
          <div className="flex items-center gap-3">
            <Select
              placeholder="Selecciona un evento..."
              className="min-w-64"
              value={eventSelectValue}
              onValueChange={applyEventSelection}
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
              <div className="flex gap-2">
                <Button
                  size="xs"
                  variant="secondary"
                  icon={History}
                  onClick={() => {
                    // Cargar historial de TODO el evento
                    const dummyWheelForHistory: any = {
                      id: null,
                      wheel_name: "Todos los juegos del evento",
                      mode: "General",
                      company_id: selectedEvent.company_id,
                      event_id: selectedEvent.event_id,
                    };
                    handleShowHistory(dummyWheelForHistory);
                  }}
                >
                  Historial General
                </Button>
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
              </div>
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
                    <Text className="text-xs text-gray-400">
                      {wheel.is_automatic_rotation
                        ? `Automático · espera ${wheel.automatic_timeout_rotation ?? 0}s`
                        : "Giro manual"}
                    </Text>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge color={MODE_COLORS[wheel.mode] || "gray"} size="xs">
                      {wheel.mode}
                    </Badge>
                    {(wheel.mode === "Cartones" ||
                      wheel.mode === "Participantes") &&
                    (wheel.prizes_number ?? 0) > 0 ? (
                      <Badge
                        color={
                          (wheel.winners_count ?? 0) >= wheel.prizes_number
                            ? "red"
                            : "amber"
                        }
                        size="xs"
                        tooltip="Premios sorteados / límite de la ronda"
                      >
                        Premios: {wheel.winners_count ?? 0} de{" "}
                        {wheel.prizes_number}
                      </Badge>
                    ) : (
                      <Badge color="gray" size="xs">
                        {(wheel.prizes_number ?? 0) > 0
                          ? `Premios: ${wheel.prizes_number}`
                          : "Sin límite"}
                      </Badge>
                    )}
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
                  {wheel.mode !== "Premios" && (
                    <Button
                      size="xs"
                      variant="secondary"
                      icon={Monitor}
                      tooltip="Monitor de resultados de la tómbola"
                      onClick={() =>
                        window.open(`/tombola/monitor?id=${wheel.id}`, "_blank")
                      }
                    >
                      Monitorear
                    </Button>
                  )}
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
          <DialogPanel className="max-w-5xl w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <Title>Historial — {historyWheel?.wheel_name}</Title>
                <Badge color="blue">{historyWheel?.mode}</Badge>
              </div>
              <div className="flex items-center gap-2">
                {historyWheel?.id === null && (
                  <Select
                    className="min-w-64"
                    value={historyGameFilter}
                    onValueChange={setHistoryGameFilter}
                    placeholder="Filtrar por juego..."
                  >
                    <SelectItem value="all">Todos los juegos</SelectItem>
                    {wheels.map((w) => (
                      <SelectItem key={w.id} value={String(w.id)}>
                        {w.wheel_name}
                      </SelectItem>
                    ))}
                  </Select>
                )}
                <Select
                  className="w-24"
                  value={exportFormat}
                  onValueChange={(v) => setExportFormat(v as "csv" | "pdf")}
                >
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </Select>
                <Button
                  size="xs"
                  variant="secondary"
                  icon={Download}
                  tooltip="Exportar historial"
                  loading={exporting}
                  disabled={exporting || filteredSpins.length === 0}
                  onClick={() => void handleExportHistory()}
                />
                <Button
                  size="xs"
                  variant="secondary"
                  icon={RefreshCw}
                  tooltip="Recargar historial"
                  onClick={() =>
                    historyWheel && void fetchSpins(historyWheel)
                  }
                />
              </div>
            </div>
            <div className="max-h-[60vh] overflow-auto">
              {(() => {
                return spinsError ? (
                  <Text className="py-10 text-center text-red-500 italic">
                    {spinsError}
                  </Text>
                ) : filteredSpins.length === 0 ? (
                  <Text className="py-10 text-center text-gray-400 italic">
                    Sin giros registrados.
                  </Text>
                ) : (
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Fecha</TableHeaderCell>
                      {historyWheel?.id === null && (
                        <TableHeaderCell>Juego</TableHeaderCell>
                      )}
                      <TableHeaderCell>Ganador</TableHeaderCell>
                      <TableHeaderCell>Premio</TableHeaderCell>
                      <TableHeaderCell className="text-right">
                        Integridad
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredSpins.map((spin) => (
                      <TableRow key={spin.id}>
                        <TableCell>
                          {new Date(spin.spun_at).toLocaleString("es-SV")}
                        </TableCell>
                        {historyWheel?.id === null && (
                          <TableCell className="text-xs">
                            {spin.wheel_name}
                            <Badge size="xs" color={MODE_COLORS[spin.mode] || "gray"} className="ml-1.5 opacity-70">
                              {spin.mode}
                            </Badge>
                          </TableCell>
                        )}
                        <TableCell className="font-bold">
                          {spin.winner_label}
                        </TableCell>
                        <TableCell>{spin.prize_label || "—"}</TableCell>
                        <TableCell className="text-right">
                          {spin.verification_hash ? (
                            <Badge
                              color="emerald"
                              icon={ShieldCheck}
                              tooltip={spin.verification_hash}
                            >
                              Verificado
                            </Badge>
                          ) : (
                            <Badge color="gray" tooltip="Giro previo a la auditoría reforzada">
                              Legacy
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                );
              })()}
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
