"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Dices, Trophy, RotateCw, Maximize, Minimize, Volume2, VolumeX } from "lucide-react";
import confetti from "canvas-confetti";
import {
  getPublicWheelData,
} from "@/app/admin/bingo/wheel-actions";

interface Segment {
  itemId: number | null;
  label: string;
  color: string | null;
  quantity?: number;
  cardNumber?: number;
}

interface WheelSummary {
  id: number;
  company_id: number;
  event_id: string;
  mode: string;
  wheel_name: string;
}

/** Paleta institucional para segmentos sin color propio. */
const PALETTE = [
  "#012060",
  "#1E9922",
  "#F0B429",
  "#C81E1E",
  "#2563EB",
  "#0E7490",
  "#7C3AED",
];

const CX = 250;
const CY = 250;
const R = 240;

/** 
 * Audio Pool for Ticks to ensure low latency and overlapping sounds.
 */
const TICK_POOL_SIZE = 8;
let tickPool: HTMLAudioElement[] = [];
let currentTickIndex = 0;

if (typeof window !== "undefined") {
  tickPool = Array.from({ length: TICK_POOL_SIZE }).map(() => {
    const audio = new Audio("/sounds/tick.mp3");
    audio.volume = 0.5;
    return audio;
  });
}

const playTick = () => {
  if (tickPool.length === 0) return;
  const audio = tickPool[currentTickIndex];
  audio.currentTime = 0;
  audio.play().catch(() => {});
  currentTickIndex = (currentTickIndex + 1) % TICK_POOL_SIZE;
};

function polar(angleDeg: number, radius: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad) };
}

function segmentPath(index: number, total: number) {
  const a0 = (index * 360) / total;
  const a1 = ((index + 1) * 360) / total;
  const p0 = polar(a0, R);
  const p1 = polar(a1, R);
  const largeArc = a1 - a0 > 180 ? 1 : 0;
  return `M ${CX} ${CY} L ${p0.x} ${p0.y} A ${R} ${R} 0 ${largeArc} 1 ${p1.x} ${p1.y} Z`;
}

/**
 * Ruleta de sorteo proyectable.
 *
 * El ganador se decide en el servidor (`spinWheel` registra el resultado en
 * wheel_spins); el cliente solo anima la rueda hasta el índice devuelto,
 * por lo que el sorteo no es manipulable desde el navegador.
 *
 * El puntero está fijo en la parte superior (270° en coordenadas SVG).
 */
