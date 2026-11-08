import {
  getUsers,
  getCountryCodes,
  getSecRoles,
  getModuleTree,
  getSecPermissions,
  getSecUserRoles,
} from "./actions";
import { getCompanies } from "../companies/actions";
import SecurityModuleTabs from "./SecurityModuleTabs";
import { createClient } from "@/lib/supabase/server";
import { requireRoleLevel } from "@/lib/auth/authorization";
import { redirect } from "next/navigation";

/**
 * Página de gestión de usuarios y seguridad.
 */
export default async function UsersSettingsPage() {
  try {
    const { requireOption } = await import("@/lib/security/server");
    await requireOption("CFG_USERS_ROLES");
  } catch {
    const { error } = await requireRoleLevel(8);
    if (error) redirect("/admin/settings");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [users, companies, countryCodes, secRoles, moduleTree, permissions, userRoleAssignments] =
    await Promise.all([
      getUsers(),
      getCompanies(),
      getCountryCodes(),
      getSecRoles().catch(() => []),
      getModuleTree().catch(() => []),
      getSecPermissions().catch(() => []),
      getSecUserRoles().catch(() => []),
    ]);

  return (
    <SecurityModuleTabs
      initialUsers={users}
      companies={companies}
      countryCodes={countryCodes}
      currentUserId={user?.id}
      secRoles={secRoles}
      moduleTree={moduleTree as Parameters<typeof SecurityModuleTabs>[0]["moduleTree"]}
      permissions={permissions}
      userRoleAssignments={
        userRoleAssignments as Parameters<typeof SecurityModuleTabs>[0]["userRoleAssignments"]
      }
    />
  );
}
