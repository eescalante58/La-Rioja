import Link from "next/link";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import type { SiteContent } from "@/types/cms";

interface Cifra {
  numero: string;
  etiqueta: string;
}

interface Props {
  solidarity: SiteContent | null;
}

/** Sección 4 — Banda solidaria: dato "7 de cada 10" + cifras de impacto. */
export function SolidarityBand({ solidarity }: Props) {
  const meta = (solidarity?.metadata ?? {}) as Record<string, unknown>;
  const dato = solidarity?.title ?? "7 de cada 10";
  const texto =
    solidarity?.description ??
    "estudiantes pagan una cuota menor al costo real de su formación. Así nos aseguramos de que el dinero nunca sea un impedimento. Tu apoyo cubre la diferencia.";
  const boton = (meta.boton as string) ?? "Quiero apoyar";
  const enlace = (meta.enlace as string) ?? "/apoyanos";
  const cifras: Cifra[] = (meta.cifras as Cifra[]) ?? [
    { numero: "52", etiqueta: "estudiantes en el CFL" },
    { numero: "33", etiqueta: "años de ASPAPREM" },
    { numero: "20", etiqueta: "profesionales" },
    { numero: "+30", etiqueta: "escuelas públicas formadas" },
  ];

  return (
    <section
      className="relative overflow-hidden bg-[#0A0C14] py-16 text-white lg:py-20"
      aria-label="Modelo solidario"
    >
      <AuroraBackground />
      <div className="relative z-10 mx-auto max-w-screen-xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-larioja-amarillo">
            Compromiso Comunitario
          </p>
          <div className="font-montserrat text-5xl font-extrabold tracking-tight text-larioja-amarillo sm:text-6xl lg:text-7xl">
            {dato}
          </div>
          <p className="mt-4 text-base leading-relaxed text-white/90 sm:text-lg">{texto}</p>
          <div className="mt-8 flex justify-center">
            <Link
              href={enlace}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-larioja-amarillo px-8 py-3 text-sm font-bold text-larioja-azul shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-amarillo focus-visible:ring-offset-2 focus-visible:ring-offset-larioja-azul"
            >
              {boton}
            </Link>
          </div>
        </div>

        {cifras.length > 0 && (
          <dl className="mt-12 grid grid-cols-2 gap-6 border-t border-white/20 pt-10 md:grid-cols-4">
            {cifras.map((c) => (
              <div key={c.etiqueta} className="text-center">
                <dt className="font-montserrat text-3xl font-extrabold text-larioja-amarillo sm:text-4xl">
                  {c.numero}
                </dt>
                <dd className="mt-1.5 text-xs text-white/80 sm:text-sm">{c.etiqueta}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
