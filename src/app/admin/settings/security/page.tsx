import {
  getSecurityAdvisors,
  getRLSStatus,
  getViewsStatus,
} from "./actions";
import SecurityManagerClient from "./SecurityManagerClient";
import { requireRoleLevel } from "@/lib/auth/authorization";
import AccessDenied from "@/components/admin/AccessDenied";

/**
 * Security page for administration (nivel 10: Super Admin).
 * Displays RLS status and security advisors.
 */
export default async function SecurityPage() {
  const { level, error } = await requireRoleLevel(10);
  if (error) {
    return (
      <AccessDenied
        requiredLevel={10}
        currentLevel={level}
        section="Seguridad y RLS"
      />
    );
  }

  const [advisors, rlsStatus, viewsStatus] = await Promise.all([
    getSecurityAdvisors(),
    getRLSStatus(),
    getViewsStatus(),
  ]);

  return (
    <SecurityManagerClient
      initialAdvisors={Array.isArray(advisors) ? advisors : []}
      initialRLS={Array.isArray(rlsStatus) ? rlsStatus : []}
      initialViews={Array.isArray(viewsStatus) ? viewsStatus : []}
    />
  );
}
