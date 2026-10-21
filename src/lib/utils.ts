import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with clsx and tailwind-merge.
 * @param {...ClassValue[]} inputs - The classes to merge.
 * @returns {string} The merged class string.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Escapes HTML special characters to prevent XSS and HTML injection.
 * @param {string} str - The string to escape.
 * @returns {string} The escaped string.
 */
export function escapeHTML(str: string): string {
  if (!str) return "";
  return str.replace(/[&<>"']/g, (m) => {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return map[m];
  });
}

/**
 * Obtiene un mensaje legible de un error capturado en `catch`, cuyo tipo
 * es `unknown`: usa `message` si es un `Error` (o un objeto con `message`,
 * como los errores de Supabase) y si no lo convierte a texto.
 * @param {unknown} error - Valor capturado.
 * @returns {string} Mensaje del error.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    return (error as { message: string }).message;
  }
  return String(error);
}

/**
 * Convierte un error técnico (PostgreSQL, Supabase RLS, red, validación)
 * en un mensaje claro, amigable y comprensible para el usuario final.
 * @param {unknown} error - Error o mensaje a formatear.
 * @returns {string} Mensaje traducido y amigable en español.
 */
export function formatFriendlyError(error: unknown): string {
  const rawMsg = getErrorMessage(error);
  if (!rawMsg) return "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.";

  const lower = rawMsg.toLowerCase();

  if (
    lower.includes("row-level security") ||
    lower.includes("rls policy") ||
    lower.includes("violates row-level")
  ) {
    return "No tienes permisos suficientes para modificar este contenido. Consulta con el Administrador para que se asignen los permisos correspondientes a tu rol.";
  }
  if (
    lower.includes("permission denied") ||
    lower.includes("not authorized") ||
    lower.includes("no autorizado")
  ) {
    return "Acceso denegado: tu cuenta de usuario no tiene autorización para realizar esta acción.";
  }
  if (lower.includes("unique constraint") || lower.includes("duplicate key")) {
    return "Ya existe un registro con la misma clave o identificador en el sistema.";
  }
  if (lower.includes("foreign key") || lower.includes("violates foreign key")) {
    return "No se puede completar la operación porque este elemento está vinculado a otros registros del sistema.";
  }
  if (lower.includes("not-null") || lower.includes("null value in column")) {
    return "Faltan datos obligatorios. Por favor, completa todos los campos requeridos.";
  }
  if (lower.includes("jwt") || lower.includes("token") || lower.includes("session")) {
    return "Tu sesión ha expirado o no es válida. Por favor, inicia sesión nuevamente.";
  }
  if (
    lower.includes("failed to fetch") ||
    lower.includes("networkerror") ||
    lower.includes("fetch failed")
  ) {
    return "Error de conexión con el servidor. Por favor, verifica tu conexión a internet e inténtalo de nuevo.";
  }

  return rawMsg;
}

/**
 * Normaliza una relación embebida many-to-one de Supabase
 * (p. ej. `roles:role_id (level)`). Sin tipos de esquema en el cliente,
 * postgrest-js la infiere como arreglo, aunque en ejecución llega como
 * objeto; esta función acepta ambas formas y devuelve el objeto o null.
 * @param {T | T[] | null | undefined} relation - Relación embebida.
 * @returns {T | null} El registro relacionado, o null.
 */
export function singleRelation<T>(relation: T | T[] | null | undefined): T | null {
  if (Array.isArray(relation)) return relation[0] ?? null;
  return relation ?? null;
}
