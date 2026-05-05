import {
  getSecurityAdvisors,
  getRLSStatus,
  getViewsStatus,
  getTablePolicies,
} from "./actions";
import SecurityManagerClient from "./SecurityManagerClient";

/**
 * Security page for administration.
 * Displays RLS status and security advisors.
 */
export default async function SecurityPage() {
  const [advisors, rlsStatus, viewsStatus] = await Promise.all([
    getSecurityAdvisors(),
    getRLSStatus(),
    getViewsStatus(),
  ]);

  return (
    <SecurityManagerClient
      initialAdvisors={advisors}
      initialRLS={rlsStatus}
      initialViews={viewsStatus}
      fetchTablePolicies={getTablePolicies}
    />
  );
}
