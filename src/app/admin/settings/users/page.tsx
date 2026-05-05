import { getUsersWithRoles, getRoles } from "./actions";
import UserManagerClient from "./UserManagerClient";

/**
 * Users and Roles management page.
 * Server component that fetches data and renders the client manager.
 */
export default async function UsersSettingsPage() {
  const [users, roles] = await Promise.all([
    getUsersWithRoles(),
    getRoles(),
  ]);

  return <UserManagerClient initialUsers={users} roles={roles} />;
}
