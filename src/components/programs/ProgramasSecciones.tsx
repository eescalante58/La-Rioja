import Image from "next/image";
import Link from "next/link";
import { H2, H3, MUTED, BTN_YELLOW, SECTION_ANCHOR } from "@/components/site/section-ui";

// ---------------------------------------------------------------------------
// Modelo de datos interno
// ---------------------------------------------------------------------------

interface Programa {
  /** Clave de React y ancla de la URL (ej. "panaderia"). */
  id: string;
  titulo: string;
  descripcion: string;
  foto: {
    src: string;
    alt: string;
    /** "completa": foto entera + fondo desenfocado. "recortada": object-cover con foco. */
    encuadre?: "completa" | "recortada";
    /** object-position para el modo recortada. Por defecto "50% 35%" (favorece rostros). */
    foco?: string;
  };
  /** Artículos que elaboran (solo talleres productivos). */
  productos?: string[];
  /** Enlace a la tienda (solo talleres productivos). */
  tienda?: { etiqueta: string; href: string };
}

// ---------------------------------------------------------------------------
// Contenido — borradores pendientes de validación con instructores
// ---------------------------------------------------------------------------

/** Cuatro talleres productivos, en el orden de presentación. */
export const TALLERES: Programa[] = [
  {
    id: "panaderia",
    titulo: "Panadería",
    descripcion:
      "Preparan masas, hornean y empacan pan dulce y salado siguiendo recetas e higiene de una panadería real.",
    foto: {
      src: "/programas/hero-panaderia.webp",
      alt: "Alumnos amasando pan en el taller de Panadería",
      encuadre: "recortada",
      foco: "50% 40%",
    },
    productos: ["Pan dulce", "Pan francés", "Repostería"],
    tienda: { etiqueta: "Ver Panadería La Rioja", href: "/productos#panaderia" },
  },
  {
    id: "carpinteria",
    titulo: "Carpintería",
    descripcion:
      "Miden, cortan, lijan y ensamblan piezas de madera usando herramientas con técnicas seguras.",
    foto: {
      src: "/nosotros/taller-carpinteria.webp",
      alt: "Alumno trabajando madera en el taller de Carpintería",
      encuadre: "recortada",
    },
    productos: ["Cajas", "Repisas", "Artículos decorativos"],
    tienda: { etiqueta: "Ver en La Rioja Shop", href: "/productos" },
  },
  {
    id: "costura",
    titulo: "Costura",
    descripcion:
      "Aprenden a usar la máquina de coser, cortar patrones y terminar prendas y accesorios textiles.",
    foto: {
      src: "/nosotros/taller-costura.webp",
      alt: "Alumnas cosiendo en el taller de Costura",
      encuadre: "recortada",
    },
    productos: ["Bolsas", "Accesorios textiles", "Arreglos"],
    tienda: { etiqueta: "Ver en La Rioja Shop", href: "/productos#arte-y-costura" },
  },
  {
    id: "pintura",
    titulo: "Pintura",
    descripcion:
      "Diseñan y pintan a mano artículos personalizados, cuidando el detalle y el acabado de cada pieza.",
    foto: {
      src: "/apoyanos/logro-pintura.webp",
      alt: "Alumno pintando a mano en el taller de Pintura",
      encuadre: "completa",
    },
    productos: ["Llaveros", "Camisas", "Gorras"],
    tienda: { etiqueta: "Ver en La Rioja Shop", href: "/productos" },
  },
];

/**
 * Cuatro áreas de habilidades para la vida independiente, en el orden de
 * presentación. Cocina se movió aquí desde talleres productivos.
 */
