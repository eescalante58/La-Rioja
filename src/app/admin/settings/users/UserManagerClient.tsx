"use client";

import { useState } from "react";
import {
  Card,
  Title,
  Text,
  Button,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  TextInput,
} from "@tremor/react";
import {
  Search,
  ArrowLeft,
  Shield,
  Plus,
  Users as UsersIcon,
} from "lucide-react";
import Link from "next/link";
import { deleteUser, deleteRole } from "./actions";
import dynamic from "next/dynamic";

// Dynamic imports for sub-components
const UserTable = dynamic(() => import("@/components/admin/users/UserTable"), {
  loading: () => (
    <div className="h-96 w-full bg-slate-900/5 animate-pulse rounded-2xl" />
  ),
});
const RoleTable = dynamic(() => import("@/components/admin/users/RoleTable"), {
  loading: () => (
    <div className="h-48 w-full bg-slate-900/5 animate-pulse rounded-2xl" />
  ),
});
const UserDialog = dynamic(() => import("@/components/admin/users/UserDialog"));
const CreateUserDialog = dynamic(
  () => import("@/components/admin/users/CreateUserDialog"),
);
const RoleDialog = dynamic(() => import("@/components/admin/users/RoleDialog"));
const UserCompaniesDialog = dynamic(
  () => import("@/components/admin/users/UserCompaniesDialog"),
);

interface User {
  id: string;
  email: string;
  full_name: string | null;
  secondary_email: string | null;
  phone: string | null;
  status: string;
  role_id: number;
  roles: { name: string; level: number } | null;
  avatar_url: string | null;
}
interface Role {
  role_id: number;
  name: string;
  description: string;
  level: number;
}
interface Company {
  company_id: number;
  company_name: string;
}
interface CountryCode {
  iso2: string;
  name: string;
  phone_code: string;
  flag_emoji: string;
}

export default function UserManagerClient({
  initialUsers,
  roles,
  companies,
  countryCodes,
  currentUserId,
}: {
  initialUsers: any[];
  roles: Role[];
  companies: Company[];
  countryCodes: CountryCode[];
  currentUserId?: string;
}) {
  const [users] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [selectedUserForCompanies, setSelectedUserForCompanies] =
    useState<User | null>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const currentUser = users.find((u) => u.id === currentUserId);
  const currentUserLevel = currentUser?.roles?.level || 0;

  const canEditUser = (userId: string) =>
    currentUserLevel >= 9 || userId === currentUserId;
  const canCreateUser = currentUserLevel >= 9;
  const canManageRoles = currentUserLevel >= 10;

  const tabs = [
    <Tab key="u" icon={UsersIcon}>
      Usuarios
    </Tab>,
  ];
  if (canManageRoles)
    tabs.push(
      <Tab key="r" icon={Shield}>
        Roles
      </Tab>,
    );

  const handleDeleteUser = async (id: string) => {
    if (!confirm("¿Eliminar usuario?")) return;
    const res = await deleteUser(id);
    if (res.success) window.location.reload();
    else alert("Error: " + res.error);
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm("¿Eliminar rol?")) return;
    const res = await deleteRole(id);
    if (res.success) window.location.reload();
    else alert("Error: " + res.error);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6 px-4 sm:px-0">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="light" icon={ArrowLeft} className="rounded-full" />
          </Link>
          <div>
            <Title className="text-xl sm:text-2xl font-black text-larioja-azul dark:text-white uppercase tracking-tight">
              Usuarios y Roles
            </Title>
            <Text className="text-xs sm:text-sm mt-1 text-gray-500 dark:text-gray-400">
              Gestiona accesos, perfiles de usuario y permisos del sistema.
            </Text>
          </div>
        </div>
      </div>
      <TabGroup>
        <TabList>{tabs}</TabList>
        <TabPanels>
          <TabPanel>
            <Card className="p-4 mt-4 shadow-sm sm:shadow-md border-gray-200 dark:border-gray-800">
              <div className="flex gap-4 mb-6">
                <TextInput
                  icon={Search}
                  placeholder="Buscar..."
                  value={searchTerm}
                  onValueChange={setSearchTerm}
                  className="flex-1"
                />
                {canCreateUser && (
                  <Button
                    icon={Plus}
                    className="bg-larioja-azul"
                    onClick={() => setIsCreateUserDialogOpen(true)}
                  >
                    Nuevo Usuario
                  </Button>
                )}
              </div>
              <UserTable
                users={filteredUsers}
                currentUserId={currentUserId}
                canEditUser={canEditUser}
                canManageRoles={canManageRoles}
                onEdit={(user) => {
                  setEditingUser(user);
                  setIsUserDialogOpen(true);
                }}
                onDelete={handleDeleteUser}
                onManageCompanies={(user) => {
                  setSelectedUserForCompanies(user);
                  setIsCompanyDialogOpen(true);
                }}
              />
            </Card>
          </TabPanel>
          {canManageRoles && (
            <TabPanel>
              <Card className="p-4 mt-4 shadow-sm sm:shadow-md border-gray-200 dark:border-gray-800">
                <div className="flex justify-between mb-4">
                  <Title>Roles</Title>
                  <Button
                    icon={Plus}
                    size="xs"
                    onClick={() => {
                      setEditingRole(null);
                      setIsRoleDialogOpen(true);
                    }}
                  >
                    Nuevo
                  </Button>
                </div>
                <RoleTable
                  roles={roles}
                  onEdit={(role) => {
                    setEditingRole(role);
                    setIsRoleDialogOpen(true);
                  }}
                  onDelete={handleDeleteRole}
                />
              </Card>
            </TabPanel>
          )}
        </TabPanels>
      </TabGroup>

      <UserDialog
        isOpen={isUserDialogOpen}
        onClose={() => setIsUserDialogOpen(false)}
        user={editingUser}
        roles={roles}
        countryCodes={countryCodes}
      />

      <CreateUserDialog
        isOpen={isCreateUserDialogOpen}
        onClose={() => setIsCreateUserDialogOpen(false)}
        roles={roles}
        countryCodes={countryCodes}
      />

      <RoleDialog
        isOpen={isRoleDialogOpen}
        onClose={() => setIsRoleDialogOpen(false)}
        role={editingRole}
      />

      <UserCompaniesDialog
        isOpen={isCompanyDialogOpen}
        onClose={() => setIsCompanyDialogOpen(false)}
        user={selectedUserForCompanies}
        allCompanies={companies}
        roles={roles}
      />
    </div>
  );
}
