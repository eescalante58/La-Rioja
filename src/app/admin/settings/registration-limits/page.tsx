import { getRegistrationLimits } from "./actions";
import RegistrationLimitsClient from "./RegistrationLimitsClient";
import { requireRoleLevel } from "@/lib/auth/authorization";
import AccessDenied from "@/components/admin/AccessDenied";

/**
 * Página de límites anti-abuso del registro público de cartones
 * (nivel 10: Super Admin). Permite alternar entre modo 'normal' y
 * 'evento' sin tocar SQL.
 */
export default async function RegistrationLimitsPage() {
  const { level, error } = await requireRoleLevel(10);
  if (error) {
    return (
      <AccessDenied
        requiredLevel={10}
        currentLevel={level}
        section="Límites de Registro"
      />
    );
  }

  const result = await getRegistrationLimits();

  return (
    <RegistrationLimitsClient initial={result} />
  );
}
