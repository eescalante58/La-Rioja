import { getActivityLogs } from "./actions";
import LogViewerClient from "./LogViewerClient";
import { requireRoleLevel } from "@/lib/auth/authorization";
import AccessDenied from "@/components/admin/AccessDenied";

/**
 * Activity Logs viewer page (nivel >= 8: admin de empresa).
 * Verifica el nivel antes de cargar para mostrar un mensaje amigable
 * en lugar de reventar cuando el guard devuelve {success:false}.
 */
export default async function LogsSettingsPage() {
  const { level, error } = await requireRoleLevel(8);
  if (error) {
    return (
      <AccessDenied
        requiredLevel={8}
        currentLevel={level}
        section="Bitácora de Actividad"
      />
    );
  }

  const logs = await getActivityLogs();

  return <LogViewerClient initialData={Array.isArray(logs) ? logs : []} />;
}
