"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Dices, Ticket, Maximize, Minimize, Volume2, VolumeX } from "lucide-react";
import confetti from "canvas-confetti";
import { getPublicTombolaData } from "@/app/admin/bingo/wheel-actions";

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
  /** true = la tómbola agenda los giros sin intervención manual. */
  is_automatic_rotation?: boolean;
  /** Segundos de espera entre giros automáticos. */
  automatic_timeout_rotation?: number;
  /** Máximo de premios/ganadores configurados; 0 = sin límite. */
  prizes_number?: number;
}

interface TombolaProps {
  wheels: WheelSummary[];
  /** URL de la imagen de la tarjeta voladora (desde site_content). */
  cardImageUrl: string;
}

/** Tarjeta voladora en tránsito (de la tómbola a la galería). */
interface FlyingCard {
  cardNumber: number;
  from: { x: number; y: number };
  to: { x: number; y: number };
  launched: boolean;
}

/**
 * Posiciones fijas (% dentro del tambor) para las balotas numeradas.
 * Cluster disperso tipo tómbola física; cada balota muestra un cartón real.
 */
const BALL_SLOTS: { x: number; y: number }[] = [
  { x: 32, y: 28 }, { x: 55, y: 24 }, { x: 70, y: 36 },
  { x: 24, y: 44 }, { x: 45, y: 40 }, { x: 63, y: 52 },
  { x: 78, y: 56 }, { x: 33, y: 62 }, { x: 53, y: 66 },
  { x: 72, y: 72 }, { x: 22, y: 60 }, { x: 44, y: 52 },
  { x: 60, y: 38 }, { x: 38, y: 74 },
];

/**
 * Tómbola virtual de cartones (proyección pública /tombola).
 *
 * - Izquierda: tambor giratorio (CSS 3D) + botón "Girar Tómbola".
 *   El giro dura wheel.time_rotation segundos.
 * - Derecha: galería de ganadores en filas de 4, con el número encima.
 * - El ganador lo decide el servidor (/api/tombola/spin, randomInt
 *   criptográfico + UPDATE atómico). El cliente solo anima y muestra.
 * - Espectadores: sincronizan por polling a /api/tombola/state (CDN ~2s)
 *   para soportar 1000+ clientes sin agotar conexiones Realtime.
 */
