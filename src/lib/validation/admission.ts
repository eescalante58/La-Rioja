import { z } from "zod";
import type { CmsSection } from "@/lib/cms-content";

/**
 * Categorías temáticas para organizar visualmente los documentos.
 */
export type AdmissionCategory = "identidad" | "salud" | "educacion" | "fotos" | "general";

/**
 * Estructura de un ítem individual de requisito de matrícula.
 */
export interface AdmissionRequirementItem {
  id: string;
  texto: string;
  nota?: string;
  categoria?: AdmissionCategory;
}

/**
 * Configuración completa del modal de requisitos leída desde el CMS (`cl_admision`).
 */
export interface AdmissionRequirementsConfig {
  titulo: string;
  subtitulo: string;
  boton: string;
  pie: string;
  items: AdmissionRequirementItem[];
}

/**
 * Esquema Zod para validar ítems individuales.
 */
export const admissionRequirementItemSchema = z.object({
  id: z.string().default(() => Math.random().toString(36).substring(2, 9)),
  texto: z.string().min(1, "El texto del documento es obligatorio"),
  nota: z.string().optional().default(""),
  categoria: z
    .enum(["identidad", "salud", "educacion", "fotos", "general"])
    .optional()
    .default("general"),
});

/**
 * 11 Requisitos predeterminados oficiales para estudiantes de nuevo ingreso.
 */
export const DEFAULT_ADMISSION_ITEMS: AdmissionRequirementItem[] = [
  {
    id: "req-1",
    texto: "Copia de DUI",
    nota: "si el alumno es mayor de edad",
    categoria: "identidad",
  },
  {
    id: "req-2",
    texto: "Partida de nacimiento",
    nota: "si es menor de 18 años",
    categoria: "identidad",
  },
  {
    id: "req-3",
    texto: "Copia de DUI de los responsables o cuidadores del alumno",
    nota: "padres de familia",
    categoria: "identidad",
  },
  {
    id: "req-4",
    texto: "Constancia de buena salud",
    nota: "emitida por el médico de cabecera",
    categoria: "salud",
  },
  {
    id: "req-5",
    texto: "Diagnóstico clínico neurológico",
    nota: "reciente máximo 1 año",
    categoria: "salud",
  },
  {
    id: "req-6",
    texto: "Diagnóstico psiquiátrico",
    nota: "",
    categoria: "salud",
  },
  {
    id: "req-7",
    texto: "Diagnóstico psicológico",
    nota: "cada uno de estos diagnósticos emitidos por el médico que atiende al joven",
    categoria: "salud",
  },
  {
    id: "req-8",
    texto: "Descripción de los medicamentos que recibe el joven",
    nota: "bajo indicación médica",
    categoria: "salud",
  },
  {
    id: "req-9",
    texto: "Constancia de permanencia y desempeño de la institución educativa anterior",
    nota: "colegio o escuela",
    categoria: "educacion",
  },
  {
    id: "req-10",
    texto: "Constancia de pago",
    nota: "en el caso de proceder de una institución privada",
    categoria: "educacion",
  },
  {
    id: "req-11",
    texto: "2 fotografías tamaño diploma y 1 fotografía de cuerpo completo",
    nota: "del estudiante",
    categoria: "fotos",
  },
];

export const DEFAULT_ADMISSION_CONFIG: AdmissionRequirementsConfig = {
  titulo: "Documentos a presentar para proceso de estudiantes de nuevo ingreso",
  subtitulo:
    "Presentar la siguiente documentación en original y copia para conformar el expediente del aspirante:",
  boton: "Ver lista de requisitos (11 documentos)",
  pie: "Todos los documentos deben presentarse en original y copia para confrontación en el momento de la entrevista presencial.",
  items: DEFAULT_ADMISSION_ITEMS,
};

/**
 * Función que detecta notas entre paréntesis en un string y asigna categoría automática.
 * Ej: "Copia de DUI (si el alumno es mayor de edad)" -> texto: "Copia de DUI", nota: "si el alumno es mayor de edad"
 */
