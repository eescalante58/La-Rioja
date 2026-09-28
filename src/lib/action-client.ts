/**
 * Cliente JSON para el dispatcher `POST /api/actions`.
 *
 * Sustituye a las llamadas directas a Server Actions desde componentes
 * `"use client"`: evita que cada operación gatille un re-render completo
 * del payload RSC de la página (regla `no-rerender-completo`).
 *
 * La respuesta es el objeto que devuelve la acción
 * (`{ success, data, error }` según corresponda), idéntico al que el
 * componente recibía antes de la migración.
 */

const ENDPOINT = "/api/actions";

/** Token reconocido por el dispatcher para inyectar el FormData en `args`. */
const FORMDATA_TOKEN = "$formData";

/**
 * Invoca una acción registrada con argumentos JSON serializables.
 * @param name Nombre del registro, p. ej. `"bingo.getWheels"`.
 * @param args Argumentos posicionales de la acción.
 */
export async function callAction<T = unknown>(
  name: string,
  args: unknown[] = [],
): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, args }),
  });
  return (await res.json()) as T;
}

/**
 * Invoca una acción cuyo último (o único) argumento es un `FormData`
 * (cargas de archivos, formularios nativos). Los `args` se envían por
 * multipart junto con el propio FormData.
 * @param name Nombre del registro, p. ej. `"bingo.saveEvent"`.
 * @param formData FormData construido por el componente.
 * @param leadingArgs Argumentos posicionales previos al FormData.
 */
export async function callActionForm<T = unknown>(
  name: string,
  formData: FormData,
  leadingArgs: unknown[] = [],
): Promise<T> {
  formData.append("name", name);
  formData.append("args", JSON.stringify([...leadingArgs, FORMDATA_TOKEN]));

  const res = await fetch(ENDPOINT, { method: "POST", body: formData });
  return (await res.json()) as T;
}
