import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, Mail, Phone, MapPin, CalendarClock, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { mdToHtml } from "@/lib/markdown";
import { metaText, textOr } from "@/lib/cms-content";
import {
  formatPrivacyUpdatedAt,
  getPrivacyPolicySection,
  PRIVACY_PATH,
} from "@/lib/privacy";
import { getPageContent, getSectionContent } from "@/services/cms";
import type { SiteContent } from "@/types/cms";

export const revalidate = 3600;

const DEFAULT_SEO_TITLE = "Política de Privacidad — CFL La Rioja y Colegio La Rioja (ASPAPREM)";
const DEFAULT_SEO_DESCRIPTION =
  "Conoce cómo la Asociación Salvadoreña Pro-Ayuda a Personas con Discapacidad Intelectual (ASPAPREM), el Colegio La Rioja y el CFL La Rioja tratan y protegen tus datos personales en El Salvador.";

/**
 * Genera los metadatos SEO dinámicos a partir de `seoTitulo` y `seoDescripcion`
 * almacenados en la sección del CMS, con respaldo estático y URL canónica.
 */
export async function generateMetadata(): Promise<Metadata> {
  const section = await getPrivacyPolicySection();
  const seoTitle = metaText(section ?? undefined, "seoTitulo", textOr(section?.title, DEFAULT_SEO_TITLE));
  const seoDescription = metaText(section ?? undefined, "seoDescripcion", DEFAULT_SEO_DESCRIPTION);

  return {
    title: { absolute: seoTitle },
    description: seoDescription,
    alternates: {
      canonical: PRIVACY_PATH,
    },
    robots: {
      index: true,
      follow: true,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: PRIVACY_PATH,
      type: "article",
      locale: "es_SV",
    },
  };
}

/**
 * Página pública `/privacidad`: renderiza en el servidor la Política de Privacidad
 * administrada desde el CMS (`page = 'privacidad'`, `section_key = 'politica_privacidad'`).
 * Si la sección no existe o está en borrador (`is_active = false`), presenta un aviso
 * informativo con los canales oficiales de contacto (RF-08).
 */