export const HABILIDADES: Programa[] = [
  {
    id: "huerto",
    titulo: "Huerto",
    descripcion: "Siembran, riegan y cosechan, aprendiendo constancia y cuidado del entorno.",
    // Placeholder — reemplazar con foto definitiva del huerto escolar.
    foto: {
      src: "/nosotros/cierre-taller.webp",
      alt: "Alumnos trabajando en el huerto escolar",
      encuadre: "recortada",
    },
  },
  {
    id: "computacion",
    titulo: "Computación",
    descripcion:
      "Usan la computadora y el teléfono para comunicarse, buscar información y hacer trámites.",
    foto: {
      src: "/nosotros/taller-computacion.webp",
      alt: "Alumna usando la computadora en el taller de Computación",
      encuadre: "recortada",
    },
  },
  {
    id: "cocina",
    titulo: "Cocina",
    descripcion:
      "Preparan comidas sencillas y aprenden a planificar, medir y mantener limpia la cocina.",
    foto: {
      src: "/apoyanos/logro-comedor.webp",
      alt: "Alumnos preparando alimentos en el área de Cocina",
      encuadre: "recortada",
    },
  },
  {
    id: "artistica",
    titulo: "Artística",
    descripcion:
      "Expresan ideas y emociones con dibujo, música y manualidades, y ganan confianza en sí mismos.",
    // Placeholder — reemplazar con foto definitiva de actividad artística.
    foto: {
      src: "/nosotros/hero-estudiantes.webp",
      alt: "Alumnos en actividad artística",
      encuadre: "completa",
    },
  },
];

// ---------------------------------------------------------------------------
// MarcoFoto — marco 4:3 con dos modos de encuadre
// ---------------------------------------------------------------------------

interface MarcoFotoProps {
  src: string;
  alt: string;
  encuadre?: "completa" | "recortada";
  /** CSS object-position; solo en modo "recortada". Por defecto "50% 35%". */
  foco?: string;
  priority?: boolean;
  /** Atributo sizes de Next/Image para optimización responsiva. */
  sizes?: string;
}

/**
 * Contenedor 4:3 que evita el recorte no deseado de personas y productos.
 *
 * - **completa**: muestra la foto entera con object-contain; el espacio
 *   sobrante se rellena con la misma imagen desenfocada (misma URL → una
 *   sola descarga en el navegador).
 * - **recortada**: llena el marco con object-cover respetando el punto de
 *   foco indicado (por defecto 50 % horizontal, 35 % vertical para priorizar
 *   rostros).
 */
