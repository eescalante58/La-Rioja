import { Dices } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import Tombola from "@/components/tombola/Tombola";
import { getPublicWheels } from "@/app/admin/bingo/wheel-actions";
import { getSectionContent } from "@/services/cms";

export const metadata = {
  title: "Tómbola de Cartones | La Rioja",
  description:
    "Tómbola de cartones ganadores en vivo del Centro de Formación Laboral La Rioja.",
};

// La tómbola es un tablero en vivo: cada request lee el estado real de la BD.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Página pública de proyección de la tómbola (/tombola).
 *
 * - Sin filtros: tómbolas publicadas (modos Cartones/Participantes) del evento
 *   vigente; si hay varias se muestra un selector.
 * - ?evento=<event_id>&nombre=<wheel_name> fija una tómbola puntual.
 *
 * Sin login: pensada para proyector/TV durante el evento. Los espectadores
 * sincronizan por polling a /api/tombola/state (caché CDN), no por Realtime,
 * para soportar 1000+ clientes concurrentes.
 */
export default async function TombolaPage({
  searchParams,
}: {
  searchParams: Promise<{ evento?: string; nombre?: string }>;
}) {
  const params = await searchParams;
  const result = await getPublicWheels({
    eventId: params?.evento,
    wheelName: params?.nombre,
  });

  // La tómbola solo opera con ruletas de Cartones o Participantes
  const wheels = (result?.data || []).filter((w) => w.mode !== "Premios");

  // Imagen de la tarjeta voladora desde CMS (site_content: page='tombola',
  // section_key='Tarjeta Voladora', image_url = URL del bucket de Storage)
  const cardContent = await getSectionContent("tombola", "Tarjeta Voladora");
  const cardImageUrl = cardContent?.image_url || "/card.webp";

  return (
    <main className="min-h-screen bg-larioja-azul bg-gradient-to-b from-larioja-azul via-[#02184a] to-[#010c28]">
      <Navbar brandHeader simple fixed={false} />

      <section className="mx-auto flex min-h-[80vh] max-w-[1600px] flex-col items-center justify-center px-6 pt-4 pb-10 md:pt-6">
        {wheels.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <Dices size={64} className="text-white/20" />
            <h1 className="font-montserrat text-2xl font-black uppercase tracking-wider text-white">
              Tómbola de Cartones
            </h1>
            <p className="max-w-md text-white/60">
              No hay tómbolas publicadas en este momento. El equipo de La Rioja
              las activará durante el evento.
            </p>
          </div>
        ) : (
          <Tombola wheels={wheels} cardImageUrl={cardImageUrl} />
        )}
      </section>
    </main>
  );
}
