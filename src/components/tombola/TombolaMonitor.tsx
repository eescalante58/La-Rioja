"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Maximize, Minimize, Ticket, Trophy, RefreshCcw } from "lucide-react";
import { getPublicTombolaData } from "@/app/admin/bingo/wheel-actions";
import { createClient } from "@/lib/supabase/client";

interface WheelSummary {
  id: number;
  company_id: number;
  event_id: string;
  event_name?: string;
  mode: string;
  wheel_name: string;
}

/** Config de la tómbola devuelta por getPublicTombolaData. */
interface TombolaConfig {
  id: number;
  wheel_name: string;
  event_id: string;
  event_name: string;
  mode: string;
  /** Duración del giro del tambor en segundos. */
  time_rotation: number;
}

interface TombolaMonitorProps {
  wheels: WheelSummary[];
  /** wheel_id recibido por ?id= para fijar la tómbola a monitorear. */
  initialWheelId: number | null;
}

/**
 * Monitor de resultados de la tómbola (/tombola/monitor?id=<wheel_id>).
 *
 * Herramienta del personal que anuncia los cartones ganadores en vivo:
 * muestra una bandeja con los números ganadores ordenados
 * descendentemente por número de cartón, cada uno con su posición
 * de sorteo (1°, 2°, ...). El último sorteado queda resaltado.
 *
 * Sincronización: Realtime directo a wheel_participating_cards
 * filtrado por wheel_id (los monitores son pocos clientes — no hay
 * riesgo de agotar conexiones como con el público de /tombola).
 * Refresco manual disponible como respaldo.
 */
