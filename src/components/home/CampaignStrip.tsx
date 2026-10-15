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
    const parsed = CampaignSchema.safeParse(row.metadata);
    if (!parsed.success) return [];
    const title = row.title ?? parsed.data.title ?? "";
    const text = row.description ?? parsed.data.text ?? "";
    return [{ ...parsed.data, imageUrl: row.image_url, sectionKey: row.section_key, title, text }];
  });

  const active = activeCampaigns(campaigns);
  if (active.length === 0) return null;

  return (
    <section className="bg-surface-page py-16 lg:py-20" aria-labelledby="campaigns-heading">
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
        <h2
          id="campaigns-heading"
          className="mb-8 font-montserrat text-2xl font-extrabold text-larioja-azul dark:text-larioja-amarillo lg:text-3xl"
        >
          Lo que está pasando en La Rioja
        </h2>
        <div className="grid gap-5 md:grid-cols-3">
          {active.map((c) => (
            <article
              key={c.sectionKey}
              className="group relative overflow-hidden rounded-tile bg-surface-card shadow-tremor-card"
            >
              {/* Imagen de fondo */}
              {c.imageUrl ? (
                <CampaignPhoto src={c.imageUrl} alt={c.imageAlt} tag={c.tag} />
              ) : (
                <div className="relative aspect-[16/10]">
                  <div className="h-full w-full bg-larioja-azul/10 dark:bg-larioja-azul/30" />
                  <span className="absolute left-3 top-3 rounded-full bg-larioja-amarillo px-3 py-1 text-xs font-bold text-larioja-azul">
                    {c.tag}
                  </span>
                </div>
              )}

              {/* Texto */}
              <div className="p-5">
                <h3 className="mb-1 font-montserrat text-base font-bold text-ink">{c.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-ink-muted">{c.text}</p>
                <Link
                  href={c.href}
                  className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-larioja-azul-enlace hover:underline dark:text-larioja-azul-celeste"
                >
                  {c.linkLabel} →
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
