import { Dices } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import WheelOfFortune from "@/components/wheel/WheelOfFortune";
import { getPublicWheels } from "@/app/admin/bingo/wheel-actions";

export const metadata = {
  title: "Ruleta de Sorteos | La Rioja",
  description:
    "Ruleta de sorteos en vivo del Centro de Formación Laboral La Rioja.",
};

// F5 siempre consulta la BD: la ruleta es un tablero en vivo y el stock
// de premios cambia en cada giro. Sin Full Route Cache ni Data Cache.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Página pública de proyección de ruletas (/ruleta).
 *
 * Muestra las ruletas publicadas desde /admin/bingo:
 * - Sin filtros: ruletas publicadas del evento vigente (o selector si hay varias).
 * - ?evento=<event_id>&tipo=<mode>&nombre=<wheel_name> fija una ruleta puntual.
 *
 * Sin login: pensada para conectarse a un proyector/TV durante el evento.
 */
export default async function RuletaPage({
  searchParams,
}: {
  searchParams: Promise<{ evento?: string; tipo?: string; nombre?: string }>;
}) {
  const params = await searchParams;
  const result = await getPublicWheels({
    eventId: params?.evento,
    mode: params?.tipo,
    wheelName: params?.nombre,
  });
  const wheels = result?.data || [];

  return (
    <main className="min-h-screen bg-larioja-azul bg-gradient-to-b from-larioja-azul via-[#02184a] to-[#010c28]">
      <Navbar brandHeader simple fixed={false} />

      <section className="mx-auto flex min-h-[80vh] max-w-[1400px] flex-col items-center justify-center px-6 pt-12 pb-16 md:pt-20">
        {wheels.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <Dices size={64} className="text-white/20" />
            <h1 className="font-montserrat text-2xl font-black uppercase tracking-wider text-white">
              Ruleta de Sorteos
            </h1>
            <p className="max-w-md text-white/60">
              No hay ruletas publicadas en este momento. El equipo de La Rioja
              las activará durante el evento.
            </p>
          </div>
        ) : (
          <WheelOfFortune wheels={wheels} />
        )}
      </section>
    </main>
  );
}
