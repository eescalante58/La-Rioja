import { MonitorCheck } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import TombolaMonitor from "@/components/tombola/TombolaMonitor";
import { getPublicWheels } from "@/app/admin/bingo/wheel-actions";

export const metadata = {
  title: "Monitor de Tómbola | La Rioja",
  description:
    "Monitor en vivo de cartones ganadores de la tómbola del Centro de Formación Laboral La Rioja.",
};

// El monitor es un tablero en vivo: cada request lee el estado real de la BD.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Página pública de monitoreo de resultados de la tómbola
 * (/tombola/monitor?id=<wheel_id>).
 *
 * Pensada para el personal que proyecta/anuncia los cartones ganadores:
 * bandeja de ganadores ordenada descendentemente por número de cartón,
 * cada uno con su posición de sorteo (1°, 2°, ...). Se accede desde el
 * botón "Monitorear" de la tarjeta de ruleta en Admin → Ruletas por Evento.
 *
 * Sincroniza por Realtime directo a wheel_participating_cards (los
 * monitores son pocos clientes, a diferencia del público de /tombola
 * que usa polling por CDN).
 */
export default async function TombolaMonitorPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const result = await getPublicWheels({});

  // La tómbola solo opera con ruletas de Cartones o Participantes
  const wheels = (result?.data || []).filter((w) => w.mode !== "Premios");

  const rawId = params?.id ? parseInt(params.id, 10) : NaN;
  const initialWheelId = Number.isFinite(rawId) ? rawId : null;

  return (
    <main className="min-h-screen bg-larioja-azul bg-gradient-to-b from-larioja-azul via-[#02184a] to-[#010c28]">
      <Navbar brandHeader simple fixed={false} />

      <section className="mx-auto flex min-h-[80vh] max-w-[1600px] flex-col items-center justify-center px-6 pt-4 pb-10 md:pt-6">
        {wheels.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <MonitorCheck size={64} className="text-white/20" />
            <h1 className="font-montserrat text-2xl font-black uppercase tracking-wider text-white">
              Monitor de Tómbola
            </h1>
            <p className="max-w-md text-white/60">
              No hay tómbolas publicadas en este momento. Activa una ruleta
              de Cartones o Participantes desde el panel de administración.
            </p>
          </div>
        ) : (
          <TombolaMonitor wheels={wheels} initialWheelId={initialWheelId} />
        )}
      </section>
    </main>
  );
}
