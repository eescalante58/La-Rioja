import Link from "next/link";
import type { SiteContent } from "@/types/cms";

interface Props {
  cta: SiteContent | null;
}

/** Sección 9 — Cierre: llamada a la acción con WhatsApp, apoyanos, dirección y teléfonos. */
export function HomeCta({ cta }: Props) {
  const meta = (cta?.metadata ?? {}) as Record<string, string>;
  const title = cta?.title ?? "Ven a conocernos";
  const description =
    cta?.description ??
    "Nuestras puertas están abiertas para familias, donantes y comunidad. Visítanos o escríbenos cuando quieras.";
  const botonWa = meta.boton_whatsapp ?? "Escribinos por WhatsApp";
  const mensajeWa = encodeURIComponent(
    meta.mensaje_whatsapp ?? "Hola, quisiera más información sobre La Rioja",
  );
  const telefono1 = meta.telefono_1 ?? "";
  const telefono2 = meta.telefono_2 ?? "";
  const direccion = meta.direccion ?? "";
  const waNumber = meta.telefono_1?.replace(/\D/g, "") ?? "";
  const waHref = `https://wa.me/${waNumber}?text=${mensajeWa}`;

  return (
    <section className="bg-larioja-azul py-16 text-white lg:py-20" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-screen-xl px-4 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="cta-heading" className="font-montserrat text-3xl font-extrabold lg:text-4xl">
            {title}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/85 lg:text-lg">{description}</p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {waNumber && (
              <Link
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-larioja-amarillo px-7 py-3 text-sm font-bold text-larioja-azul transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-larioja-amarillo focus-visible:ring-offset-2 focus-visible:ring-offset-larioja-azul"
              >
                {/* WhatsApp icon */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.557 4.115 1.528 5.845L.057 23.885a.5.5 0 00.593.661l6.159-1.614A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22a9.961 9.961 0 01-5.09-1.396l-.364-.214-3.775.99.986-3.681-.236-.378A9.96 9.96 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
                </svg>
                {botonWa}
              </Link>
            )}
            <Link
              href="/apoyanos"
              className="inline-block rounded-full border-2 border-white/70 px-7 py-3 text-sm font-bold text-white transition-colors hover:border-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-larioja-azul"
            >
              Apóyanos
            </Link>
          </div>

          {/* Datos de contacto */}
          {(telefono1 || direccion) && (
            <div className="mt-10 flex flex-wrap justify-center gap-6 text-sm text-white/70">
              {telefono1 && (
                <span>
                  📞{" "}
                  <a href={`tel:${telefono1}`} className="hover:text-white hover:underline">
                    {telefono1}
                  </a>
                  {telefono2 && (
                    <>
                      {" · "}
                      <a href={`tel:${telefono2}`} className="hover:text-white hover:underline">
                        {telefono2}
                      </a>
                    </>
                  )}
                </span>
              )}
              {direccion && <span>📍 {direccion}</span>}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
