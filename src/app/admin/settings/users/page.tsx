import { getUsersWithRoles, getRoles, getCountryCodes } from "./actions";
import { getCompanies } from "../companies/actions";
import UserManagerClient from "./UserManagerClient";
import { createClient } from "@/lib/supabase/server";

/**
 * Users and Roles management page.
 * Server component that fetches data and renders the client manager.
 */
export default async function UsersSettingsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [users, roles, companies, countryCodes] = await Promise.all([
    getUsersWithRoles(),
    getRoles(),
    getCompanies(),
    getCountryCodes(),
  ]);

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
