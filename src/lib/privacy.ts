import { createClient } from "@supabase/supabase-js";
import { metaText, textOr, type CmsSection } from "@/lib/cms-content";

/** Ruta relativa oficial de la página de Política de Privacidad. */
export const PRIVACY_PATH = "/privacidad" as const;

/** Claves aceptadas para la sección de Política de Privacidad en `site_content`. */
const PRIVACY_SECTION_KEYS = new Set([
  "politica_privacidad",
  "politica-de-privacidad",
  "política_privacidad",
  "política-de-privacidad",
]);

/** Textos centralizados de los avisos y enlaces hacia `/privacidad` (Sección 6). */
export interface PrivacyCopy {
  href: string;
  footer: string;
  whatsapp: string;
  apoyanos: string;
  shop: string;
  cookies: string;
}

/** Valores por defecto de los textos de enlace a la política de privacidad. */
export const DEFAULT_PRIVACY_COPY: PrivacyCopy = {
  href: PRIVACY_PATH,
  footer: "Política de privacidad",
  whatsapp: "Al escribirnos aceptas nuestra política de privacidad",
  apoyanos: "Conoce cómo cuidamos tus datos",
  shop: "Al comprar aceptas nuestra política de privacidad",
  cookies: "Más información",
};

/** Contenido inicial en Markdown (9 secciones) usado en la migración y como respaldo pre-migración. */
export const INITIAL_PRIVACY_MARKDOWN = `## 1. Quiénes somos y ámbito de aplicación

La **Asociación Salvadoreña Pro-Ayuda a Personas con Discapacidad Intelectual (ASPAPREM)**, fundada en 1993 en San Salvador como una entidad apolítica, no lucrativa y no religiosa regida por la Ley de Asociaciones y Fundaciones sin Fines de Lucro del Ministerio de Gobernación, tiene a su cargo dos divisiones educativas y formativas:

- **Colegio La Rioja:** Programa escolar avalado por el Ministerio de Educación (MINED) orientado a jóvenes de entre 12 y 20 años de edad, ofreciendo estudios de primero a sexto grado con adecuaciones en educación especial.
- **Centro de Formación Laboral La Rioja (CFL La Rioja):** Programas académicos, de autonomía para la vida independiente e inserción laboral a través de talleres vocacionales, enfocados en jóvenes y adultos de 20 a 55 años.

Esta Política de Privacidad explica cómo tratamos y protegemos los datos personales conforme al marco normativo aplicable en la República de El Salvador, en sintonía con las disposiciones de protección a la niñez, adolescencia y personas con discapacidad (en articulación con organismos como CONAPINA y el MINED), así como estándares internacionales de privacidad y ética digital.

Aplica a quienes visitan nuestro sitio web oficial [lariojacflsv.site](/), nos escriben por WhatsApp o correo electrónico, compran productos elaborados en nuestros talleres a través de [La Rioja Shop](/productos), nos apoyan con donaciones o patrocinios de becas en [Apóyanos](/apoyanos), o interactúan con nuestras redes sociales oficiales (Facebook, YouTube e Instagram \`@larioja_sv\`).

Al usar nuestro sitio web o contactarnos por cualquiera de nuestros canales, aceptas el tratamiento de tus datos personales como se describe en este documento.

## 2. Datos que recopilamos

Aplicamos el principio de minimización de datos: solo solicitamos la información estrictamente necesaria para atenderte. Según cómo interactúes con nosotros, podemos recibir:

- **Datos de contacto y admisión:** Nombre completo, teléfono, correo electrónico y el contenido de tus mensajes cuando nos escribes por WhatsApp o correo, solicitas información sobre admisiones o agendas una visita diagnóstica o institucional.
- **Datos de compra (La Rioja Shop):** Productos que solicitas (panadería, carpintería, costura, huerto o artículos festivos), dirección o punto de entrega acordado y modalidad de pago.
- **Datos de donación y patrocinio de becas:** Nombre completo o razón social, datos de contacto e información tributaria necesaria en caso de que solicites la emisión del comprobante formal de donación (para efectos de deducción de Impuesto sobre la Renta). No recopilamos ni almacenamos números completos de tarjetas de crédito o débito; los aportes electrónicos se procesan mediante pasarelas de pago externas certificadas o transferencias bancarias directas.
- **Datos de navegación:** Dirección IP, tipo de dispositivo y navegador, páginas visitadas y duración de la visita, recopilados mediante cookies técnicas y herramientas de medición.
- **Datos de redes sociales:** Mensajes directos, comentarios, menciones, contenido generado por el usuario (UGC) y reacciones que nos envías o publicas en nuestras páginas oficiales de Facebook, Instagram y en nuestro canal de YouTube.

## 3. Cómo usamos tus datos

Utilizamos tus datos personales únicamente para fines legítimos y vinculados a nuestra misión social:

- Responder consultas generales, coordinar visitas a nuestras instalaciones y atender solicitudes de inscripción o evaluación diagnóstica para el Colegio La Rioja y el CFL La Rioja.
- Procesar, preparar, entregar y dar seguimiento a los pedidos de productos realizados en La Rioja Shop.
- Registrar donaciones en efectivo o en especie, gestionar el programa de apadrinamiento de becas escolares, emitir comprobantes fiscales de donación y agradecer tu apoyo.
- Informarte sobre actividades de recaudación y convivencia institucional —como el Bingo La Rioja, la Feria de Logros, rifas, desayunos benéficos y días deportivos—, únicamente si nos has dado tu consentimiento para ello.
- Rendir cuentas de manera transparente sobre mejoras de infraestructura, equipamiento de talleres y proyectos institucionales.
- Mejorar la accesibilidad y funcionamiento de nuestro sitio web y medir la efectividad de nuestras campañas de comunicación y publicidad digital.

**Compromiso ético:** No vendemos, alquilamos ni cedemos tus datos personales a terceros, ni los utilizamos para fines distintos de los descritos en esta política.

## 4. Cookies, píxeles y publicidad digital

Nuestro sitio web puede utilizar cookies técnicas y herramientas analíticas o publicitarias de terceros para funcionar adecuadamente, medir las visitas y dar a conocer nuestras causas sociales y productos. Entre estas herramientas se encuentran **Google** (Google Analytics y Google Ads) y **Meta** (Píxel de Facebook e Instagram). Estas tecnologías pueden registrar tu dirección IP, tipo de dispositivo y páginas visitadas dentro de nuestro portal para mostrarte anuncios relevantes de La Rioja en otros sitios web y redes sociales (*retargeting*).

Puedes rechazar, configurar o borrar las cookies en cualquier momento desde la configuración de tu navegador web, así como gestionar nuestro aviso de cookies al ingresar al sitio. También puedes limitar los anuncios personalizados desde la configuración de privacidad de tus cuentas de Google y Meta. Ten en cuenta que, si desactivas ciertas cookies técnicas, algunas funciones del sitio podrían no operar de forma óptima. Cada plataforma externa trata la información conforme a sus propias políticas de privacidad.

## 5. Con quién compartimos los datos

Solo compartimos datos con aliados y proveedores que nos ayudan a operar de manera segura, y únicamente en la medida estrictamente necesaria:

- **Proveedores de tecnología e infraestructura:** Servicios de alojamiento web (*hosting*), correo electrónico, WhatsApp Business, Google y Meta.
- **Operadores logísticos y financieros:** Personas o entidades que colaboran en la entrega de pedidos de La Rioja Shop o pasarelas e instituciones bancarias encargadas de procesar pagos y donaciones de forma segura.
- **Autoridades e instituciones públicas:** Cuando una ley salvadoreña, requerimiento fiscal (por ejemplo, respecto a comprobantes de donación) u orden judicial competente lo exija.

Bajo ninguna circunstancia entregamos tus datos a terceros para que te envíen publicidad comercial ajena a nuestra institución.

## 6. Imágenes, dignidad y datos de nuestros estudiantes

Nuestros estudiantes y participantes son personas con discapacidad intelectual; su dignidad, integridad y privacidad son nuestra máxima prioridad:

- **Consentimiento informado por escrito:** Solo publicamos fotografías, videos, audios o nombres de pila de estudiantes en el sitio web, redes sociales o materiales promocionales cuando su madre, padre o representante legal nos ha otorgado autorización previa, expresa y por escrito, la cual queda debidamente resguardada en los archivos de ASPAPREM.
- **Enfoque dignificante y de logro:** Toda comunicación visual o escrita se enfoca con respeto en sus capacidades técnicas, autonomía funcional y logros en los talleres y aulas, rechazando cualquier enfoque paternalista o asistencialista.
- **Reserva absoluta de datos sensibles:** Jamás publicamos ni divulgamos información sobre su estado de salud, diagnóstico clínico o psicopedagógico, ni datos sobre la situación familiar o socioeconómica (como estudios de asignación de cuotas o becas).
- **Derecho de retiro inmediato:** Si eres familiar, representante legal o estudiante y deseas que retiremos una imagen, video o nombre publicado en nuestros canales, escríbenos y procederemos a retirarlo de inmediato. Asimismo, para compartir contenido generado por usuarios de nuestra comunidad en redes sociales, siempre solicitaremos permiso previo.

## 7. Conservación y seguridad de la información

Conservamos tus datos personales únicamente durante el tiempo necesario para atender tu solicitud, mantener la comunicación voluntaria con nuestra comunidad de donantes o cumplir con obligaciones legales, contables y de auditoría vigentes en El Salvador (tales como el resguardo de respaldos de comprobantes de donación).

Aplicamos medidas técnicas y administrativas razonables para proteger tu información contra accesos no autorizados, pérdida o alteración, incluyendo conexiones cifradas seguras (protocolo HTTPS), control de acceso restringido al personal administrativo autorizado y confidencialidad estricta en la atención de mensajes privados. Dado que ningún sistema en internet es infalible, mantenemos una supervisión constante de nuestros canales digitales.

## 8. Tus derechos y canales de contacto

En cualquier momento tienes derecho a solicitar el acceso a tus datos personales, pedir su rectificación o actualización, solicitar su eliminación de nuestros registros de contacto, retirar tu autorización para el uso de datos o imágenes, o darte de baja para dejar de recibir mensajes informativos nuestros.

Para ejercer estos derechos o realizar cualquier consulta sobre privacidad, contáctanos a través de nuestros canales oficiales actualizados y te responderemos en un plazo razonable:

| Canal de atención | Detalle de contacto |
| --- | --- |
| Teléfono y WhatsApp | [+503 7731-0792](https://wa.me/50377310792) |
| Correo electrónico | [centrodeformacionlarioja@gmail.com](mailto:centrodeformacionlarioja@gmail.com) |
| Dirección física | Urbanización Lomas de Altamira, Calzada El Zenzontle, Block 2 #7, San Salvador, El Salvador |
| Redes sociales | Instagram: \`@larioja_sv\` · YouTube: \`@LaRiojaCFL\` · Facebook: CFL La Rioja |

## 9. Cambios a esta política

Podemos actualizar esta Política de Privacidad periódicamente cuando incorporemos nuevos servicios en el centro, mejoremos nuestras herramientas digitales o se actualice la normativa aplicable. Publicaremos siempre la versión vigente en nuestro sitio web [lariojacflsv.site](/privacidad), indicando claramente la fecha de la última actualización al inicio del documento.`;