export default function Tombola({ wheels, cardImageUrl }: TombolaProps) {
  const [selectedWheel, setSelectedWheel] = useState<WheelSummary | null>(
    wheels.length === 1 ? wheels[0] : null,
  );
  const [tombConfig, setTombConfig] = useState<TombolaConfig | null>(null);
  const [participants, setParticipants] = useState<number[]>([]);
  const [winners, setWinners] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [drumAngle, setDrumAngle] = useState(0);
  const [currentBall, setCurrentBall] = useState<number | null>(null);
  const [winnerReveal, setWinnerReveal] = useState<number | null>(null);
  const [lastWinner, setLastWinner] = useState<number | null>(null);
  const [ballSample, setBallSample] = useState<number[]>([]);
  const [flyingCard, setFlyingCard] = useState<FlyingCard | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [autoCountdown, setAutoCountdown] = useState<number | null>(null);
  /** El servidor ya informó que el cupo de premios está completo. */
  const [drawFinished, setDrawFinished] = useState(false);
  /** El operador inició el ciclo automático. */
  const [autoRunning, setAutoRunning] = useState(false);

  const drumRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);
  const suspenseAudio = useRef<HTMLAudioElement | null>(null);
  const winAudio = useRef<HTMLAudioElement | null>(null);
  const confettiInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  // true cuando ESTE cliente giró (el resultado llega por la respuesta del POST,
  // no por polling — así el operador no depende del caché del CDN)
  const operatorSpin = useRef(false);

  const prizesNumber = tombConfig?.prizes_number ?? 0;
  const prizeLimitReached =
    drawFinished || (prizesNumber > 0 && winners.length >= prizesNumber);
  const isAutomaticRotation = tombConfig?.is_automatic_rotation ?? false;
  const automaticTimeout = Math.max(0, tombConfig?.automatic_timeout_rotation ?? 5);

  // ── Audio ──────────────────────────────────────────────────────────────
  useEffect(() => {
    suspenseAudio.current = new Audio("/sounds/suspense.wav");
    winAudio.current = new Audio("/sounds/win.wav");
    suspenseAudio.current.load();
    winAudio.current.load();
  }, []);

  useEffect(() => {
    if (suspenseAudio.current) suspenseAudio.current.muted = isMuted;
    if (winAudio.current) winAudio.current.muted = isMuted;
  }, [isMuted]);

  // ── Fullscreen ─────────────────────────────────────────────────────────
  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }, []);

  // ── Confeti continuo mientras la tarjeta ganadora se muestra ───────────
  const stopConfetti = useCallback(() => {
    if (confettiInterval.current) {
      clearInterval(confettiInterval.current);
      confettiInterval.current = null;
    }
  }, []);

  const fireConfetti = useCallback(() => {
    stopConfetti();
    const defaults = { startVelocity: 35, spread: 360, ticks: 60, zIndex: 100 };
    const randomInRange = (min: number, max: number) =>
      Math.random() * (max - min) + min;

    confettiInterval.current = setInterval(() => {
      confetti({
        ...defaults,
        particleCount: 20,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#012060", "#F0B429", "#ffffff"],
      });
      confetti({
        ...defaults,
        particleCount: 20,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#1E9922", "#F0B429", "#ffffff"],
      });
    }, 300);
    // La lluvia dura ~4s como celebración de cada ganador
    setTimeout(stopConfetti, 4000);
  }, [stopConfetti]);

  useEffect(
    () => () => {
      stopConfetti();
      if (pollInterval.current) clearInterval(pollInterval.current);
      if (tickInterval.current) clearInterval(tickInterval.current);
    },
    [stopConfetti],
  );

  // ── Carga inicial del estado de la tómbola ─────────────────────────────
  useEffect(() => {
    if (!selectedWheel) return;
    setLoading(true);
    setParticipants([]);
    setWinners([]);
    setDrawFinished(false);
    setAutoRunning(false);
    setDrumAngle(0);
    setCurrentBall(null);
    getPublicTombolaData(selectedWheel.id).then((res) => {
      if (res?.data) {
        setTombConfig(res.data.config);
        setParticipants(res.data.participants);
        setWinners(res.data.winners);
        setLastWinner(res.data.winners.at(-1) ?? null);
      }
      setLoading(false);
    });
  }, [selectedWheel]);

  // ── Polling para espectadores (CDN-cached, escala a 1000+ clientes) ────
  useEffect(() => {
    if (!selectedWheel) return;

    pollInterval.current = setInterval(async () => {
      // No interferir con un giro en curso de este cliente
      if (spinning || operatorSpin.current) return;
      try {
        const res = await fetch(`/api/tombola/state?id=${selectedWheel.id}`);
        const data = await res.json();
        if (data?.success) {
          setParticipants(data.participants);
          setWinners(data.winners);
          setLastWinner(data.winners.at(-1) ?? null);
          setDrawFinished(Boolean(data.finished));
          setTombConfig((prev) =>
            prev
              ? {
                  ...prev,
                  time_rotation: data.timeRotation ?? prev.time_rotation,
                  is_automatic_rotation:
                    data.isAutomaticRotation ?? prev.is_automatic_rotation,
                  automatic_timeout_rotation:
                    data.automaticTimeoutRotation ??
                    prev.automatic_timeout_rotation,
                  prizes_number: data.prizesNumber ?? prev.prizes_number,
                }
              : prev,
          );
        }
      } catch {
        // polling silencioso: si falla una pasada, reintenta la siguiente
      }
    }, 4000);

    return () => {
      if (pollInterval.current) clearInterval(pollInterval.current);
    };
  }, [selectedWheel?.id, spinning]);

  // ── Balotas del tambor ──────────────────────────────────────────────────
  // En reposo: muestra estable (muestra espaciada de participantes).
  // Durante el giro: el ticker las re-muestrea a números aleatorios.
  useEffect(() => {
    if (spinning) return;
    if (participants.length === 0) {
      setBallSample([]);
      return;
    }
    const step = Math.max(1, Math.floor(participants.length / BALL_SLOTS.length));
    setBallSample(
      Array.from(
        { length: Math.min(BALL_SLOTS.length, participants.length) },
        (_, i) => participants[i * step],
      ),
    );
  }, [participants, spinning]);

  // ── Balotas aleatorias durante el giro ─────────────────────────────────
  const startBallTicker = useCallback(() => {
    tickInterval.current = setInterval(() => {
      setParticipants((prev) => {
        if (prev.length > 0) {
          setCurrentBall(prev[Math.floor(Math.random() * prev.length)]);
          setBallSample(
            Array.from(
              { length: Math.min(BALL_SLOTS.length, prev.length) },
              () => prev[Math.floor(Math.random() * prev.length)],
            ),
          );
        }
        return prev;
      });
    }, 120);
  }, []);

  const stopBallTicker = useCallback(() => {
    if (tickInterval.current) {
      clearInterval(tickInterval.current);
      tickInterval.current = null;
    }
  }, []);

  // ── Giro de la tómbola ─────────────────────────────────────────────────
  /**
   * Ejecuta un ciclo completo del sorteo y no libera `spinning` hasta que la
   * tarjeta ganadora aterrizó en la galería. Así el modo automático respeta
   * exactamente la espera configurada entre premios.
   */
  const runSpin = useCallback(async () => {
    if (spinning || !selectedWheel || participants.length === 0 || prizeLimitReached) return;

    const rotationSec = tombConfig?.time_rotation || 5;
    operatorSpin.current = true;
    setSpinning(true);

    if (suspenseAudio.current) {
      suspenseAudio.current.currentTime = 0;
      suspenseAudio.current.play().catch(() => {});
    }

    // Tambor girando N vueltas rápidas + balotas aleatorias
    setDrumAngle((prev) => prev + 360 * Math.max(3, Math.floor(rotationSec)));
    startBallTicker();

    try {
      // El ganador lo decide el servidor — la petición sale YA para 0 latencia
      const res = await fetch(`/api/tombola/spin?id=${selectedWheel.id}`, {
        method: "POST",
      });
      const result = await res.json();

      if (!result?.success) {
        if (result?.finished) {
          setDrawFinished(true);
          setSpinning(false);
          operatorSpin.current = false;
          stopBallTicker();
          setCurrentBall(null);
          if (suspenseAudio.current) suspenseAudio.current.pause();
          return;
        }
        throw new Error(result?.error || "Error en el sorteo");
      }

      // Esperar a que termine la animación del tambor (time_rotation)
      await new Promise((r) => setTimeout(r, rotationSec * 1000));

      stopBallTicker();
      setCurrentBall(result.winnerCardNumber);
      setWinnerReveal(result.winnerCardNumber);
      setLastWinner(result.winnerCardNumber);

      if (suspenseAudio.current) suspenseAudio.current.pause();
      if (winAudio.current) {
        winAudio.current.currentTime = 0;
        winAudio.current.play().catch(() => {});
      }
      fireConfetti();

      // El número ganador se muestra primero en un círculo grande 2s,
      // luego se suelta la tarjeta voladora hacia la galería.
      await new Promise((r) => setTimeout(r, 2000));
      setWinnerReveal(null);

      // Tarjeta voladora: de la tómbola a la galería
      const drumRect = drumRef.current?.getBoundingClientRect();
      const galleryRect = galleryRef.current?.getBoundingClientRect();
      if (drumRect && galleryRect) {
        const flying: FlyingCard = {
          cardNumber: result.winnerCardNumber,
          from: {
            x: drumRect.left + drumRect.width / 2 - 40,
            y: drumRect.top + drumRect.height / 2 - 55,
          },
          to: {
            x: galleryRect.left + 20,
            y: galleryRect.top + 20,
          },
          launched: false,
        };
        setFlyingCard(flying);
        // Doble rAF: primero montamos en 'from', luego transicionamos a 'to'
        requestAnimationFrame(() =>
          requestAnimationFrame(() =>
            setFlyingCard((f) => (f ? { ...f, launched: true } : f)),
          ),
        );
      }

      // Al aterrizar: agregar a la galería y quitar de participantes.
      // Esperamos la animación completa antes de habilitar el siguiente giro.
      await new Promise((r) => setTimeout(r, 1200));
      setWinners((prev) => [...prev, result.winnerCardNumber]);
      setParticipants((prev) =>
        prev.filter((c) => c !== result.winnerCardNumber),
      );
      setFlyingCard(null);
      setCurrentBall(null);
    } catch (error: unknown) {
      console.error("Error spinning tombola:", error);
      alert(error instanceof Error ? error.message : "Error al girar la tómbola.");
      stopBallTicker();
      setCurrentBall(null);
      setWinnerReveal(null);
      if (suspenseAudio.current) suspenseAudio.current.pause();
    } finally {
      setSpinning(false);
      operatorSpin.current = false;
    }
  }, [
    spinning,
    selectedWheel,
    participants.length,
    prizeLimitReached,
    tombConfig?.time_rotation,
    startBallTicker,
    stopBallTicker,
    fireConfetti,
  ]);

  const runSpinRef = useRef(runSpin);
  useEffect(() => {
    runSpinRef.current = runSpin;
  }, [runSpin]);

  /** Giro manual: disponible solo cuando la tómbola no está automatizada. */
  const handleSpin = useCallback(() => {
    if (isAutomaticRotation || prizeLimitReached) return;
    void runSpin();
  }, [isAutomaticRotation, prizeLimitReached, runSpin]);

  /**
   * Inicia el modo automático con un giro inmediato; los giros siguientes
   * esperan automatic_timeout_rotation segundos.
   */
  const handleStartAutomatic = useCallback(() => {
    setAutoRunning(true);
    void runSpin();
  }, [runSpin]);

  // Detiene el estado operativo cuando ya no hay giros disponibles.
  useEffect(() => {
    if (prizeLimitReached || participants.length === 0) setAutoRunning(false);
  }, [prizeLimitReached, participants.length]);

  // Programa el siguiente giro cuando la tómbola está en modo automático.
  useEffect(() => {
    if (
      !isAutomaticRotation ||
      !autoRunning ||
      !selectedWheel ||
      loading ||
      spinning ||
      prizeLimitReached ||
      participants.length === 0
    ) {
      setAutoCountdown(null);
      return;
    }

    const startedAt = Date.now();
    setAutoCountdown(automaticTimeout);
    const countdown = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000);
      setAutoCountdown(Math.max(0, automaticTimeout - elapsed));
    }, 250);

    const timer = window.setTimeout(
      () => void runSpinRef.current(),
      automaticTimeout * 1000,
    );

    return () => {
      window.clearInterval(countdown);
      window.clearTimeout(timer);
      setAutoCountdown(null);
    };
  }, [
    isAutomaticRotation,
    autoRunning,
    selectedWheel,
    loading,
    spinning,
    prizeLimitReached,
    participants.length,
    automaticTimeout,
  ]);

  // ── Selector cuando hay varias tómbolas publicadas ─────────────────────
  if (!selectedWheel) {
    return (
      <div className="flex flex-col items-center gap-6 py-20">
        <Dices size={56} className="text-larioja-amarillo" />
        <h2 className="font-montserrat text-2xl font-black uppercase tracking-wider text-white">
          Selecciona una Tómbola
        </h2>
        <div className="flex flex-wrap justify-center gap-4 max-w-3xl">
          {wheels.map((w) => (
            <button
              key={w.id}
              onClick={() => setSelectedWheel(w)}
              className="rounded-2xl border-2 border-larioja-amarillo/60 bg-white/5 px-8 py-5 text-left backdrop-blur transition-all hover:scale-105 hover:border-larioja-amarillo hover:bg-white/10"
            >
              <p className="font-montserrat text-xs font-bold uppercase tracking-widest text-larioja-amarillo">
                {w.mode}
              </p>
              <p className="mt-1 text-lg font-bold text-white">{w.wheel_name}</p>
              <p className="text-xs text-white/50">{w.event_name || w.event_id}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 relative w-full max-w-[1600px] mx-auto px-4">
      {/* Animaciones CSS de la tómbola */}
      <style jsx global>{`
        @keyframes drum-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ball-tumble {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          25% { transform: translate(10px, -16px) rotate(8deg); }
          50% { transform: translate(-12px, 8px) rotate(-6deg); }
          75% { transform: translate(8px, 14px) rotate(10deg); }
        }
        @keyframes ball-float {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(3px, -7px); }
        }
        @keyframes winner-pop {
          0% { transform: scale(0.3); opacity: 0; }
          60% { transform: scale(1.15); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes winner-reveal {
          0% { transform: scale(0.2); opacity: 0; }
          55% { transform: scale(1.12); opacity: 1; }
          75% { transform: scale(0.97); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes winner-glow {
          0%, 100% { box-shadow: 0 0 60px rgba(240,180,41,0.55); }
          50% { box-shadow: 0 0 110px rgba(240,180,41,0.9); }
        }
        .tombola-drum {
          transition: transform 1s cubic-bezier(0.2, 0.8, 0.3, 1);
        }
        .tombola-ball {
          animation: ball-tumble 0.8s ease-in-out infinite;
        }
        .tombola-ball-idle {
          animation: ball-float 4s ease-in-out infinite;
        }
        .winner-card-in {
          animation: winner-pop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .winner-reveal {
          animation:
            winner-reveal 0.6s cubic-bezier(0.34, 1.56, 0.64, 1),
            winner-glow 1.1s ease-in-out 0.6s infinite;
        }
      `}</style>

      {/* Controles flotantes */}
      <div className="fixed top-24 right-6 z-[120] flex flex-col gap-3">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className="p-3 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/10 shadow-xl"
          title={isMuted ? "Activar sonido" : "Silenciar"}
        >
          {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
        </button>
        <button
          onClick={toggleFullscreen}
          className="p-3 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/10 shadow-xl"
          title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
        >
          {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
        </button>
      </div>

      {/* Encabezado */}
      <div className="text-center w-full">
        <div className="mb-1 flex items-center justify-center gap-3">
          <img src="/logo.png" alt="La Rioja" className="h-10 w-auto md:h-12" />
          <h1 className="font-montserrat text-xl font-black uppercase tracking-[0.15em] text-white md:text-3xl">
            Tómbola <span className="text-larioja-amarillo">Electrónica</span>
          </h1>
        </div>
        <p className="font-montserrat text-lg font-bold uppercase tracking-[0.3em] text-larioja-amarillo">
          {selectedWheel.event_name || selectedWheel.event_id}
        </p>
        <h2 className="mt-0 font-montserrat text-lg font-black uppercase tracking-wide text-white md:text-2xl">
          {selectedWheel.wheel_name}
        </h2>
        {participants.length > 0 && (
          <p className="mt-1 font-montserrat text-sm font-bold uppercase tracking-widest text-white/70">
            Cartones en juego:{" "}
            <span className="text-larioja-amarillo">{participants.length}</span>
          </p>
        )}
        {prizesNumber > 0 && (
          <p className="mt-1 font-montserrat text-xs font-bold uppercase tracking-widest text-white/60">
            Premios sorteados:{" "}
            <span className="text-larioja-amarillo">
              {Math.min(winners.length, prizesNumber)} de {prizesNumber}
            </span>
            {isAutomaticRotation && " · Giro automático"}
          </p>
        )}
        {wheels.length > 1 && (
          <button
            onClick={() => setSelectedWheel(null)}
            className="mt-1 text-[10px] font-bold uppercase tracking-widest text-white/40 underline underline-offset-4 hover:text-white"
          >
            Cambiar de tómbola
          </button>
        )}
      </div>

      {/* Layout principal: Tómbola izquierda + Galería derecha */}
      <div className="flex flex-col lg:flex-row items-start justify-center gap-10 lg:gap-16 w-full">
        {/* ── Izquierda: Tambor + botón ─────────────────────────────── */}
        <div className="flex flex-col items-center gap-6 shrink-0 mx-auto lg:mx-0">
          {/* Card contenedora del tambor */}
          <div className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md md:p-10">
            <div
              ref={drumRef}
              className="relative flex items-center justify-center"
            >
            {/* Tambor */}
            <div
              className="tombola-drum relative flex items-center justify-center rounded-full border-[10px] border-larioja-verde shadow-[inset_0_0_60px_rgba(0,0,0,0.6),0_20px_50px_rgba(0,0,0,0.5)] h-[280px] w-[280px] md:h-[400px] md:w-[400px]"
              style={{
                transform: `rotate(${drumAngle}deg)`,
                background:
                  "radial-gradient(circle at 50% 40%, #141b2e 0%, #05070d 100%)",
              }}
            >
              {/* Guía circular punteada (decorativa): sugiere el límite
                  donde caen las balotas */}
              <div className="pointer-events-none absolute inset-[14%] rounded-full border-2 border-dashed border-white/15" />
              {/* Balotas numeradas: cartones participantes reales. Orbitan
                  con el tambor y contra-rotan para que el número quede
                  derecho; durante el giro re-muestrean números al azar. */}
              {ballSample.map((num, i) => {
                const pos = BALL_SLOTS[i];
                const behind = i % 3 === 2; // cada 3ra balota al fondo
                return (
                  <div
                    key={`${i}-${num}`}
                    className="tombola-drum absolute"
                    style={{
                      top: `${pos.y}%`,
                      left: `${pos.x}%`,
                      transform: `translate(-50%, -50%) rotate(${-drumAngle}deg)`,
                    }}
                  >
                    <div
                      className={`flex items-center justify-center rounded-full bg-white font-montserrat font-black text-larioja-azul border border-gray-200 shadow-md ${
                        spinning ? "tombola-ball" : "tombola-ball-idle"
                      } ${
                        behind
                          ? "h-7 w-7 text-[9px] opacity-55 md:h-9 md:w-9 md:text-xs"
                          : "h-9 w-9 text-[11px] md:h-12 md:w-12 md:text-sm"
                      }`}
                      style={{
                        animationDelay: `${(i * 0.17) % 1}s`,
                        animationDuration: spinning
                          ? `${0.6 + (i % 4) * 0.12}s`
                          : `${3 + (i % 5) * 0.7}s`,
                      }}
                    >
                      {num}
                    </div>
                  </div>
                );
              })}
              {/* Balota central: número actual durante el giro / ganador */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  className={`flex items-center justify-center rounded-full bg-white shadow-2xl transition-all ${
                    currentBall !== null
                      ? "h-24 w-24 md:h-32 md:w-32 winner-card-in"
                      : "h-16 w-16 md:h-20 md:w-20 opacity-30"
                  }`}
                  style={{ transform: `rotate(${-drumAngle}deg)` }}
                >
                  <span className="font-montserrat text-xl md:text-3xl font-black text-larioja-azul">
                    {currentBall !== null ? `#${currentBall}` : "?"}
                  </span>
                </div>
              </div>
            </div>

            {/* Círculo grande del ganador: se muestra 2s antes de soltar
                la tarjeta voladora. Fuera del tambor rotatorio → derecho. */}
            {winnerReveal !== null && (
              <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
                <div className="winner-reveal flex h-56 w-56 items-center justify-center rounded-full border-8 border-larioja-amarillo bg-white md:h-80 md:w-80">
                  <div className="flex flex-col items-center">
                    <span className="font-montserrat text-xs font-bold uppercase tracking-[0.3em] text-gray-400 md:text-sm">
                      Ganador
                    </span>
                    <span className="font-montserrat text-6xl font-black leading-none text-larioja-azul md:text-8xl">
                      #{winnerReveal}
                    </span>
                  </div>
                </div>
              </div>
            )}
            </div>
          </div>

          {/* Controles del giro manual o ciclo automático */}
          {isAutomaticRotation ? (
            <div className="flex flex-col items-center gap-3">
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleStartAutomatic}
                  disabled={autoRunning || spinning || loading || prizeLimitReached || participants.length === 0}
                  className={`rounded-full px-8 py-3 font-montserrat text-xs font-bold uppercase tracking-[0.18em] transition-all shadow-xl ${
                    autoRunning || spinning || loading || prizeLimitReached || participants.length === 0
                      ? "bg-white/10 text-white/30 cursor-not-allowed"
                      : "bg-larioja-verde text-white hover:scale-105 active:scale-95"
                  }`}
                >
                  Iniciar Juego
                </button>
                <button
                  type="button"
                  onClick={() => setAutoRunning(false)}
                  disabled={!autoRunning}
                  title="Suspende el ciclo automático al finalizar el giro actual"
                  className={`rounded-full px-8 py-3 font-montserrat text-xs font-bold uppercase tracking-[0.18em] transition-all shadow-xl ${
                    !autoRunning
                      ? "bg-white/10 text-white/30 cursor-not-allowed"
                      : "bg-white text-larioja-azul hover:scale-105 active:scale-95"
                  }`}
                >
                  Parar Juego
                </button>
              </div>
              <div className="rounded-full border border-larioja-amarillo/40 bg-white/10 px-8 py-3 text-center backdrop-blur-md">
                <p className="font-montserrat text-xs font-bold uppercase tracking-[0.2em] text-larioja-amarillo">
                  {prizeLimitReached
                    ? "Sorteo finalizado"
                    : spinning
                      ? "Girando..."
                      : !autoRunning
                        ? "Automático en pausa"
                        : autoCountdown !== null
                          ? `Próximo giro en ${autoCountdown}s`
                          : "Giro automático"}
                </p>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleSpin}
              disabled={spinning || loading || participants.length === 0 || prizeLimitReached}
              className={`rounded-full px-10 py-4 font-montserrat text-sm font-bold uppercase tracking-[0.2em] transition-all shadow-xl ${
                spinning || loading || participants.length === 0 || prizeLimitReached
                  ? "bg-white/10 text-white/30 cursor-not-allowed"
                  : "bg-larioja-amarillo text-larioja-azul hover:scale-105 hover:shadow-[0_0_30px_rgba(240,180,41,0.5)] active:scale-95"
              }`}
            >
              {prizeLimitReached
                ? "Sorteo finalizado"
                : spinning
                  ? "Girando..."
                  : "Girar Tómbola"}
            </button>
          )}

          {/* Último ganador persistente (estilo "sorteo completado") */}
          {lastWinner !== null && (
            <div className="flex flex-col items-center gap-1 rounded-2xl border border-larioja-amarillo/25 bg-white/5 px-10 py-4 backdrop-blur-md">
              <p className="font-montserrat text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">
                Último número seleccionado
              </p>
              <p className="font-montserrat text-5xl font-black text-white drop-shadow-lg md:text-6xl">
                #{lastWinner}
              </p>
              <p className="font-montserrat text-[11px] font-bold uppercase tracking-widest text-larioja-amarillo">
                {winners.length} ganador{winners.length === 1 ? "" : "es"} en total
              </p>
            </div>
          )}

          {loading && participants.length === 0 && (
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-larioja-amarillo" />
          )}
          {!loading && participants.length === 0 && winners.length === 0 && (
            <p className="max-w-xs text-center text-sm text-white/60">
              No hay cartones participantes en esta tómbola.
            </p>
          )}
          {!loading && prizeLimitReached && (
            <p className="max-w-xs text-center text-sm text-larioja-amarillo font-bold uppercase tracking-widest">
              Sorteo finalizado — se completaron los {prizesNumber} premios
            </p>
          )}
          {!loading && !prizeLimitReached && participants.length === 0 && winners.length > 0 && (
            <p className="max-w-xs text-center text-sm text-larioja-amarillo font-bold uppercase tracking-widest">
              Sorteo finalizado — todos los cartones fueron sorteados
            </p>
          )}
        </div>

        {/* ── Derecha: Galería de ganadores (filas de 4) ────────────── */}
        <div ref={galleryRef} className="flex-1 w-full max-w-2xl">
          <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-md p-6 min-h-[300px]">
            <div className="flex items-center gap-3 mb-5">
              <Ticket size={22} className="text-larioja-amarillo" />
              <h3 className="font-montserrat text-sm font-bold uppercase tracking-[0.25em] text-white/80">
                Cartones Ganadores
              </h3>
              {winners.length > 0 && (
                <span className="ml-auto rounded-full bg-larioja-amarillo/20 px-3 py-1 font-montserrat text-xs font-bold text-larioja-amarillo">
                  {winners.length}
                </span>
              )}
            </div>

            {winners.length === 0 ? (
              <p className="py-10 text-center text-sm text-white/40 italic">
                Los cartones ganadores aparecerán aquí.
              </p>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {[...winners].reverse().map((cardNumber, idx) => (
                  <div
                    key={cardNumber}
                    className="winner-card-in relative flex flex-col items-center"
                  >
                    <p className="mb-1 font-montserrat text-base font-black uppercase tracking-wider text-larioja-amarillo md:text-lg">
                      #{cardNumber}
                    </p>
                    <div className="relative w-full">
                      {/* Posición en el orden del sorteo (esquina de la
                          tarjeta — no se monta sobre el número en móvil) */}
                      <span className="absolute left-1 top-1 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-larioja-amarillo font-montserrat text-[10px] font-black text-larioja-azul shadow-lg">
                        {winners.length - idx}°
                      </span>
                      <img
                        src={cardImageUrl}
                        alt={`Cartón ${cardNumber}`}
                        className="w-full rounded-lg shadow-lg border-2 border-larioja-amarillo/60 object-cover aspect-[3/4]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tarjeta voladora (posición fija, transición CSS) */}
      {flyingCard && (
        <div
          className="fixed z-[200] pointer-events-none"
          style={{
            left: flyingCard.launched ? flyingCard.to.x : flyingCard.from.x,
            top: flyingCard.launched ? flyingCard.to.y : flyingCard.from.y,
            transform: flyingCard.launched
              ? "translate(0, 0) rotate(720deg) scale(0.55)"
              : "translate(0, 0) rotate(0deg) scale(1)",
            transition: "all 1.1s cubic-bezier(0.25, 0.8, 0.3, 1)",
          }}
        >
          <div className="w-20 flex flex-col items-center">
            <p className="mb-1 font-montserrat text-xs font-black uppercase text-larioja-amarillo drop-shadow-lg">
              #{flyingCard.cardNumber}
            </p>
            <img
              src={cardImageUrl}
              alt="Tarjeta ganadora"
              className="w-full rounded-lg shadow-2xl border-2 border-larioja-amarillo object-cover aspect-[3/4]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
