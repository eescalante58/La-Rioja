import { getUsersWithRoles, getRoles } from "./actions";
import { getCompanies } from "../companies/actions";
import UserManagerClient from "./UserManagerClient";

/**
 * Users and Roles management page.
 * Server component that fetches data and renders the client manager.
 */
export default async function UsersSettingsPage() {
  const [users, roles, companies] = await Promise.all([
    getUsersWithRoles(),
    getRoles(),
    getCompanies(),
  ]);

  return (
    <UserManagerClient
      initialUsers={users}
      roles={roles}
      companies={companies}
    />
  );
}