export function parseRequirementLine(line: string, index: number): AdmissionRequirementItem {
  const clean = line.trim().replace(/^[-*•\d.]+\s*/, "");
  const match = clean.match(/^(.*?)(?:\s*\((.*?)\))\s*$/);

  let texto = clean;
  let nota = "";
  if (match) {
    texto = match[1].trim();
    nota = match[2].trim();
  }

  // Deducción automática de categoría según palabras clave
  const lower = clean.toLowerCase();
  let categoria: AdmissionCategory = "general";
  if (lower.includes("dui") || lower.includes("partida") || lower.includes("nacimiento")) {
    categoria = "identidad";
  } else if (
    lower.includes("salud") ||
    lower.includes("diagnóstico") ||
    lower.includes("diagnostico") ||
    lower.includes("neurológico") ||
    lower.includes("psiquiátrico") ||
    lower.includes("psicólogo") ||
    lower.includes("psicológico") ||
    lower.includes("medicamento")
  ) {
    categoria = "salud";
  } else if (
    lower.includes("constancia de permanencia") ||
    lower.includes("institución educativa") ||
    lower.includes("colegio") ||
    lower.includes("escuela") ||
    lower.includes("pago")
  ) {
    categoria = "educacion";
  } else if (lower.includes("foto") || lower.includes("fotografía") || lower.includes("diploma")) {
    categoria = "fotos";
  }

  return {
    id: `req-${index + 1}`,
    texto,
    nota,
    categoria,
  };
}

/**
 * Extrae y valida la configuración de requisitos desde la metadata de `cl_admision`.
 * Si no está configurada, retorna los valores predeterminados garantizando que la UI nunca quede vacía.
 */
export function getAdmissionRequirementsConfig(
  section: CmsSection | undefined,
): AdmissionRequirementsConfig {
  const meta = section?.metadata || {};

  const titulo =
    typeof meta.requisitos_titulo === "string" && meta.requisitos_titulo.trim() !== ""
      ? meta.requisitos_titulo.trim()
      : DEFAULT_ADMISSION_CONFIG.titulo;

  const subtitulo =
    typeof meta.requisitos_subtitulo === "string" && meta.requisitos_subtitulo.trim() !== ""
      ? meta.requisitos_subtitulo.trim()
      : DEFAULT_ADMISSION_CONFIG.subtitulo;

  const boton =
    typeof meta.requisitos_boton === "string" && meta.requisitos_boton.trim() !== ""
      ? meta.requisitos_boton.trim()
      : DEFAULT_ADMISSION_CONFIG.boton;

  const pie =
    typeof meta.requisitos_pie === "string" && meta.requisitos_pie.trim() !== ""
      ? meta.requisitos_pie.trim()
      : DEFAULT_ADMISSION_CONFIG.pie;

  let items: AdmissionRequirementItem[] = [];

  // Caso 1: Array de objetos estructurados en metadata.requisitos_items
  if (Array.isArray(meta.requisitos_items) && meta.requisitos_items.length > 0) {
    items = meta.requisitos_items
      .map((it: unknown, idx: number) => {
        if (typeof it === "string") {
          return parseRequirementLine(it, idx);
        }
        if (typeof it === "object" && it !== null) {
          const rec = it as Record<string, unknown>;
          return {
            id: typeof rec.id === "string" ? rec.id : `req-${idx + 1}`,
            texto: typeof rec.texto === "string" ? rec.texto.trim() : "",
            nota: typeof rec.nota === "string" ? rec.nota.trim() : undefined,
            categoria: (rec.categoria as AdmissionCategory) || "general",
          };
        }
        return null;
      })
      .filter((it): it is AdmissionRequirementItem => Boolean(it && it.texto));
  }
  // Caso 2: Texto multilinea en metadata.requisitos_texto
  else if (typeof meta.requisitos_texto === "string" && meta.requisitos_texto.trim() !== "") {
    items = meta.requisitos_texto
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, idx) => parseRequirementLine(line, idx));
  }

  // Fallback si no hay ítems configurados aún
  if (items.length === 0) {
    items = DEFAULT_ADMISSION_ITEMS;
  }

  return {
    titulo,
    subtitulo,
    boton,
    pie,
    items,
  };
}
