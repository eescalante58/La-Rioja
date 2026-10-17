interface AuroraBackgroundProps {
  className?: string;
}

/**
 * Capa de iluminación Aurora (Preset Azul La Rioja — #012060).
 *
 * Implementa el diseño ambiental de "Gemini Aurora Background Studio":
 * - Orbe focal inferior dominante (#012060) con modo de fusión screen y blur de 140px.
 * - Auras laterales izquierda (#081738) y derecha (#0A1E4A) para atmósfera envolvente.
 * - Núcleo central suavizador (#0B2568) al 40% de opacidad.
 *
 * Componente RSC sin estado, sin dependencias de cliente y sin JavaScript de navegador.
 */
export function AuroraBackground({ className = "" }: AuroraBackgroundProps) {
  return (
    <div
      className={`pointer-events-none absolute inset-0 overflow-hidden opacity-85 select-none [contain:paint] ${className}`}
      aria-hidden="true"
    >
      {/* 1. Orbe focal inferior dominante (#012060) */}
      <div
        className="absolute left-1/2 -translate-x-1/2 rounded-full"
        style={{
          bottom: "-120px",
          width: "1050px",
          height: "480px",
          backgroundColor: "#012060",
          filter: "blur(140px)",
          mixBlendMode: "screen",
        }}
      />

      {/* 2. Aura lateral izquierda (#081738) */}
      <div
        className="absolute top-[28%] -left-28 w-[520px] h-[520px] rounded-full"
        style={{
          backgroundColor: "#081738",
          filter: "blur(120px)",
          mixBlendMode: "screen",
        }}
      />

      {/* 3. Aura lateral derecha (#0A1E4A) */}
      <div
        className="absolute top-[22%] -right-28 w-[560px] h-[560px] rounded-full"
        style={{
          backgroundColor: "#0A1E4A",
          filter: "blur(125px)",
          mixBlendMode: "screen",
        }}
      />

      {/* 4. Núcleo suavizador central (#0B2568) */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40"
        style={{
          width: "380px",
          height: "380px",
          backgroundColor: "#0B2568",
          filter: "blur(165px)",
        }}
      />
    </div>
  );
}