export default function TombolaMonitor({
  wheels,
  initialWheelId,
}: TombolaMonitorProps) {
  const [selectedWheel, setSelectedWheel] = useState<WheelSummary | null>(() => {
    if (initialWheelId) {
      const match = wheels.find((w) => w.id === initialWheelId);
      if (match) return match;
    }
    return wheels.length === 1 ? wheels[0] : null;
  });
  const [tombConfig, setTombConfig] = useState<TombolaConfig | null>(null);
  const [participants, setParticipants] = useState<number[]>([]);
  const [winners, setWinners] = useState<number[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  /**
   * Lee la config y el estado actual de la tómbola (server action con
   * permiso público). Retorna la lista completa de ganadores en orden
   * de sorteo (updated_at), la posición de cada uno se deriva del índice.
   */
  const loadState = useCallback(async () => {
    if (!selectedWheel) return;
    try {
      const result = await getPublicTombolaData(selectedWheel.id);
      if (result?.data) {
        setTombConfig(result.data.config);
        setParticipants(result.data.participants);
        setWinners(result.data.winners);
        setLoadError(false);
      } else {
        setLoadError(true);
      }
    } catch {
      setLoadError(true);
    }
  }, [selectedWheel?.id]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadState();
    setRefreshing(false);
  };

  // Carga inicial / cambio de tómbola
  useEffect(() => {
    setParticipants([]);
    setWinners([]);
    setTombConfig(null);
    setLoadError(false);
    if (selectedWheel) loadState();
  }, [selectedWheel?.id]);

  // Realtime: cualquier cambio en los cartones de esta tómbola refetea
  // el estado completo (los ganadores nuevos ya vienen con is_winner).
  useEffect(() => {
    if (!selectedWheel) return;
    const supabase = createClient();
    const channelName = `tombola_monitor_${selectedWheel.id}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "wheel_participating_cards",
          filter: `wheel_id=eq.${selectedWheel.id}`,
        },
        () => {
          loadState();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedWheel?.id]);

  // Fullscreen para proyectar en pantalla del staff
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };
  useEffect(() => {
    const sync = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);

  /**
   * Posición de sorteo de cada cartón (1° = primero en salir).
   * `winners` llega ordenado por updated_at ascendente.
   */
  const drawPosition = useMemo(() => {
    const map = new Map<number, number>();
    winners.forEach((n, i) => map.set(n, i + 1));
    return map;
  }, [winners]);

  /** Bandeja: orden descendente por número de cartón (requisito del staff). */
  const sortedWinners = useMemo(
    () => [...winners].sort((a, b) => b - a),
    [winners],
  );

  const lastDrawn = winners.length > 0 ? winners[winners.length - 1] : null;
  const totalCards = participants.length + winners.length;

  // ── Selector de tómbola (mismo patrón que /tombola) ──
  if (!selectedWheel) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <h1 className="font-montserrat text-2xl font-black uppercase tracking-wider text-center text-white mb-8">
          Monitor de Tómbola
        </h1>
        <div className="grid gap-4">
          {wheels.map((wheel) => (
            <button
              key={wheel.id}
              onClick={() => setSelectedWheel(wheel)}
              className="flex items-center gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 hover:border-larioja-amarillo/40 transition-all text-left"
            >
              <Ticket size={28} className="text-larioja-amarillo shrink-0" />
              <div>
                <p className="font-bold text-white">{wheel.wheel_name}</p>
                <p className="text-sm text-white/50">
                  {wheel.event_name ?? wheel.event_id}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col gap-6">
      {/* Encabezado del monitor */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="La Rioja"
            className="h-10 md:h-12 w-auto hidden sm:block"
          />
          <div className="text-center sm:text-left">
            <h1 className="font-montserrat text-xl md:text-2xl font-black uppercase tracking-wider text-white">
              Monitor de <span className="text-larioja-amarillo">Tómbola</span>
            </h1>
            <p className="text-white/60 text-sm">
              {tombConfig?.wheel_name ?? selectedWheel.wheel_name}
              {(tombConfig?.event_name ?? selectedWheel.event_name) &&
                ` · ${tombConfig?.event_name ?? selectedWheel.event_name}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/80 text-sm font-bold">
            <Trophy size={14} className="inline-block mr-1.5 -mt-0.5 text-larioja-amarillo" />
            {winners.length} de {totalCards} sorteados
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/80 disabled:opacity-40"
            title="Actualizar resultados"
          >
            <RefreshCcw size={20} className={refreshing ? "animate-spin" : ""} />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white/80"
            title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>

      {/* Bandeja de ganadores (descendente por # de cartón) */}
      <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md p-6 md:p-8 min-h-[300px]">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-montserrat text-lg font-black uppercase tracking-wider text-white flex items-center gap-2">
            <Trophy size={20} className="text-larioja-amarillo" />
            Cartones Ganadores
          </h2>
          {loadError && (
            <p className="text-red-300 text-sm">
              Error al sincronizar — reintentando…
            </p>
          )}
        </div>

        {winners.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <Ticket size={48} className="text-white/15" />
            <p className="text-white/50 italic">
              Esperando el primer sorteo…
            </p>
            {totalCards > 0 && (
              <p className="text-white/30 text-sm">
                {totalCards} cartones en juego
              </p>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {sortedWinners.map((cardNumber) => {
              const isLast = cardNumber === lastDrawn;
              return (
                <div
                  key={cardNumber}
                  className={`relative rounded-2xl border p-5 md:p-6 flex flex-col items-center justify-center gap-1 transition-all ${
                    isLast
                      ? "bg-larioja-amarillo/15 border-larioja-amarillo ring-2 ring-larioja-amarillo/70 shadow-[0_0_30px_rgba(251,197,14,0.25)]"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <span
                    className={`absolute top-2.5 left-2.5 rounded-full px-2 py-0.5 text-xs font-black ${
                      isLast
                        ? "bg-larioja-amarillo text-black"
                        : "bg-white/15 text-white/70"
                    }`}
                  >
                    {drawPosition.get(cardNumber)}°
                  </span>
                  <span
                    className={`font-montserrat text-3xl md:text-4xl font-black tracking-tight ${
                      isLast ? "text-larioja-amarillo" : "text-white"
                    }`}
                  >
                    #{cardNumber}
                  </span>
                  {isLast && (
                    <span className="text-larioja-amarillo/80 text-[11px] font-bold uppercase tracking-widest">
                      Último sorteado
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
