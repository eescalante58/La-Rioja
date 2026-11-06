import { getUsersWithRoles, getRoles, getCountryCodes, getSecRoles, getModuleTree, getSecPermissions, getSecUserRoles } from "./actions";
import { getCompanies } from "../companies/actions";
import UserManagerClient from "./UserManagerClient";
import SecurityModuleTabs from "./SecurityModuleTabs";
import { createClient } from "@/lib/supabase/server";
import { requireRoleLevel } from "@/lib/auth/authorization";
import { redirect } from "next/navigation";

/**
 * Users and Roles management page.
 * Server component that fetches data and renders the client manager with security tabs.
 */
export default async function UsersSettingsPage() {
  // Guard dual: intenta el nuevo sistema; si no está activo, usa el sistema legacy.
  try {
    const { requireOption } = await import("@/lib/security/server");
    await requireOption("CFG_USERS_ROLES");
  } catch {
    // JWT hook no activado aún o RPC no disponible: usar guard legacy
    const { error } = await requireRoleLevel(8);
    if (error) redirect("/admin/settings");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Cargar datos legacy y datos del módulo de seguridad en paralelo
  const [users, roles, companies, countryCodes, secRoles, moduleTree, permissions, userRoleAssignments] =
    await Promise.all([
      getUsersWithRoles(),
      getRoles(),
      getCompanies(),
      getCountryCodes(),
      getSecRoles().catch(() => []),
      getModuleTree().catch(() => []),
      getSecPermissions().catch(() => []),
      getSecUserRoles().catch(() => []),
    ]);

  // Si hay tablas sec_* disponibles, mostrar la vista con tabs de seguridad
  const hasSecurityModule = secRoles.length > 0;

  if (hasSecurityModule) {
    return (
      <SecurityModuleTabs
        initialUsers={users}
        roles={roles}
        companies={companies}
        countryCodes={countryCodes}
        currentUserId={user?.id}
        secRoles={secRoles}
        moduleTree={moduleTree as Parameters<typeof SecurityModuleTabs>[0]["moduleTree"]}
        permissions={permissions}
        userRoleAssignments={userRoleAssignments as Parameters<typeof SecurityModuleTabs>[0]["userRoleAssignments"]}
        UserManagerComponent={UserManagerClient}
      />
    );
  }

  // Fallback: vista original si el módulo de seguridad aún no está instalado
  return (
    <UserManagerClient
      initialUsers={users}
      roles={roles}
      companies={companies}
      countryCodes={countryCodes}
      currentUserId={user?.id}
    />
  );
}