/** Sección de privacidad con fecha de actualización incluida. */
export interface PrivacySectionData extends CmsSection {
  updated_at?: string | null;
}

const SEED_PRIVACY_SECTION: PrivacySectionData = {
  section_key: "politica_privacidad",
  title: "Política de Privacidad — CFL La Rioja y Colegio La Rioja (ASPAPREM)",
  description: INITIAL_PRIVACY_MARKDOWN,
  updated_at: "2026-10-18T18:00:00Z",
  metadata: {
    seoTitulo: "Política de Privacidad — CFL La Rioja y Colegio La Rioja (ASPAPREM)",
    seoDescripcion:
      "Conoce cómo la Asociación Salvadoreña Pro-Ayuda a Personas con Discapacidad Intelectual (ASPAPREM), el Colegio La Rioja y el CFL La Rioja tratan y protegen tus datos personales en El Salvador.",
    fecha_actualizacion: "18 de octubre de 2026",
    enlace_url: PRIVACY_PATH,
    texto_footer: DEFAULT_PRIVACY_COPY.footer,
    texto_whatsapp: DEFAULT_PRIVACY_COPY.whatsapp,
    texto_apoyanos: DEFAULT_PRIVACY_COPY.apoyanos,
    texto_shop: DEFAULT_PRIVACY_COPY.shop,
    texto_cookies: DEFAULT_PRIVACY_COPY.cookies,
  },
};

