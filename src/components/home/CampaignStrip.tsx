import Image from "next/image";
import Link from "next/link";
import type { SiteContent } from "@/types/cms";
import { CampaignSchema, activeCampaigns, type Campaign } from "@/lib/validation/campaigns";

interface Props {
  rows: SiteContent[];
}

/** Sección 2 — Tres campañas activas del CMS. No se renderiza si no hay ninguna vigente. */
export function CampaignStrip({ rows }: Props) {
  const campaigns: Campaign[] = rows.flatMap((row) => {
    const parsed = CampaignSchema.safeParse(row.metadata);
    if (!parsed.success) return [];
    return [
      {
        ...parsed.data,
        imageUrl: row.image_url,
        sectionKey: row.section_key,
        title: row.title ?? parsed.data.title,
        text: row.description ?? parsed.data.text,
      },
    ];
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
              <div className="relative aspect-[16/10] overflow-hidden">
                {c.imageUrl ? (
                  <Image
                    src={c.imageUrl}
                    alt={c.imageAlt}
                    fill
                    sizes="(max-width: 767px) 100vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="h-full w-full bg-larioja-azul/10 dark:bg-larioja-azul/30" />
                )}
                {/* Capa oscura para legibilidad */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                {/* Etiqueta */}
                <span className="absolute left-3 top-3 rounded-full bg-larioja-amarillo px-3 py-1 text-xs font-bold text-larioja-azul">
                  {c.tag}
                </span>
              </div>

              {/* Texto */}
              <div className="p-5">
                <h3 className="mb-1 font-montserrat text-base font-bold text-ink">{c.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-ink-muted">{c.text}</p>
                <Link
                  href={c.href}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-larioja-azul-enlace hover:underline dark:text-larioja-azul-celeste"
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
