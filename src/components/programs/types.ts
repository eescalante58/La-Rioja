/**
 * Tipos de contenido de la página Programas, ya leídos de las filas `cl_*`
 * del CMS (ver supabase/migrations/20261023000000_programas_cms_secciones.sql).
 */

/** Programa por rango de edad (Colegio o CFL). */
export interface AgeProgram {
  /** Ancla de la tarjeta: `#colegio` o `#cfl`. */
  id: "colegio" | "cfl";
  name: string;
  /** Texto corto de la pestaña en celular («Colegio», «CFL»). */
  tab: string;
  /** Rango de edad («De 12 a 20 años»). */
  ages: string;
  /** Enfoque («Educación formal»). */
  focus: string;
  text: string;
  /** Lo que incluye el programa. */
  includes: string[];
  cta: { label: string; href: string };
  /** Tarjeta destacada (borde azul e insignia amarilla). */
  featured: boolean;
}

/** Nivel de la ruta de formación del CFL. */
export interface AdaptiveLevel {
  n: number;
  name: string;
  goal: string;
  approach: string;
  outcome: string;
}

/** Eje curricular común a todos los niveles. */
export interface CurriculumAxis {
  key: string;
  area: string;
  name: string;
  text: string;
}

/** Grupo de un taller, usado por los filtros. */
export type WorkshopGroup = "productivo" | "vida-independiente";

/** Taller vocacional. */
export interface Workshop {
  slug: string;
  name: string;
  group: WorkshopGroup;
  skills: string;
  impact: string;
  products: string;
  image?: { url: string; alt: string };
  /** Etiqueta del taller destacado («Taller insignia»); vacío si no lo es. */
  badge: string;
}

/** Materia complementaria de la formación integral. */
export interface IntegralSubject {
  key: string;
  name: string;
  role: string;
  text: string;
}

/** Paso del proceso de admisión. */
export interface AdmissionStep {
  key: string;
  title: string;
  text: string;
}

/** Dato útil de admisión (solo los que tienen valor). */
export interface AdmissionFact {
  label: string;
  value: string;
}