function MarcoFoto({
  src,
  alt,
  encuadre = "completa",
  foco = "50% 35%",
  priority = false,
  sizes = "(max-width: 767px) 100vw, 58vw",
}: MarcoFotoProps) {
  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl">
      {encuadre === "completa" ? (
        <>
          {/* Fondo desenfocado — decorativo, misma URL optimizada */}
          <Image
            src={src}
            alt=""
            aria-hidden
            fill
            sizes={sizes}
            className="scale-110 object-cover opacity-50 blur-xl"
          />
          {/* Foto principal sin recorte */}
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            priority={priority}
            className="relative z-10 object-contain"
          />
        </>
      ) : (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          style={{ objectPosition: foco }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// SeccionTalleres
// ---------------------------------------------------------------------------

/**
 * Sección #talleres — cuatro talleres productivos en filas alternadas
 * foto/texto que enlazan a La Rioja Shop.
 *
 * Server Component puro (sin "use client"); el contenido está en la constante
 * TALLERES. Fase futura: leer de site_content (ver spec §6.4).
 */
export function SeccionTalleres({ talleres = TALLERES }: { talleres?: Programa[] }) {
  return (
    <section
      id="talleres"
      className={`bg-white dark:bg-slate-950 ${SECTION_ANCHOR}`}
      aria-labelledby="talleres-titulo"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        {/* Encabezado de sección */}
        <div className="mb-12 flex flex-col gap-3">
          <h2 id="talleres-titulo" className={H2}>
            Talleres donde se aprende haciendo
          </h2>
          <p className={`max-w-[672px] text-lg leading-relaxed ${MUTED}`}>
            Cuatro talleres productivos donde los alumnos elaboran artículos reales que se venden en
            La Rioja Shop.
          </p>
        </div>

        {/* Lista de talleres */}
        <ul role="list" className="flex flex-col gap-16 md:gap-20">
          {talleres.map((taller, i) => (
            <li key={taller.id}>
              <article id={taller.id} className="scroll-mt-[110px]">
                <div
                  className={`flex w-full flex-col items-center gap-8 md:gap-12 ${
                    i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"
                  }`}
                >
                  {/* Foto */}
                  <div className="w-full md:w-[58%] md:shrink-0">
                    <MarcoFoto
                      src={taller.foto.src}
                      alt={taller.foto.alt}
                      encuadre={taller.foto.encuadre}
                      foco={taller.foto.foco}
                      priority={i === 0}
                      sizes="(max-width: 767px) 100vw, (max-width: 1151px) 58vw, 668px"
                    />
                  </div>

                  {/* Texto */}
                  <div className="flex w-full flex-col gap-4 md:flex-1">
                    <h3 className={H3}>{taller.titulo}</h3>
                    <p className={`text-base leading-relaxed md:text-lg ${MUTED}`}>
                      {taller.descripcion}
                    </p>

                    {/* Productos */}
                    {taller.productos && taller.productos.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <p className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-white/50">
                          Lo que elaboran
                        </p>
                        <ul role="list" className="flex flex-wrap gap-2">
                          {taller.productos.map((prod) => (
                            <li
                              key={prod}
                              className="rounded-full bg-larioja-verde/10 px-3 py-1 text-sm font-medium text-larioja-verde-texto dark:bg-larioja-verde/20 dark:text-green-300"
                            >
                              {prod}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Botón hacia la tienda */}
                    {taller.tienda && (
                      <Link
                        href={taller.tienda.href}
                        className={`${BTN_YELLOW} self-start rounded-full px-6 text-sm`}
                      >
                        {taller.tienda.etiqueta}
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// SeccionHabilidades
// ---------------------------------------------------------------------------

/**
 * Sección #vida-independiente — cuatro áreas en cuadrícula compacta sobre
 * fondo azul claro.
 *
 * Server Component puro (sin "use client"); el contenido está en la constante
 * HABILIDADES. Fase futura: leer de site_content (ver spec §6.4).
 */
export function SeccionHabilidades({ habilidades = HABILIDADES }: { habilidades?: Programa[] }) {
  return (
    <section
      id="vida-independiente"
      className={`bg-[#EEF4FB] dark:bg-slate-900/50 ${SECTION_ANCHOR}`}
      aria-labelledby="habilidades-titulo"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        {/* Encabezado de sección */}
        <div className="mb-10 flex flex-col gap-3">
          <h2 id="habilidades-titulo" className={H2}>
            Habilidades para la vida independiente
          </h2>
          <p className={`max-w-[672px] text-lg leading-relaxed ${MUTED}`}>
            Actividades que fortalecen la autonomía en el hogar, la comunidad y el trabajo.
          </p>
        </div>

        {/* Cuadrícula de tarjetas */}
        <ul role="list" className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {habilidades.map((hab, i) => (
            <li key={hab.id} className="flex">
              <article
                id={hab.id}
                className="scroll-mt-[110px] flex w-full flex-col overflow-hidden rounded-xl border-t-4 border-larioja-verde bg-white dark:bg-surface-card"
              >
                {/* Foto */}
                <MarcoFoto
                  src={hab.foto.src}
                  alt={hab.foto.alt}
                  encuadre={hab.foto.encuadre}
                  foco={hab.foto.foco}
                  priority={i < 2}
                  sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                />

                {/* Texto */}
                <div className="flex flex-col gap-2 p-5">
                  <h3 className="font-montserrat text-[20px] font-bold leading-snug text-larioja-azul dark:text-white">
                    {hab.titulo}
                  </h3>
                  <p className={`text-sm leading-relaxed ${MUTED}`}>{hab.descripcion}</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
