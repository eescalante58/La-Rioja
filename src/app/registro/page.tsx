import { ClipboardList } from "lucide-react";
import ParticipantRegistrationForm from "@/components/registration/ParticipantRegistrationForm";
import { getPublicWheels } from "@/app/admin/bingo/wheel-actions";
import { createAdminClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Registro de Cartones | La Rioja",
  description:
    "Registra los números de cartón con los que participarás en la tómbola del evento de La Rioja.",
};

// El registro depende de la ruleta publicada vigente: siempre fresco.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Página pública de auto-registro de cartones (/registro?id=<wheel_id>).
 *
 * Diseñada para el QR proyectado en el evento: los asistentes registran
 * nombre, teléfono y hasta 10 números de cartón en una sola llamada RPC
 * (register_participant_cards) que valida todo atómicamente en Postgres.
 *
 * Resolución de la ruleta destino:
 * - ?id=<wheel_id>  → esa ruleta, si está publicada y es modo Participantes.
 * - Sin parámetro   → la única tómbola Participantes publicada del evento;
 *                     si hay varias se muestra un selector.
 */
export default async function RegistroPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const params = await searchParams;
  const rawId = params?.id ? parseInt(params.id, 10) : NaN;

  const supabase = createAdminClient();
  const [wheelsRes, countriesRes] = await Promise.all([
    getPublicWheels({ mode: "Participantes" }),
    supabase
      .from("country_codes")
      .select("name, phone_code, flag_emoji, iso2")
      .order("name", { ascending: true }),
  ]);

  const wheels = (wheelsRes?.data || []).filter((w) => w.mode === "Participantes");
  const countries = (countriesRes.data || []) as {
    name: string;
    phone_code: string;
    flag_emoji: string | null;
    iso2: string;
  }[];

  const requested = Number.isFinite(rawId)
    ? wheels.find((w) => w.id === rawId)
    : undefined;
  const initialWheel = requested ?? (wheels.length === 1 ? wheels[0] : null);

  return (
    <main className="min-h-screen bg-larioja-azul bg-gradient-to-b from-larioja-azul via-[#02184a] to-[#010c28]">
      <section className="mx-auto flex min-h-screen w-full max-w-xl flex-col items-center px-3 py-3 sm:py-8">
        {wheels.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <ClipboardList size={64} className="text-white/20" />
            <h1 className="font-montserrat text-2xl font-black uppercase tracking-wider text-white">
              Registro de Cartones
            </h1>
            <p className="max-w-md text-white/60">
              El registro no está habilitado en este momento. El equipo de La
              Rioja lo activará durante el evento.
            </p>
          </div>
        ) : (
          <ParticipantRegistrationForm
            wheels={wheels}
            initialWheel={initialWheel ?? null}
            countries={countries}
          />
        )}
      </section>
    </main>
  );
}