export default async function PrivacidadPage() {
  const [section, ctaResult, socialResult] = await Promise.all([
    getPrivacyPolicySection(),
    getSectionContent("home", "cl_cta"),
    getPageContent("social media"),
  ]);

  const ctaMeta = ((ctaResult?.metadata ?? {}) as Record<string, string>);
  const socialLinks = (socialResult ?? []) as SiteContent[];

  const tel1 = ctaMeta.telefono_1 || "+503 7731-0792";
  const tel2 = ctaMeta.telefono_2 || "2248-4198";
  const direccion =
    ctaMeta.direccion ||
    "Urbanización Lomas de Altamira, Calzada El Zenzontle, Block 2 #7, San Salvador, El Salvador";
  const emailRow = socialLinks.find((l) => l.section_key === "email");
  const emailVal = emailRow?.description?.trim() || "centrodeformacionlarioja@gmail.com";
  const waDigits = tel1.replace(/\D/g, "") || "50377310792";
  const waHref = `https://wa.me/${waDigits.startsWith("503") ? waDigits : `503${waDigits}`}`;

  const headingTitle = textOr(
    section?.title,
    "Política de Privacidad — CFL La Rioja y Colegio La Rioja (ASPAPREM)",
  );
  const updatedAtLabel = section ? formatPrivacyUpdatedAt(section) : null;
  const htmlContent = section?.description
    ? mdToHtml(section.description, { minHeadingLevel: 2 })
    : null;

  return (
    <main
      id="contenido"
      className="min-h-screen overflow-x-clip bg-white text-slate-800 dark:bg-gray-950 dark:text-slate-100"
    >
      <Navbar />

      {/* Encabezado institucional con un único H1 */}
      <header className="relative overflow-hidden bg-[#0A0C14] pb-14 pt-10 text-white lg:pb-16 lg:pt-14">
        <AuroraBackground />
        <div className="relative z-10 mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[70ch]">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-larioja-amarillo">
              <ShieldCheck size={15} aria-hidden="true" />
              <span>ASPAPREM · Protección de Datos y Dignidad</span>
            </div>

            <h1 className="font-montserrat text-[clamp(1.75rem,1.2rem+2.5vw,2.75rem)] font-extrabold leading-[1.15] tracking-tight text-white [text-wrap:balance]">
              {headingTitle}
            </h1>

            {updatedAtLabel && (
              <p className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white/85 sm:text-base">
                <CalendarClock size={16} className="shrink-0 text-larioja-amarillo" aria-hidden="true" />
                <span>Última actualización: {updatedAtLabel}</span>
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Contenido principal o aviso de respaldo (RF-08) */}
      <section className="py-12 sm:py-16 lg:py-20" aria-label="Contenido de la política de privacidad">
        <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          {htmlContent ? (
            <article className="privacy-prose mx-auto max-w-[70ch] text-base leading-[1.75] text-slate-700 [overflow-wrap:anywhere] dark:text-slate-200 sm:text-[1.0625rem]">
              <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
            </article>
          ) : (
            <div
              role="status"
              className="mx-auto max-w-[70ch] rounded-3xl border border-gray-200 bg-gray-50/80 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80 sm:p-10"
            >
              <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-larioja-azul text-larioja-amarillo dark:bg-larioja-amarillo dark:text-larioja-azul">
                <ShieldCheck size={24} aria-hidden="true" />
              </div>
              <h2 className="font-montserrat text-xl font-bold text-larioja-azul [text-wrap:balance] dark:text-white sm:text-2xl">
                Nuestra Política de Privacidad está en actualización
              </h2>
              <p className="mt-3 text-base leading-[1.7] text-slate-700 [text-wrap:pretty] dark:text-slate-300">
                En este momento estamos revisando y actualizando el texto de nuestra política de
                privacidad. Si deseas consultar cómo cuidamos tus datos personales, ejercer tus
                derechos de acceso, rectificación o retiro, o tienes cualquier duda, comunícate
                directamente con nosotros por nuestros canales oficiales:
              </p>

              <dl className="mt-6 space-y-4 rounded-2xl border border-gray-200 bg-white p-5 text-sm dark:border-gray-800 dark:bg-gray-950 sm:text-base">
                <div className="flex items-start gap-3">
                  <Phone
                    size={18}
                    className="mt-1 shrink-0 text-larioja-azul dark:text-larioja-amarillo"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="font-bold text-larioja-azul dark:text-white">
                      Teléfono y WhatsApp
                    </dt>
                    <dd className="mt-0.5 text-slate-700 dark:text-slate-300">
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-[44px] items-center font-semibold text-larioja-azul underline underline-offset-4 hover:text-larioja-verde dark:text-larioja-amarillo"
                      >
                        {tel1}
                      </a>
                      {tel2 ? ` · ${tel2}` : ""}
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail
                    size={18}
                    className="mt-1 shrink-0 text-larioja-azul dark:text-larioja-amarillo"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="font-bold text-larioja-azul dark:text-white">
                      Correo electrónico
                    </dt>
                    <dd className="mt-0.5 [overflow-wrap:anywhere]">
                      <a
                        href={`mailto:${emailVal}`}
                        className="inline-flex min-h-[44px] items-center font-semibold text-larioja-azul underline underline-offset-4 hover:text-larioja-verde dark:text-larioja-amarillo"
                      >
                        {emailVal}
                      </a>
                    </dd>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <MapPin
                    size={18}
                    className="mt-1 shrink-0 text-larioja-azul dark:text-larioja-amarillo"
                    aria-hidden="true"
                  />
                  <div>
                    <dt className="font-bold text-larioja-azul dark:text-white">Dirección física</dt>
                    <dd className="mt-0.5 text-slate-700 dark:text-slate-300">{direccion}</dd>
                  </div>
                </div>
              </dl>

              <div className="mt-6">
                <Link
                  href="/"
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-larioja-azul px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-larioja-azul/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul dark:bg-larioja-amarillo dark:text-larioja-azul"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Volver al inicio
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Estilos tipográficos locales para el artículo renderizado desde Markdown */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
            .privacy-prose h2 {
              font-family: var(--font-montserrat), sans-serif;
              font-size: clamp(1.25rem, 1.05rem + 0.9vw, 1.6rem);
              font-weight: 800;
              line-height: 1.25;
              color: #012060;
              margin: 2.5rem 0 0.85rem;
              padding-bottom: 0.5rem;
              border-bottom: 1px solid #e2e8f0;
              text-wrap: balance;
            }
            .privacy-prose h2:first-child {
              margin-top: 0;
            }
            .privacy-prose h3,
            .privacy-prose h4,
            .privacy-prose h5,
            .privacy-prose h6 {
              font-family: var(--font-montserrat), sans-serif;
              font-size: 1.125rem;
              font-weight: 700;
              line-height: 1.35;
              color: #0B557C;
              margin: 1.75rem 0 0.5rem;
              text-wrap: balance;
            }
            .privacy-prose p {
              margin: 0.95rem 0;
              line-height: 1.75;
              text-wrap: pretty;
            }
            .privacy-prose ul,
            .privacy-prose ol {
              margin: 1rem 0 1.25rem 1.35rem;
              line-height: 1.75;
            }
            .privacy-prose ul {
              list-style-type: disc;
            }
            .privacy-prose ol {
              list-style-type: decimal;
            }
            .privacy-prose li {
              margin: 0.55rem 0;
              padding-left: 0.25rem;
              text-wrap: pretty;
            }
            .privacy-prose strong {
              font-weight: 700;
              color: #0f172a;
            }
            .privacy-prose a {
              color: #012060;
              font-weight: 600;
              text-decoration: underline;
              text-underline-offset: 3px;
            }
            .privacy-prose a:hover {
              color: #0B557C;
            }
            .privacy-prose code {
              background: #f1f5f9;
              color: #012060;
              padding: 0.15em 0.4em;
              border-radius: 0.35rem;
              font-size: 0.9em;
            }
            .privacy-prose blockquote {
              border-left: 4px solid #F1B812;
              background: rgba(241, 184, 18, 0.08);
              padding: 0.85rem 1.15rem;
              margin: 1.25rem 0;
              border-radius: 0 0.6rem 0.6rem 0;
              text-wrap: pretty;
            }
            .privacy-prose .table-wrap {
              overflow-x: auto;
              margin: 1.5rem 0;
              border: 1px solid #e2e8f0;
              border-radius: 0.85rem;
            }
            .privacy-prose table {
              width: 100%;
              border-collapse: collapse;
              font-size: 0.9375rem;
              line-height: 1.55;
            }
            .privacy-prose th {
              background: #f8fafc;
              color: #012060;
              font-weight: 700;
              text-align: left;
              padding: 0.75rem 1rem;
              border-bottom: 2px solid #cbd5e1;
              text-wrap: balance;
            }
            .privacy-prose td {
              padding: 0.75rem 1rem;
              border-bottom: 1px solid #e2e8f0;
              vertical-align: top;
            }
            .privacy-prose td a {
              display: inline-flex;
              min-height: 44px;
              align-items: center;
            }
            .privacy-prose tr:last-child td {
              border-bottom: none;
            }
            .dark .privacy-prose h2 {
              color: #F3C31B;
              border-bottom-color: #1e293b;
            }
            .dark .privacy-prose h3,
            .dark .privacy-prose h4,
            .dark .privacy-prose h5,
            .dark .privacy-prose h6 {
              color: #7dd3fc;
            }
            .dark .privacy-prose strong {
              color: #f8fafc;
            }
            .dark .privacy-prose a {
              color: #F3C31B;
            }
            .dark .privacy-prose a:hover {
              color: #fde047;
            }
            .dark .privacy-prose code {
              background: #1e293b;
              color: #F3C31B;
            }
            .dark .privacy-prose .table-wrap {
              border-color: #1e293b;
            }
            .dark .privacy-prose th {
              background: #0f172a;
              color: #F3C31B;
              border-bottom-color: #334155;
            }
            .dark .privacy-prose td {
              border-bottom-color: #1e293b;
            }
          `,
        }}
      />

      <Footer />
    </main>
  );
}
