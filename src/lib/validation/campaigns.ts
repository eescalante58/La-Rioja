import { z } from "zod";

/** Parseo seguro de fecha opcional (ISO completa o YYYY-MM-DD). Devuelve null si es inválida o vacía. */
function parseOptionalDate(value: string | undefined): Date | null {
  if (!value || !value.trim()) return null;
  const d = new Date(value.trim());
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Campaña de la portada: tolerante a metadatos parciales o editados desde el CMS. */
export const CampaignSchema = z.object({
  tag: z.string().optional().default(""),
  /** title y text son opcionales en metadata — se toman de site_content.title / description si faltan. */
  title: z.string().optional(),
  text: z.string().optional(),
  linkLabel: z.string().optional().default(""),
  href: z.string().optional().default(""),
  imageAlt: z.string().optional().default(""),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

export type Campaign = z.infer<typeof CampaignSchema> & {
  imageUrl: string | null;
  sectionKey: string;
  /** Siempre presente tras la fusión con site_content.title / description */
  title: string;
  text: string;
};

/** Devuelve las campañas vigentes, por prioridad, hasta un máximo de tres. */
export function activeCampaigns(all: Campaign[], now = new Date()): Campaign[] {
  return all
    .filter((c) => {
      const start = parseOptionalDate(c.startsAt);
      const end = parseOptionalDate(c.endsAt);
      return (!start || start <= now) && (!end || end >= now);
    })
    .slice(0, 3);
}

