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
      if (!result?.success) {
        alert(result?.error || "No se pudo girar la ruleta.");
        setSpinning(false);
        return;
      }

      // IMPORTANTE: Buscamos el ganador en nuestra lista local de segmentos.
      // No usamos winnerIndex del servidor porque si el stock cambió, los índices
      // pueden estar desfasados respecto a lo que el navegador tiene cargado.
      const localWinnerIndex = segments.findIndex(
        (s) => s.label === result.winnerLabel,
      );

      // Si por alguna razón no lo encontramos (muy raro), usamos el índice del server
      const finalIndex = localWinnerIndex !== -1 ? localWinnerIndex : result.winnerIndex;

      const segDeg = 360 / segments.length;
      const winnerCenter = (finalIndex + 0.5) * segDeg;
      // Puntero en la parte superior (0° de rotación visual).
      const currentMod = ((rotation % 360) + 360) % 360;
      const targetMod = (360 - winnerCenter) % 360;
      const extraSpins = 6 + Math.random() * 2;
      const delta = extraSpins * 360 + ((targetMod - currentMod + 360) % 360);

      setRotation((prev) => prev + delta);

      // Espera a que termine la animación (6s) antes de mostrar el ganador
      setTimeout(() => {
        setWinner(result.winnerLabel);
        setSpinning(false);
        // Refrescamos los segmentos después de ganar para sincronizar stock/visibilidad
        getPublicWheelData(selectedWheel.id).then((res) => {
          if (res?.data) setSegments(res.data.segments);
        });
      }, 6100);
    } catch (error) {
      console.error("Error spinning wheel:", error);
      alert("Error inesperado al girar la ruleta.");
      setSpinning(false);
    }
  };

  const fontSize = useMemo(() => {
    const n = segments.length;
    if (n <= 8) return 26;
    if (n <= 16) return 22;
    if (n <= 30) return 18;
    if (n <= 60) return 14;
    return 10;
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
      <div className="relative">
        {/* Puntero */}
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-2">
          <div className="h-0 w-0 border-x-[18px] border-t-[30px] border-x-transparent border-t-larioja-amarillo drop-shadow-lg" />
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
                // Posicionamos el punto del texto cerca del borde exterior
                const textRadius = R * 0.92;
                const tp = polar(mid, textRadius);
                const fill = seg.color || PALETTE[i % PALETTE.length];
                const text =
                  seg.label.length > 28
                    ? `${seg.label.slice(0, 27)}…`
                    : seg.label;
                
                // Rotación del texto: 
                // Orientamos el texto radialmente (del borde al centro)
                // mid es el ángulo del radio. Sumamos 180 si está en la zona inferior
                // para que no quede de cabeza al leerlo desde afuera.
                const textRotation = mid > 90 && mid < 270 ? mid + 180 : mid;

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
                      fontWeight={900}
                      fontFamily="Montserrat, sans-serif"
                      textAnchor="end"
                      dominantBaseline="middle"
                      transform={`rotate(${textRotation} ${tp.x} ${tp.y})`}
                    >
                      {text}
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
            <circle cx={CX} cy={CY} r={62} fill="#ffffff" />
            <image
              href="/logo.png"
              x={CX - 50}
              y={CY - 38}
              width={100}
              height={76}
              preserveAspectRatio="xMidYMid meet"
            />
          </svg>
        )}
      </div>

      {/* Botón girar */}
      <button
        onClick={handleSpin}
        disabled={spinning || loading || segments.length === 0}
        className="group flex items-center gap-3 rounded-full bg-larioja-verde px-10 py-4 font-montserrat text-lg font-black uppercase tracking-wider text-white shadow-2xl transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <RotateCw
          size={24}
          className={spinning ? "animate-spin" : "transition-transform group-hover:rotate-90"}
        />
        {spinning ? "Girando..." : "¡Girar!"}
      </button>

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
