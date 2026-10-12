import { z } from "zod";

/** Campaña de la portada: visible solo entre sus fechas de inicio y fin. */
export const CampaignSchema = z.object({
  tag: z.string().max(24),
  title: z.string().max(60),
  text: z.string().max(120),
  linkLabel: z.string().max(40),
  href: z.string(),
  imageAlt: z.string(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
});

export type Campaign = z.infer<typeof CampaignSchema> & {
  imageUrl: string | null;
  sectionKey: string;
};

/** Devuelve las campañas vigentes, por prioridad, hasta un máximo de tres. */
export function activeCampaigns(all: Campaign[], now = new Date()): Campaign[] {
  return all
    .filter(
      (c) =>
        (!c.startsAt || new Date(c.startsAt) <= now) && (!c.endsAt || new Date(c.endsAt) >= now),
    )
    .slice(0, 3);
}
