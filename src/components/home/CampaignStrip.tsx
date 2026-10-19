import Link from "next/link";
import type { SiteContent } from "@/types/cms";
import { CampaignSchema, activeCampaigns, type Campaign } from "@/lib/validation/campaigns";
import { CampaignPhoto } from "./CampaignPhoto";

interface Props {
  rows: SiteContent[];
}

/** Sección 2 — Tres campañas activas del CMS. No se renderiza si no hay ninguna vigente. */
export function CampaignStrip({ rows }: Props) {
  const campaigns: Campaign[] = rows.flatMap((row) => {
    const rawMeta =
      typeof row.metadata === "object" && row.metadata !== null && !Array.isArray(row.metadata)
        ? row.metadata
        : {};
    const parsed = CampaignSchema.safeParse(rawMeta);
    if (!parsed.success) return [];
    const title = (row.title && row.title.trim()) || parsed.data.title?.trim() || "";
    const text = (row.description && row.description.trim()) || parsed.data.text?.trim() || "";
    if (!title && !text && !row.image_url) return [];
    const href = parsed.data.href.trim() || "#";
    const linkLabel = parsed.data.linkLabel.trim() || (parsed.data.href.trim() ? "Ver más" : "");
    const imageAlt = parsed.data.imageAlt.trim() || title || "Campaña La Rioja";
    const imageUrl = row.image_url && row.image_url.trim() ? row.image_url.trim() : null;
    return [
      {
        ...parsed.data,
        href,
        linkLabel,
        imageAlt,
        imageUrl,
        sectionKey: row.section_key,
        title,
        text,
      },
    ];
  });

  const active = activeCampaigns(campaigns);
  if (active.length === 0) return null;

  return (
    <section className="bg-surface-page py-16 lg:py-20" aria-labelledby="campaigns-heading">
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
        <div className="mb-8 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2
              id="campaigns-heading"
              className="font-montserrat text-2xl font-extrabold text-larioja-azul dark:text-larioja-amarillo lg:text-3xl"
            >
              Lo que está pasando en La Rioja
            </h2>
            <p className="mt-1 text-sm text-ink-muted">
              Novedades, eventos institucionales y proyectos de la comunidad.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-3">
          {active.map((c) => {
            const isExternal = /^https?:\/\//i.test(c.href);
            return (
              <article
                key={c.sectionKey}
                className="group relative flex flex-col justify-between overflow-hidden rounded-tile border border-line bg-surface-card shadow-tremor-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Imagen de fondo enlazada */}
                {c.imageUrl ? (
                  <CampaignPhoto src={c.imageUrl} alt={c.imageAlt} tag={c.tag} href={c.href} />
                ) : (
                  <Link
                    href={c.href}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className="relative block aspect-[16/10] bg-larioja-azul/10 dark:bg-larioja-azul/30"
                    aria-label={`Ir a la campaña: ${c.title}`}
                  >
                    {c.tag && (
                      <span className="absolute left-3 top-3 rounded-full bg-larioja-amarillo px-3 py-0.5 text-[11px] font-extrabold text-larioja-azul shadow-xs">
                        {c.tag}
                      </span>
                    )}
                  </Link>
                )}

                {/* Texto y acción */}
                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <h3 className="mb-1 font-montserrat text-base font-bold text-ink transition-colors group-hover:text-larioja-azul-enlace dark:group-hover:text-larioja-amarillo">
                      {c.title}
                    </h3>
                    <p className="mb-4 text-sm leading-relaxed text-ink-muted">{c.text}</p>
                  </div>
                  {c.linkLabel && (
                    <Link
                      href={c.href}
                      target={isExternal ? "_blank" : undefined}
                      rel={isExternal ? "noopener noreferrer" : undefined}
                      className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-larioja-azul-enlace transition-all hover:gap-2 hover:underline dark:text-larioja-azul-celeste"
                    >
                      {c.linkLabel} →
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
