/**
 * Reglas de fortaleza de contraseña (idénticas a las mostradas en el
 * login y en PasswordRequirements): mínimo 8 caracteres, una mayúscula,
 * un dígito y un carácter especial.
 *
 * Devuelve el mensaje de error del primer requisito incumplido, o null
 * si la contraseña es válida. Importable tanto en servidor (acciones)
 * como en cliente (validación previa al submit).
 */
export function validatePasswordStrength(password: string): string | null {
  if (typeof password !== "string" || password.length < 8) {
    return "La contraseña debe tener al menos 8 caracteres";
  }
  if (!/[A-Z]/.test(password)) {
    return "Debe incluir al menos una letra mayúscula";
  }
  if (!/[0-9]/.test(password)) {
    return "Debe incluir al menos un dígito (0-9)";
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return "Debe incluir al menos un carácter especial";
  }
  return null;
}
