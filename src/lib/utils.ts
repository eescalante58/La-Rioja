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
