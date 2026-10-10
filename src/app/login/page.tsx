import type { Metadata } from "next";
import { BrandPanel } from "@/components/auth/BrandPanel";
import { LoginForm } from "@/components/auth/LoginForm";
import { getPageContent } from "@/services/cms";

export const metadata: Metadata = {
  title: "Iniciar sesión | Sistema de gestión del Bingo",
};

/** Respaldo del enlace "Escribe al administrador" si el CMS no tiene WhatsApp. */
const ADMIN_MAILTO = "mailto:contacto@larioja.com";

/**
 * Login del Sistema de gestión del Bingo.
 * Especificación: `Documentacion/La Rioja — Login del Sistema de gestión del Bingo revisión y especificaciones.md`.
 *
 * Layout: dividido 44/56 desde 1024 px (panel de marca + formulario);
 * tarjeta centrada de 440 px entre 640 y 1023 px; pantalla completa con
 * encabezado azul marino por debajo de 640 px.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  // WhatsApp del CMS normalizado a wa.me/<solo dígitos> (como en Navbar).
  const socialMedia: { section_key: string; description: string | null }[] =
    await getPageContent("social media");
  const whatsappRaw = socialMedia.find((l) => l.section_key === "whatsapp")?.description;
  const whatsappDigits = whatsappRaw?.match(/(\d{6,15})/)?.[1];
  const adminHref = whatsappDigits ? `https://wa.me/${whatsappDigits}` : ADMIN_MAILTO;

  return (
    <main className="min-h-[100dvh] bg-larioja-azul font-montserrat sm:grid sm:place-items-center sm:bg-[#EEF2F8] sm:p-6 dark:sm:bg-gray-950">
      <div className="flex min-h-[100dvh] w-full flex-col sm:min-h-0 sm:max-w-[440px] sm:overflow-hidden sm:rounded-[20px] sm:shadow-xl lg:grid lg:min-h-[600px] lg:max-w-[960px] lg:grid-cols-[44fr_56fr]">
        <BrandPanel />
        <section className="flex-1 rounded-t-3xl bg-white px-6 py-8 sm:rounded-none sm:p-10 lg:flex lg:flex-col lg:justify-center dark:bg-gray-900">
          <LoginForm errorCode={error} adminHref={adminHref} />
        </section>
      </div>
    </main>
  );
}
