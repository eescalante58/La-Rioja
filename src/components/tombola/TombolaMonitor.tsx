"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Maximize,
  Minimize,
  Ticket,
  Trophy,
  RefreshCcw,
  ClipboardList,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface WheelSummary {
  id: number;
  company_id: number;
  event_id: string;
  event_name?: string;
  mode: string;
  wheel_name: string;
}

/** Config de la tómbola devuelta por /api/tombola/winners. */
interface TombolaConfig {
  id: number;
  wheel_name: string;
  event_id: string;
  event_name: string;
  mode: string;
  /** Duración del giro del tambor en segundos. */
  time_rotation: number;
}

/** Ganador con los datos capturados por el staff (null si pendiente). */
interface WinnerInfo {
  cardNumber: number;
  wonAt: string;
  /** Posición del premio (1 = primer ganador); null antes de migrar. */
  winnerOrder: number | null;
  winnerName: string | null;
  winnerPrize: string | null;
  documentType: string | null;
  documentNumber: string | null;
  winnerPhoneNumber: string | null;
  registeredAt: string | null;
}

interface TombolaMonitorProps {
  wheels: WheelSummary[];
  /** wheel_id recibido por ?id= para fijar la tómbola a monitorear. */
  initialWheelId: number | null;
}

/** Tipos de documento ofrecidos en el formulario de captura. */
const DOCUMENT_TYPES = ["DUI", "Pasaporte", "NIT", "Carnet de Residente"];

const inputClass =
  "w-full rounded-lg bg-white/10 border border-white/15 px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-larioja-amarillo/60";