/**
 * Obtiene la sección publicada de la Política de Privacidad desde `site_content`.
 * - Si la migración del enum aún no se ha aplicado en Supabase (`22P02`), devuelve
 *   la semilla inicial para previsualización local.
 * - Si la sección está en estado borrador (`is_active = false`), vacía o fue eliminada
 *   en el CMS, devuelve `null` para que `/privacidad` muestre el mensaje de respaldo (RF-08 / RF-09).
 */
export async function getPrivacyPolicySection(): Promise<PrivacySectionData | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
  const { data, error } = await supabase
    .from("site_content")
    .select("*")
    .eq("page", "privacidad")
    .eq("is_active", true)
    .order("content_order", { ascending: true });

  if (error) {
    // 22P02 = el enum 'privacidad' aún no se ha ejecutado en el SQL Editor de Supabase
    if (error.code === "22P02") {
      return SEED_PRIVACY_SECTION;
    }
    console.error("Error fetching privacy policy from CMS:", error);
    return null;
  }

  const rows = (data ?? []) as PrivacySectionData[];
  const matched =
    rows.find((r) => PRIVACY_SECTION_KEYS.has(r.section_key.trim().toLowerCase())) ?? rows[0];

  if (!matched || !textOr(matched.description, "")) {
    return null;
  }

  return matched;
}

