import { getRegistrationLimits, setRegistrationMode } from "./actions";
import RegistrationLimitsClient from "./RegistrationLimitsClient";

/**
 * Página de límites anti-abuso del registro público de cartones.
 * Permite alternar entre modo 'normal' y 'evento' sin tocar SQL.
 */
export default async function RegistrationLimitsPage() {
  const result = await getRegistrationLimits();

  return (
    <RegistrationLimitsClient
      initial={result}
      setMode={setRegistrationMode}
    />
  );
}
