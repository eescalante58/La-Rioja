/** Dominio canónico de producción (`la-rioja.vercel.app` redirige con 308 aquí). */
const PRODUCTION_URL = "https://lariojacflsv.site";

/**
 * URL base absoluta del sitio para metadatos, Open Graph, sitemap y robots.
 * - Preview de Vercel: la URL del propio despliegue, para que las tarjetas
 *   OG y las rutas absolutas muestren lo que se está revisando.
 * - Desarrollo local: http://localhost:3000.
 * - Producción: el dominio canónico.
 * No se deriva de NEXT_PUBLIC_SITE_URL porque esa variable es el respaldo
 * del retorno OAuth y puede apuntar a otro dominio según el entorno.
 */
export const SITE_URL: string =
  process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : PRODUCTION_URL;
