"use client";

import { useState } from "react";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@tremor/react";
import { Users, Shield, UserCheck } from "lucide-react";
import dynamic from "next/dynamic";

const PermissionMatrixClient = dynamic(() => import("./PermissionMatrixClient"), {
  loading: () => (
    <div className="h-96 w-full bg-slate-900/5 dark:bg-slate-100/5 animate-pulse rounded-2xl" />
  ),
});
const UserRolesClient = dynamic(() => import("./UserRolesClient"), {
  loading: () => (
    <div className="h-96 w-full bg-slate-900/5 dark:bg-slate-100/5 animate-pulse rounded-2xl" />
  ),
});

// Tipos importados desde las pantallas legacy para reutilizar en el tab Usuarios
import type UserManagerClient from "./UserManagerClient";
type UserManagerProps = React.ComponentProps<typeof UserManagerClient>;

// Tipos para las nuevas pantallas de seguridad
export interface SecRole {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_super_admin: boolean;
  is_system: boolean;
  is_active: boolean;
}

export interface SecModule {
  id: string;
  code: string;
  name: string;
  icon: string | null;
  order_index: number;
  options: SecOption[];
}

export interface SecOption {
  id: string;
  code: string;
  name: string;
  path_route: string;
  order_index: number;
  resources: SecResource[];
}

export interface SecResource {
  id: string;
  table_name: string;
  display_name: string;
}

export interface SecPermission {
  role_id: string;
  option_id: string;
  resource_id: string | null;
  actions_mask: number;
}

export interface SecUserRole {
  id: string;
  user_id: string;
  role_id: string;
  valid_from: string;
  valid_to: string | null;
  is_active: boolean;
  sec_roles: Array<{ code: string; name: string }> | null;
}

interface Props extends UserManagerProps {
  secRoles: SecRole[];
  moduleTree: SecModule[];
  permissions: SecPermission[];
  userRoleAssignments: SecUserRole[];
  UserManagerComponent: React.ComponentType<UserManagerProps>;
}

export default function SecurityModuleTabs({
  secRoles,
  moduleTree,
  permissions,
  userRoleAssignments,
  UserManagerComponent,
  ...userManagerProps
}: Props) {
  const [tabIndex, setTabIndex] = useState(0);

  return (
    <TabGroup index={tabIndex} onIndexChange={setTabIndex}>
      <div className="sticky top-0 z-30 bg-white dark:bg-black -mx-4 md:-mx-6 px-4 md:px-6 border-b border-gray-200 dark:border-gray-800 mb-6">
        <TabList>
          <Tab icon={Users}>Usuarios</Tab>
          <Tab icon={Shield}>Roles · Permisos</Tab>
          <Tab icon={UserCheck}>Asignación de Roles</Tab>
        </TabList>
      </div>
      <TabPanels>
        <TabPanel>
          <UserManagerComponent {...userManagerProps} />
        </TabPanel>
        <TabPanel>
          <PermissionMatrixClient
            secRoles={secRoles}
            moduleTree={moduleTree}
            initialPermissions={permissions}
          />
        </TabPanel>
        <TabPanel>
          <UserRolesClient
            users={
              userManagerProps.initialUsers as Array<{
                id: string;
                full_name: string | null;
                email: string;
                avatar_url: string | null;
              }>
            }
            secRoles={secRoles}
            initialAssignments={userRoleAssignments}
          />
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
}