/**
 * Monitor de resultados de la tómbola (/tombola/monitor?id=<wheel_id>).
 *
 * Herramienta del staff que anuncia/registra ganadores en vivo:
 * - Formulario vertical para capturar datos del ganador (nombre, premio,
 *   documento, teléfono) sobre wheel_participating_cards — solo acepta
 *   cartones que ya salieron sorteados (validado también en el servidor).
 * - Bandeja de ganadores en ORDEN DE CAPTURA: primero los registrados
 *   (1°, 2°, ...), al final los pendientes de registrar.
 * - El último cartón sorteado queda resaltado en el encabezado.
 *
 * Sincronización: Realtime directo a wheel_participating_cards filtrado
 * por wheel_id (los monitores son pocos clientes — no hay riesgo de
 * agotar conexiones como con el público de /tombola).
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
  const [winners, setWinners] = useState<WinnerInfo[]>([]);
  const [loadError, setLoadError] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Formulario de captura ──
  const [formCard, setFormCard] = useState("");
  const [formName, setFormName] = useState("");
  const [formPrize, setFormPrize] = useState("");
  const [formDocType, setFormDocType] = useState("DUI");
  const [formDocNumber, setFormDocNumber] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [formMsg, setFormMsg] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  /**
   * Lee config + participantes + ganadores (con datos) de la tómbola.
   * Los ganadores llegan en orden de captura del servidor.
   */
  const loadState = useCallback(async () => {
    if (!selectedWheel) return;
    try {
      const res = await fetch(`/api/tombola/winners?id=${selectedWheel.id}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (json?.success) {
        setTombConfig(json.config);
        setParticipants(json.participants);
        setWinners(json.winners);
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
    setFormMsg(null);
    if (selectedWheel) loadState();
  }, [selectedWheel?.id]);

  // Realtime: cualquier cambio (nuevo ganador o registro de datos)
  // refetea el estado completo.
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

  /** Último cartón sorteado (mayor wonAt) para el resaltado. */
  const lastDrawn = useMemo(() => {
    if (winners.length === 0) return null;
    return winners.reduce((a, b) =>
      new Date(a.wonAt) > new Date(b.wonAt) ? a : b,
    ).cardNumber;
  }, [winners]);

  /** Panel: orden ascendente por número de cartón (requisito del staff). */
  const sortedWinners = useMemo(
    () => [...winners].sort((a, b) => a.cardNumber - b.cardNumber),
    [winners],
  );

  const totalCards = participants.length + winners.length;

  /**
   * Al elegir un cartón que ya tiene datos registrados, precarga el
   * formulario para permitir correcciones sin perder su posición.
   */
  const handleCardSelect = (value: string) => {
    setFormCard(value);
    setFormMsg(null);
    const num = parseInt(value);
    const existing = winners.find((w) => w.cardNumber === num);
    if (existing?.registeredAt) {
      setFormName(existing.winnerName ?? "");
      setFormPrize(existing.winnerPrize ?? "");
      setFormDocType(existing.documentType ?? "DUI");
      setFormDocNumber(existing.documentNumber ?? "");
      setFormPhone(existing.winnerPhoneNumber ?? "");
    }
  };

  /** Envía el registro del ganador al endpoint público validado. */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWheel || !formCard) return;
    setSaving(true);
    setFormMsg(null);
    try {
      const res = await fetch("/api/tombola/winners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          wheelId: selectedWheel.id,
          cardNumber: parseInt(formCard),
          winnerName: formName.trim(),
          winnerPrize: formPrize.trim() || null,
          documentType: formDocType,
          documentNumber: formDocNumber.trim(),
          winnerPhoneNumber: formPhone.trim(),
        }),
      });
      const json = await res.json();
      if (json?.success) {
        setFormMsg({ ok: true, text: `Cartón #${formCard} registrado.` });
        setFormCard("");
        setFormName("");
        setFormPrize("");
        setFormDocType("DUI");
        setFormDocNumber("");
        setFormPhone("");
        await loadState();
      } else {
        setFormMsg({
          ok: false,
          text: json?.error || "No se pudo registrar el ganador.",
        });
      }
    } catch {
      setFormMsg({ ok: false, text: "Error de conexión. Intenta de nuevo." });
    } finally {
      setSaving(false);
    }
  };

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
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-6">
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
          {lastDrawn !== null && (
            <div className="px-4 py-2 rounded-full bg-larioja-amarillo/15 border border-larioja-amarillo/60 text-larioja-amarillo text-sm font-black shadow-[0_0_20px_rgba(251,197,14,0.2)]">
              Último: <span className="text-lg">#{lastDrawn}</span>
            </div>
          )}
          <div className="px-4 py-2 rounded-full bg-white/10 border border-white/15 text-white/80 text-sm font-bold">
            <Trophy
              size={14}
              className="inline-block mr-1.5 -mt-0.5 text-larioja-amarillo"
            />
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
            title={
              isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"
            }
          >
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
        </div>
      </div>

      {/* Formulario de captura del ganador */}
      <form
        onSubmit={handleSubmit}
        className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md p-6 md:p-8"
      >
        <h2 className="font-montserrat text-lg font-black uppercase tracking-wider text-white flex items-center gap-2 mb-5">
          <ClipboardList size={20} className="text-larioja-amarillo" />
          Registrar Ganador
        </h2>
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
              Número de cartón *
            </label>
            <select
              value={formCard}
              onChange={(e) => handleCardSelect(e.target.value)}
              required
              className={`${inputClass} [&>option]:bg-[#0a1b45]`}
            >
              <option value="">Selecciona un cartón ganador…</option>
              {winners.map((w) => (
                <option key={w.cardNumber} value={w.cardNumber}>
                  #{w.cardNumber}
                  {w.registeredAt ? " (registrado)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
              Nombre del ganador *
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              required
              minLength={2}
              maxLength={120}
              placeholder="Nombre completo"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
              Premio
            </label>
            <input
              type="text"
              value={formPrize}
              onChange={(e) => setFormPrize(e.target.value)}
              maxLength={120}
              placeholder="Ej. Canasta navideña"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
                Tipo de documento
              </label>
              <select
                value={formDocType}
                onChange={(e) => setFormDocType(e.target.value)}
                className={`${inputClass} [&>option]:bg-[#0a1b45]`}
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
                Número de documento *
              </label>
              <input
                type="text"
                value={formDocNumber}
                onChange={(e) => setFormDocNumber(e.target.value)}
                required
                minLength={4}
                maxLength={30}
                placeholder="Ej. 01234567-8"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-white/50 mb-1.5">
              Número de teléfono *
            </label>
            <input
              type="tel"
              value={formPhone}
              onChange={(e) => setFormPhone(e.target.value)}
              required
              maxLength={20}
              placeholder="Ej. +503 7707 7805"
              className={inputClass}
            />
          </div>
          {formMsg && (
            <p
              className={`text-sm font-semibold ${
                formMsg.ok ? "text-emerald-300" : "text-red-300"
              }`}
            >
              {formMsg.text}
            </p>
          )}
          <button
            type="submit"
            disabled={saving || winners.length === 0}
            className="mt-1 w-full rounded-full bg-larioja-amarillo px-6 py-3 font-montserrat text-base font-black uppercase tracking-wider text-black hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? "Guardando…" : "Registrar ganador"}
          </button>
        </div>
      </form>

      {/* Bandeja de ganadores (orden de captura) */}
      <div className="rounded-3xl bg-white/5 border border-white/10 backdrop-blur-md p-6 md:p-8 min-h-[200px]">
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
            <p className="text-white/50 italic">Esperando el primer sorteo…</p>
            {totalCards > 0 && (
              <p className="text-white/30 text-sm">
                {totalCards} cartones en juego
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {sortedWinners.map((w, i) => {
              const isLast = w.cardNumber === lastDrawn;
              return (
                <div
                  key={w.cardNumber}
                  className={`flex items-center gap-4 rounded-xl border px-4 py-2.5 transition-all ${
                    isLast
                      ? "bg-larioja-amarillo/15 border-larioja-amarillo ring-1 ring-larioja-amarillo/60"
                      : "bg-white/5 border-white/10"
                  }`}
                >
                  <span
                    className={`w-10 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-black ${
                      isLast
                        ? "bg-larioja-amarillo text-black"
                        : "bg-white/15 text-white/70"
                    }`}
                  >
                    {w.winnerOrder ?? i + 1}°
                  </span>
                  <span
                    className={`font-montserrat text-lg md:text-xl font-black tracking-tight shrink-0 ${
                      isLast ? "text-larioja-amarillo" : "text-white"
                    }`}
                  >
                    #{w.cardNumber}
                  </span>
                  {w.registeredAt ? (
                    <div className="min-w-0 flex-1 flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm">
                      <span className="font-bold text-white truncate">
                        {w.winnerName}
                      </span>
                      {w.winnerPrize && (
                        <span className="text-larioja-amarillo/90 truncate">
                          {w.winnerPrize}
                        </span>
                      )}
                      <span className="text-white/50">
                        {w.documentType} {w.documentNumber}
                      </span>
                      <span className="text-white/50">
                        Tel. {w.winnerPhoneNumber}
                      </span>
                    </div>
                  ) : (
                    <span className="text-white/35 text-sm italic">
                      Pendiente de registrar
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
