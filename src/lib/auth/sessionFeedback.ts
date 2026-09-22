/**
 * Detecta respuestas de server actions que indican sesión expirada o
 * ausente ("No autenticado"), avisa al usuario con un mensaje claro y lo
 * redirige a la pantalla de login.
 *
 * Uso típico en handlers de formularios admin:
 * ```ts
 * if (result?.success) { ... }
 * else if (!redirectIfSessionExpired(result)) { alert(result?.error) }
 * ```
 *
 * @param result Resultado devuelto por el server action.
 * @returns true si el resultado correspondía a una sesión inválida
 *          (ya se mostró el aviso y se inició la redirección).
 */
export function redirectIfSessionExpired(
  result: { error?: string } | null | undefined,
): boolean {
  const message = result?.error || "";
  if (!/no autenticado|unauthorized|sesi[oó]n|session/i.test(message)) {
    return false;
  }
  alert(
    "Tu sesión expiró por inactividad. Vuelve a iniciar sesión para continuar.",
  );
  window.location.href = "/login";
  return true;
}
