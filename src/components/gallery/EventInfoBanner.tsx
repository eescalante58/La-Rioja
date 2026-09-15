import { CalendarDays, MapPin, Sparkles, Ticket } from "lucide-react";

interface GalleryEvent {
  event_name?: string | null;
  event_date?: string | null;
  event_venue?: string | null;
  Method_of_payment?: string | null;
}

/**
 * Calcula los días restantes hasta la fecha del evento en hora local.
 * Se usa mediodía para la fecha del evento y medianoche para hoy a fin de
 * evitar desfases por zona horaria en cadenas tipo "YYYY-MM-DD".
 */
function getDaysLeft(eventDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${eventDate}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86_400_000);
}

/**
 * Formatea la fecha del evento en español, ej: "viernes, 3 de octubre de 2026".
 */
function formatEventDate(eventDate: string): string {
  const date = new Date(`${eventDate}T12:00:00`);
  const formatted = new Intl.DateTimeFormat("es-SV", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

/**
 * Banner informativo previo a la galería: muestra la cuenta regresiva en una
 * cinta con desplazamiento (marquee), la fecha y el lugar del evento.
 */
export default function EventInfoBanner({ event }: { event: GalleryEvent }) {
  const daysLeft = event.event_date ? getDaysLeft(event.event_date) : null;

  const countdownText =
    daysLeft === null
      ? null
      : daysLeft > 0
        ? `¡FALTAN ${daysLeft} ${daysLeft === 1 ? "DÍA" : "DÍAS"}!`
        : daysLeft === 0
          ? "¡HOY ES EL GRAN EVENTO!"
          : "¡EL EVENTO YA SE REALIZÓ!";

  if (!countdownText && !event.event_date && !event.event_venue && !event.Method_of_payment) return null;

  return (
    <section className="w-full">
      {countdownText && (
        <div className="relative overflow-hidden bg-larioja-azul py-3 border-y-4 border-larioja-verde">
          <div className="flex w-max animate-marquee">
            {[0, 1].map((half) => (
              <div key={half} className="flex shrink-0 items-center" aria-hidden={half === 1}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <span
                    key={i}
                    className="mx-6 flex items-center gap-3 whitespace-nowrap font-montserrat text-lg md:text-xl font-black uppercase tracking-wider text-larioja-amarillo"
                  >
                    <Sparkles size={18} className="shrink-0" />
                    {countdownText}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {(event.event_date || event.event_venue) && (
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-center gap-3 px-6 py-6 sm:flex-row sm:gap-10">
          {event.event_date && (
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <CalendarDays size={20} className="shrink-0 text-larioja-verde" />
              <span className="text-sm font-semibold md:text-base">
                {formatEventDate(event.event_date)}
              </span>
            </div>
          )}
          {event.event_venue && (
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <MapPin size={20} className="shrink-0 text-larioja-verde" />
              <span className="text-sm font-semibold md:text-base">{event.event_venue}</span>
            </div>
          )}
        </div>
      )}

      {event.Method_of_payment && (
        <div className="mx-auto max-w-[1600px] px-6 pb-6 text-center">
          <p className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-larioja-azul dark:text-white md:text-base">
            <Ticket size={18} className="text-larioja-verde" />
            Los cartones los puede comprar:
          </p>
          <p className="mt-2 whitespace-pre-line text-sm font-medium text-gray-600 dark:text-gray-300 md:text-base">
            {event.Method_of_payment}
          </p>
        </div>
      )}
    </section>
  );
}
