import Link from "next/link";
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
    <section className="bg-larioja-azul py-16 text-white lg:py-20">
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-montserrat text-6xl font-extrabold leading-none text-larioja-amarillo lg:text-7xl">
            {dato}
          </p>
          <p className="mt-4 text-lg leading-relaxed text-white/85">{texto}</p>
          <Link
            href={enlace}
            className="mt-8 inline-block rounded-full bg-larioja-amarillo px-8 py-3 text-sm font-bold text-larioja-azul transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-amarillo focus-visible:ring-offset-2 focus-visible:ring-offset-larioja-azul"
          >
            {boton}
          </Link>
        </div>

        {cifras.length > 0 && (
          <dl className="mt-14 grid grid-cols-2 gap-6 border-t border-white/20 pt-10 md:grid-cols-4">
            {cifras.map((c) => (
              <div key={c.etiqueta} className="text-center">
                <dt className="font-montserrat text-3xl font-extrabold text-larioja-amarillo lg:text-4xl">
                  {c.numero}
                </dt>
                <dd className="mt-1 text-sm text-white/70">{c.etiqueta}</dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
}