/**
 * Formatea la fecha de última actualización de la política en español.
 * Prioriza `metadata.fecha_actualizacion` si está definida; de lo contrario,
 * formatea `updated_at` en zona horaria de El Salvador.
 */
export function formatPrivacyUpdatedAt(section: PrivacySectionData): string {
  const manualDate = metaText(section, "fecha_actualizacion", "");
  if (manualDate) return manualDate;

  if (section.updated_at) {
    const parsed = new Date(section.updated_at);
    if (!Number.isNaN(parsed.getTime())) {
      return new Intl.DateTimeFormat("es-SV", {
        timeZone: "America/El_Salvador",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(parsed);
    }
  }

  return "18 de octubre de 2026";
}

/**
 * Extrae los textos configurables de los enlaces de privacidad desde `metadata`,
 * con respaldo a `DEFAULT_PRIVACY_COPY`.
 */
export function resolvePrivacyCopy(section?: CmsSection | null): PrivacyCopy {
  if (!section) return DEFAULT_PRIVACY_COPY;
  return {
    href: PRIVACY_PATH,
    footer: metaText(section, "texto_footer", DEFAULT_PRIVACY_COPY.footer),
    whatsapp: metaText(section, "texto_whatsapp", DEFAULT_PRIVACY_COPY.whatsapp),
    apoyanos: metaText(section, "texto_apoyanos", DEFAULT_PRIVACY_COPY.apoyanos),
    shop: metaText(section, "texto_shop", DEFAULT_PRIVACY_COPY.shop),
    cookies: metaText(section, "texto_cookies", DEFAULT_PRIVACY_COPY.cookies),
  };
}
