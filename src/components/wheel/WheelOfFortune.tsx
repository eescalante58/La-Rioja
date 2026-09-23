"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Dices, Trophy, RotateCw, Maximize, Minimize } from "lucide-react";
import {
  getPublicWheelData,
  spinWheel,
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
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  const handleSpin = async () => {
    if (spinning || !selectedWheel || segments.length === 0) return;
    setSpinning(true);
    setWinner(null);

    try {
      const result = await spinWheel(selectedWheel.id);
      if (!result?.success || !result.segments) {
        alert(result?.error || "No se pudo girar la ruleta.");
        setSpinning(false);
        return;
      }

      // SINCRONIZACIÓN TOTAL:
      // Actualizamos los segmentos con lo que el servidor realmente usó.
      // Esto asegura que result.winnerIndex corresponda exactamente a lo que vemos.
      setSegments(result.segments);

      const segDeg = 360 / result.segments.length;
      const winnerCenter = (result.winnerIndex + 0.5) * segDeg;
      
      const currentMod = ((rotation % 360) + 360) % 360;
      const targetMod = (360 - winnerCenter) % 360;
      const extraSpins = 7 + Math.random() * 2;
      const delta = extraSpins * 360 + ((targetMod - currentMod + 360) % 360);

      setRotation((prev) => prev + delta);

      setTimeout(() => {
        setWinner(result.winnerLabel);
        setSpinning(false);
      }, 6100);
    } catch (error) {
      console.error("Error spinning wheel:", error);
      alert("Error inesperado al girar la ruleta.");
      setSpinning(false);
    }
  };

  const fontSize = useMemo(() => {
    const n = segments.length;
    if (n <= 8) return 18;
    if (n <= 16) return 14;
    if (n <= 30) return 11;
    if (n <= 60) return 8;
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
    <div className="flex flex-col items-center gap-6 relative w-full">
      {/* Botón Fullscreen flotante */}
      <button
        onClick={toggleFullscreen}
        className="fixed top-24 right-6 z-[120] p-3 rounded-full bg-white/10 text-white/60 hover:text-white hover:bg-white/20 transition-all backdrop-blur-md border border-white/10 shadow-xl"
        title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
      >
        {isFullscreen ? <Minimize size={24} /> : <Maximize size={24} />}
      </button>

      {/* Encabezado de la ruleta */}
      <div className="text-center">
        <p className="font-montserrat text-xs font-bold uppercase tracking-[0.3em] text-larioja-amarillo">
          {selectedWheel.mode} · Evento {selectedWheel.event_id}
        </p>
        <h2 className="mt-1 font-montserrat text-3xl font-black uppercase tracking-wide text-white md:text-4xl">
          {selectedWheel.wheel_name}
        </h2>
      </div>

      {wheels.length > 1 && (
        <button
          onClick={() => setSelectedWheel(null)}
          className="text-xs font-bold uppercase tracking-widest text-white/60 underline underline-offset-4 hover:text-white"
        >
          Cambiar de ruleta
        </button>
      )}

      {/* Rueda */}
      <div 
        className={`relative ${!spinning && !loading && segments.length > 0 ? "cursor-pointer" : ""}`}
        onClick={handleSpin}
      >
        {/* Puntero 3D a la DERECHA - Clickable */}
        <div 
          className={`absolute right-0 top-1/2 z-20 -translate-y-1/2 translate-x-1/2 drop-shadow-2xl transition-transform ${
            spinning ? "scale-95 opacity-80" : "hover:scale-110 active:scale-95"
          }`}
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
            {/* Flecha según imagen: punta a la izquierda, base cóncava a la derecha */}
            <path 
              d="M 10 35 L 60 10 L 45 35 L 60 60 Z" 
              fill="url(#pointerGrad)" 
              stroke="#B48900" 
              strokeWidth="2"
              filter="url(#shadow3d)"
            />
            {/* Efecto de bisel/luz superior */}
            <path d="M 10 35 L 60 10 L 55 15 L 20 35 Z" fill="rgba(255,255,255,0.5)" />
            {/* Sombra interna inferior */}
            <path d="M 10 35 L 60 60 L 55 55 L 20 35 Z" fill="rgba(0,0,0,0.1)" />
          </svg>
        </div>

        {loading ? (
          <div className="flex h-[300px] w-[300px] items-center justify-center md:h-[500px] md:w-[500px]">
            <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-larioja-amarillo" />
          </div>
        ) : segments.length === 0 ? (
          <div className="flex h-[300px] w-[300px] flex-col items-center justify-center gap-3 md:h-[500px] md:w-[500px]">
            <Dices size={48} className="text-white/30" />
            <p className="max-w-xs text-center text-sm text-white/60">
              Esta ruleta no tiene segmentos disponibles.
            </p>
          </div>
        ) : (
          <svg
            viewBox="0 0 500 500"
            className="h-[300px] w-[300px] drop-shadow-2xl md:h-[520px] md:w-[520px]"
          >
            <g
              style={{
                transform: `rotate(${rotation}deg)`,
                transformOrigin: `${CX}px ${CY}px`,
                transition: spinning
                  ? "transform 6s cubic-bezier(0.12, 0.8, 0.15, 1)"
                  : "none",
              }}
            >
              {segments.map((seg, i) => {
                const mid = ((i + 0.5) * 360) / segments.length;
                // Texto radial: del borde hacia el centro
                const textRadius = R * 0.9;
                const tp = polar(mid, textRadius);
                const fill = seg.color || PALETTE[i % PALETTE.length];
                const lines = seg.label.split("\n");
                
                // Rotación radial: mid - 90 orienta el texto hacia el centro
                // Giramos 180 si está en el lado izquierdo para mantener legibilidad
                const textRotation = mid > 180 ? mid - 90 + 180 : mid - 90;

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
                      textAnchor={mid > 180 ? "start" : "end"}
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

            {/* Aro exterior */}
            <circle
              cx={CX}
              cy={CY}
              r={R}
              fill="none"
              stroke="#ffffff"
              strokeWidth={4}
            />
            {/* Eje central */}
            <circle cx={CX} cy={CY} r={62} fill="#ffffff" stroke="#eeeeee" strokeWidth="1" />
            <image
              href="/logo.png"
              x={CX - 45}
              y={CY - 34}
              width={90}
              height={68}
              preserveAspectRatio="xMidYMid meet"
            />
          </svg>
        )}
      </div>

      {/* Celebración del ganador */}
      {winner && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in p-4"
          onClick={() => setWinner(null)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-2xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <Trophy size={64} className="mx-auto text-larioja-amarillo drop-shadow" />
            <p className="mt-4 font-montserrat text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
              ¡Tenemos un ganador!
            </p>
            <p className="mt-2 break-words font-montserrat text-3xl font-black uppercase text-larioja-azul md:text-4xl">
              {winner}
            </p>
            <button
              onClick={() => setWinner(null)}
              className="mt-8 rounded-full bg-larioja-azul px-8 py-3 font-montserrat text-sm font-bold uppercase tracking-wider text-white transition-all hover:scale-105"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
