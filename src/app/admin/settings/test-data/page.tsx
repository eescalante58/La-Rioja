import { requireRoleLevel } from "@/lib/auth/authorization";
import AccessDenied from "@/components/admin/AccessDenied";
import { createAdminClient } from "@/lib/supabase/server";
import TestDataClient from "./TestDataClient";

/**
 * Página "Crear datos de prueba" (nivel 10: Super Admin).
 * Carga el catálogo empresa/evento en el servidor y delega la copia
 * al client component vía dispatcher (`testData.cloneEventData`).
 */
export default async function TestDataPage() {
  const { level, error } = await requireRoleLevel(10);
  if (error) {
    return (
      <AccessDenied
        requiredLevel={10}
        currentLevel={level}
        section="Crear Datos de Prueba"
      />
    );
  }

  const supabase = createAdminClient();
  const [{ data: companies }, { data: events }] = await Promise.all([
    supabase
      .from("companies")
      .select("company_id, company_name")
      .order("company_name", { ascending: true }),
    supabase
      .from("events")
      .select("company_id, event_id, event_name")
      .order("event_name", { ascending: true }),
  ]);

  return (
    <TestDataClient
      companies={companies || []}
      events={events || []}
    />
  );
}