export default function WheelOfFortune({ wheels }: { wheels: WheelSummary[] }) {
  const [selectedWheel, setSelectedWheel] = useState<WheelSummary | null>(
    wheels.length === 1 ? wheels[0] : null,
  );
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<string | null>(null);
  const [winnerData, setWinnerData] = useState<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const wheelGroupRef = useRef<SVGGElement>(null);
  const pointerRef = useRef<HTMLDivElement>(null);
  const lastTickSegment = useRef<number>(-1);
  const suspenseAudio = useRef<HTMLAudioElement | null>(null);
  const winAudio = useRef<HTMLAudioElement | null>(null);

  // Initialize sounds
  useEffect(() => {
    suspenseAudio.current = new Audio("/sounds/suspense.mp3");
    winAudio.current = new Audio("/sounds/win.mp3");
    suspenseAudio.current.load();
    winAudio.current.load();
  }, []);

  useEffect(() => {
    if (suspenseAudio.current) suspenseAudio.current.muted = isMuted;
    if (winAudio.current) winAudio.current.muted = isMuted;
    tickPool.forEach(a => a.muted = isMuted);
  }, [isMuted]);

  // Sincronizar estado de fullscreen con el navegador
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    if (!selectedWheel) return;
    setLoading(true);
    setSegments([]);
    setWinner(null);
    setRotation(0);
    getPublicWheelData(selectedWheel.id).then((res) => {
      if (res?.data) setSegments(res.data.segments);
      setLoading(false);
    });
  }, [selectedWheel]);

  const fireWinningConfetti = useCallback(() => {
    const duration = 4 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 35, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) return clearInterval(interval);

      const particleCount = 60 * (timeLeft / duration);
      
      // Left Cannon
      confetti({ 
        ...defaults, 
        particleCount, 
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#012060', '#F0B429', '#ffffff'] 
      });
      
      // Right Cannon
      confetti({ 
        ...defaults, 
        particleCount, 
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#1E9922', '#F0B429', '#ffffff'] 
      });
    }, 250);
  }, []);

  const playTickAndShake = useCallback(() => {
    if (!isMuted) playTick();

    if (pointerRef.current) {
      pointerRef.current.classList.remove("animate-pointer-hit");
      void pointerRef.current.offsetWidth; // Force reflow
      pointerRef.current.classList.add("animate-pointer-hit");
    }
  }, [isMuted]);

  const startTickTracker = useCallback((numSegments: number) => {
    const degPerSeg = 360 / numSegments;
    
    const track = () => {
      if (!wheelGroupRef.current) return;

      const style = window.getComputedStyle(wheelGroupRef.current);
      const transform = style.transform;
      
      if (transform && transform !== 'none') {
        const values = transform.split('(')[1].split(')')[0].split(',');
        const a = parseFloat(values[0]);
        const b = parseFloat(values[1]);
        let angle = (Math.atan2(b, a) * (180 / Math.PI));
        
        // Normalize angle to [0, 360)
        angle = (angle + 360) % 360;

        // Pointer is at 90 degrees (right)
        const currentSegment = Math.floor(((90 - angle + 360) % 360) / degPerSeg);

        if (currentSegment !== lastTickSegment.current) {
          playTickAndShake();
          lastTickSegment.current = currentSegment;
        }
      }

      if (spinningRef.current) {
        requestAnimationFrame(track);
      }
    };

    requestAnimationFrame(track);
  }, [playTickAndShake]);

  // Use a ref for spinning to be used inside requestAnimationFrame without closing over stale state
  const spinningRef = useRef(spinning);
  useEffect(() => {
    spinningRef.current = spinning;
  }, [spinning]);

  const handleSpin = async () => {
    if (spinning || !selectedWheel || segments.length === 0) return;
    
    setWinner(null);
    setWinnerData(null);
    setSpinning(true);
    lastTickSegment.current = -1;

    // 1. Instant Start Feedback
    if (suspenseAudio.current) {
      suspenseAudio.current.currentTime = 0;
      suspenseAudio.current.play().catch(() => {});
    }
    
    // Start with a large rotation immediately
    const startRotation = rotation + 1800; // 5 quick turns
    setRotation(startRotation);

    // Start audio tick tracking
    startTickTracker(segments.length);

    try {
      // 2. Ultra-fast API call (Route Handler)
      const res = await fetch(`/api/wheel/spin?id=${selectedWheel.id}`, { method: 'POST' });
      const result = await res.json();

      if (!result?.success) {
        throw new Error(result?.error || "Error en el sorteo");
      }

      // Sincronizamos segmentos en caliente
      setSegments(result.segments);

      const segDeg = 360 / result.segments.length;
      const winnerCenter = (result.winnerIndex + 0.5) * segDeg;
      
      // Pointer is at 90deg (right)
      const targetMod = (90 - winnerCenter + 360) % 360;
      const extraSpins = 6;
      const finalAbsolute = startRotation + (extraSpins * 360) + ((targetMod - (startRotation % 360) + 360) % 360);
      
      // Update to final absolute rotation
      setRotation(finalAbsolute);
      setWinnerData(result);

    } catch (error: any) {
      console.error("Error spinning wheel:", error);
      alert(error.message || "Error al girar la ruleta.");
      setSpinning(false);
      if (suspenseAudio.current) {
        suspenseAudio.current.pause();
      }
    }
  };

  const handleTransitionEnd = () => {
    if (spinning && winnerData) {
      setWinner(winnerData.winnerLabel);
      fireWinningConfetti();
      if (winAudio.current) {
        winAudio.current.currentTime = 0;
        winAudio.current.play().catch(() => {});
      }
      if (suspenseAudio.current) {
        suspenseAudio.current.pause();
      }
      // Small delay to let the UI settle
      setTimeout(() => setSpinning(false), 200);
    }
  };

  const fontSize = useMemo(() => {
    const n = segments.length;
    if (n <= 8) return 15;
    if (n <= 16) return 11;
    if (n <= 30) return 9;
    if (n <= 60) return 7;
    return 6;
  }, [segments.length]);

  // Selector cuando hay varias ruletas publicadas
  if (!selectedWheel) {
    return (
      <div className="flex flex-col items-center gap-6 py-20">
        <Dices size={56} className="text-larioja-amarillo" />
        <h2 className="font-montserrat text-2xl font-black uppercase tracking-wider text-white">
          Selecciona una Ruleta
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
              <p className="text-xs text-white/50">Evento {w.event_id}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8 relative w-full max-w-[1600px] mx-auto px-4">
      {/* Styles for animations */}
      <style jsx global>{`
        @keyframes pointer-hit {
          0% { transform: translateY(-50%) translateX(50%) rotate(0deg); }
          20% { transform: translateY(-50%) translateX(50%) rotate(-20deg); }
          100% { transform: translateY(-50%) translateX(50%) rotate(0deg); }
        }
        .animate-pointer-hit {
          animation: pointer-hit 0.1s ease-out;
        }
      `}</style>

      {/* Botones de Control flotantes */}
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

      {/* Encabezado de la ruleta */}
      <div className="text-center w-full">
        <p className="font-montserrat text-xs font-bold uppercase tracking-[0.3em] text-larioja-amarillo">
          {selectedWheel.mode} · Evento {selectedWheel.event_id}
        </p>
        <h2 className="mt-1 font-montserrat text-3xl font-black uppercase tracking-wide text-white md:text-5xl">
          {selectedWheel.wheel_name}
        </h2>
        {wheels.length > 1 && (
          <button
            onClick={() => setSelectedWheel(null)}
            className="mt-2 text-[10px] font-bold uppercase tracking-widest text-white/40 underline underline-offset-4 hover:text-white"
          >
            Cambiar de ruleta
          </button>
        )}
      </div>

      {/* Contenedor Principal: Rueda + Ganador lado a lado */}
      <div className="flex flex-col lg:flex-row items-center justify-center gap-12 lg:gap-20 w-full">
        {/* Rueda */}
        <div 
          className={`relative shrink-0 ${!spinning && !loading && segments.length > 0 ? "cursor-pointer" : ""}`}
          onClick={handleSpin}
        >
          {/* Puntero 3D a la DERECHA - Clickable */}
          <div 
            ref={pointerRef}
            className={`absolute right-0 top-1/2 z-20 -translate-y-1/2 translate-x-1/2 drop-shadow-2xl transition-all ${
              spinning ? "opacity-90 scale-100" : "hover:scale-110 active:scale-95 cursor-pointer"
            }`}
            style={{ transformOrigin: 'left center' }}
            title="¡Haz clic para girar!"
          >
            <svg width="70" height="70" viewBox="0 0 70 70">
              <defs>
                <linearGradient id="pointerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#FFFF00" />
                  <stop offset="100%" stopColor="#F0B429" />
                </linearGradient>
                <filter id="shadow3d" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
                  <feOffset dx="1" dy="2" result="offsetblur" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.7" />
                  </feComponentTransfer>
                  <feMerge>
                    <feMergeNode />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              <path 
                d="M 10 35 L 60 10 L 45 35 L 60 60 Z" 
                fill="url(#pointerGrad)" 
                stroke="#B48900" 
                strokeWidth="2"
                filter="url(#shadow3d)"
              />
              <path d="M 10 35 L 60 10 L 55 15 L 20 35 Z" fill="rgba(255,255,255,0.5)" />
              <path d="M 10 35 L 60 60 L 55 55 L 20 35 Z" fill="rgba(0,0,0,0.1)" />
            </svg>
          </div>

          {(loading && segments.length === 0) ? (
            <div className="flex h-[300px] w-[300px] items-center justify-center md:h-[520px] md:w-[520px]">
              <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-larioja-amarillo" />
            </div>
          ) : segments.length === 0 ? (
            <div className="flex h-[300px] w-[300px] flex-col items-center justify-center gap-3 md:h-[520px] md:w-[520px]">
              <Dices size={48} className="text-white/30" />
              <p className="max-w-xs text-center text-sm text-white/60">
                Esta ruleta no tiene segmentos disponibles.
              </p>
            </div>
          ) : (
            <svg
              viewBox="0 0 500 500"
              className={`h-[300px] w-[300px] drop-shadow-2xl md:h-[520px] md:w-[520px] transition-transform duration-1000 ${spinning ? 'scale-105' : 'scale-100'}`}
            >
              {spinning && (
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3.5" result="coloredBlur"/>
                    <feMerge>
                      <feMergeNode in="coloredBlur"/>
                      <feMergeNode in="SourceGraphic"/>
                    </feMerge>
                  </filter>
                </defs>
              )}
              <g
                ref={wheelGroupRef}
                onTransitionEnd={handleTransitionEnd}
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transformOrigin: `${CX}px ${CY}px`,
                  willChange: 'transform',
                  transition: spinning
                    ? "transform 6s cubic-bezier(0.15, 0, 0.15, 1)"
                    : "transform 0.5s ease-out",
                }}
              >
                {segments.map((seg, i) => {
                  const mid = ((i + 0.5) * 360) / segments.length;
                  const textRadius = R * 0.9;
                  const tp = polar(mid, textRadius);
                  const fill = seg.color || PALETTE[i % PALETTE.length];
                  const lines = seg.label.split("\n");
                  
                  // Rotación radial: mid - 90 orienta el texto hacia el centro
                  // Si el segmento está en el lado izquierdo (90-270), giramos 180 para legibilidad
                  const textRotation = (mid > 90 && mid < 270) ? mid + 90 : mid - 90;
                  const isLeftSide = mid > 90 && mid < 270;

                  return (
                    <g key={i}>
                      <path
                        d={segmentPath(i, segments.length)}
                        fill={fill}
                        stroke="#ffffff"
                        strokeWidth={segments.length > 30 ? 0.5 : 1.5}
                      />
                      <text
                        x={tp.x}
                        y={tp.y}
                        fill="#ffffff"
                        fontSize={fontSize}
                        fontWeight={800}
                        fontFamily="Montserrat, sans-serif"
                        textAnchor={isLeftSide ? "start" : "end"}
                        dominantBaseline="middle"
                        transform={`rotate(${textRotation} ${tp.x} ${tp.y})`}
                      >
                        {lines.map((line, lineIdx) => (
                          <tspan
                            key={lineIdx}
                            x={tp.x}
                            dy={lineIdx === 0 ? `-${(lines.length - 1) * 0.6}em` : "1.2em"}
                          >
                            {line}
                          </tspan>
                        ))}
                        {selectedWheel.mode === "Premios" && seg.quantity !== undefined && (
                          <tspan
                            x={tp.x}
                            dy="1.4em"
                            fontSize={Math.max(fontSize - 4, 8)}
                            fontWeight={400}
                            fill="rgba(255,255,255,0.7)"
                          >
                            (Stock: {seg.quantity})
                          </tspan>
                        )}
                      </text>
                    </g>
                  );
                })}
              </g>

              <circle cx={CX} cy={CY} r={R} fill="none" stroke="#ffffff" strokeWidth={4} />
              <circle cx={CX} cy={CY} r={62} fill="#ffffff" stroke="#eeeeee" strokeWidth="1" />
              <image href="/logo.png" x={CX - 45} y={CY - 34} width={90} height={68} preserveAspectRatio="xMidYMid meet" />
            </svg>
          )}
        </div>

        {/* Anuncio del Ganador: A la DERECHA en desktop */}
        <div className={`w-full max-w-lg transition-all duration-700 ${winner ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-10 scale-95 pointer-events-none"}`}>
          {winner && (
            <div className="w-full rounded-3xl bg-white p-8 md:p-12 text-center shadow-[0_20px_50px_rgba(0,0,0,0.3)] border-b-8 border-larioja-amarillo">
              <Trophy size={80} className="mx-auto text-larioja-amarillo drop-shadow-lg mb-6" />
              <p className="font-montserrat text-xs font-bold uppercase tracking-[0.4em] text-gray-400 mb-2">
                ¡Tenemos un ganador!
              </p>
              <h3 className="break-words font-montserrat text-4xl md:text-5xl font-black uppercase text-larioja-azul leading-tight mb-8">
                {winner}
              </h3>
              <button
                onClick={() => setWinner(null)}
                className="w-full rounded-full bg-larioja-azul py-4 font-montserrat text-sm font-bold uppercase tracking-[0.2em] text-white transition-all hover:bg-[#02184a] shadow-lg"
              >
                Continuar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
