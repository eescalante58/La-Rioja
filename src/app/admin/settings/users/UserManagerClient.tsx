"use client";

import { useState } from "react";
import {
  Card,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Text,
  Title,
  Button,
  Badge,
  Dialog,
  DialogPanel,
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  TextInput,
} from "@tremor/react";
import {
  Edit,
  Search,
  ArrowLeft,
  UserCheck,
  UserX,
  Shield,
  Plus,
  Trash,
  Building2,
  Users as UsersIcon,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import {
  updateUser,
  deleteUser,
  createRole,
  updateRole,
  deleteRole,
  assignUserToCompany,
  removeUserFromCompany,
  updateUserCompanyRole,
  getUserCompanies,
} from "./actions";

interface User {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  role_id: number;
  roles: { name: string } | null;
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

interface UserCompany {
  user_id: string;
  company_id: number;
  role_id: number;
  company: { company_name: string };
  role_data: { name: string };
}

/**
 * Client component for managing users, roles, and user-company assignments.
 */
export default function UserManagerClient({
  initialUsers,
  roles,
  companies,
}: {
  initialUsers: any[];
  roles: Role[];
  companies: Company[];
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // User Dialog State
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Role Dialog State
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  // User-Company Dialog State
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [selectedUserForCompanies, setSelectedUserForCompanies] =
    useState<User | null>(null);
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([]);
  const [loadingUserCompanies, setLoadingUserCompanies] = useState(false);

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // User Handlers
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setIsUserDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const roleId = formData.get("role_id");
    const status = formData.get("status");
    const fullName = formData.get("full_name");

    const result = await updateUser(editingUser.id, {
      full_name: fullName as string,
      role_id: parseInt(roleId as string),
      status: status as string,
    });

    if (result.success) {
      window.location.reload();
    } else {
      alert("Error: " + result.error);
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario del sistema?")) return;

    setLoading(true);
    const result = await deleteUser(userId);
    if (result.success) {
      window.location.reload();
    } else {
      alert("Error: " + result.error);
      setLoading(false);
    }
  };

  // Role Handlers
  const handleEditRole = (role: Role | null) => {
    setEditingRole(role);
    setIsRoleDialogOpen(true);
  };

  const handleSaveRole = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      level: parseInt(formData.get("level") as string),
    };

    const result = editingRole
      ? await updateRole(editingRole.role_id, data)
      : await createRole(data);

    if (result.success) {
      window.location.reload();
    } else {
      alert("Error: " + result.error);
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm("¿Estás seguro de eliminar este rol?")) return;

    setLoading(true);
    const result = await deleteRole(roleId);
    if (result.success) {
      window.location.reload();
    } else {
      alert("Error: " + result.error);
      setLoading(false);
    }
  };

  // User-Company Handlers
  const handleManageCompanies = async (user: User) => {
    setSelectedUserForCompanies(user);
    setIsCompanyDialogOpen(true);
    setLoadingUserCompanies(true);
    const data = await getUserCompanies(user.id);
    setUserCompanies(data as any);
    setLoadingUserCompanies(false);
  };

  const handleAssignCompany = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedUserForCompanies) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const companyId = parseInt(formData.get("company_id") as string);
    const roleId = parseInt(formData.get("role_id") as string);

    const result = await assignUserToCompany(
      selectedUserForCompanies.id,
      companyId,
      roleId,
    );
    if (result.success) {
      const data = await getUserCompanies(selectedUserForCompanies.id);
      setUserCompanies(data as any);
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    } else {
      alert("Error: " + result.error);
      setLoading(false);
    }
  };

  const handleRemoveFromCompany = async (companyId: number) => {
    if (!selectedUserForCompanies || !confirm("¿Eliminar asignación?")) return;

    setLoading(true);
    const result = await removeUserFromCompany(
      selectedUserForCompanies.id,
      companyId,
    );
    if (result.success) {
      const data = await getUserCompanies(selectedUserForCompanies.id);
      setUserCompanies(data as any);
      setLoading(false);
    } else {
      alert("Error: " + result.error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="light" icon={ArrowLeft}>
              Volver a Configuración
            </Button>
          </Link>
          <div>
            <Title className="text-lg font-bold text-larioja-azul/80 dark:text-larioja-amarillo/80">
              Usuarios, Roles y Empresas
            </Title>
            <Text className="text-xs">
              Administra el acceso global, los roles del sistema y la
              pertenencia a empresas.
            </Text>
          </div>
        </div>
      </div>

      <TabGroup>
        <TabList className="mt-4">
          <Tab icon={UsersIcon}>Usuarios</Tab>
          <Tab icon={Shield}>Roles del Sistema</Tab>
        </TabList>
        <TabPanels>
          {/* USERS TAB */}
          <TabPanel>
            <Card className="p-4 mt-4">
              <div className="flex items-center gap-2 mb-4 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                <Search className="text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Buscar por nombre o email..."
                  className="bg-transparent border-none outline-none text-sm flex-1 dark:text-white"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Usuario</TableHeaderCell>
                    <TableHeaderCell>Email</TableHeaderCell>
                    <TableHeaderCell>Rol Global</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell className="text-right">
                      Acciones
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        {user.full_name || "Sin nombre"}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge color="blue" icon={Shield}>
                          {user.roles?.name || "Sin rol"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.status === "active" ? (
                          <Badge color="emerald" icon={UserCheck}>
                            Activo
                          </Badge>
                        ) : (
                          <Badge color="rose" icon={UserX}>
                            Inactivo
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="light"
                          icon={Building2}
                          size="xs"
                          color="amber"
                          onClick={() => handleManageCompanies(user)}
                        >
                          Empresas
                        </Button>
                        <Button
                          variant="light"
                          icon={Edit}
                          size="xs"
                          onClick={() => handleEditUser(user)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="light"
                          icon={Trash}
                          size="xs"
                          color="rose"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabPanel>

          {/* ROLES TAB */}
          <TabPanel>
            <Card className="p-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <Title className="text-base">Listado de Roles</Title>
                <Button
                  icon={Plus}
                  size="xs"
                  className="bg-larioja-azul"
                  onClick={() => handleEditRole(null)}
                >
                  Nuevo Rol
                </Button>
              </div>

              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Nombre</TableHeaderCell>
                    <TableHeaderCell>Descripción</TableHeaderCell>
                    <TableHeaderCell>Nivel</TableHeaderCell>
                    <TableHeaderCell className="text-right">
                      Acciones
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {roles.map((role) => (
                    <TableRow key={role.role_id}>
                      <TableCell className="font-bold">{role.name}</TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell>
                        <Badge color="gray">{role.level}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          variant="light"
                          icon={Edit}
                          size="xs"
                          onClick={() => handleEditRole(role)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="light"
                          icon={Trash}
                          size="xs"
                          color="rose"
                          onClick={() => handleDeleteRole(role.role_id)}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>

      {/* USER DIALOG */}
      <Dialog
        open={isUserDialogOpen}
        onClose={() => setIsUserDialogOpen(false)}
        static={true}
      >
        <DialogPanel className="max-w-md">
          <Title className="mb-4">Editar Usuario</Title>
          <form onSubmit={handleUpdateUser} className="space-y-4">
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase">
                Nombre Completo
              </Text>
              <TextInput
                name="full_name"
                defaultValue={editingUser?.full_name || ""}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase">Rol Global</Text>
              <select
                name="role_id"
                defaultValue={editingUser?.role_id}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                {roles.map((role) => (
                  <option key={role.role_id} value={role.role_id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase">Estado</Text>
              <select
                name="status"
                defaultValue={editingUser?.status}
                className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
              >
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setIsUserDialogOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={loading}
                className="bg-larioja-azul"
              >
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogPanel>
      </Dialog>

      {/* ROLE DIALOG */}
      <Dialog
        open={isRoleDialogOpen}
        onClose={() => setIsRoleDialogOpen(false)}
        static={true}
      >
        <DialogPanel className="max-w-md">
          <Title className="mb-4">
            {editingRole ? "Editar Rol" : "Nuevo Rol"}
          </Title>
          <form onSubmit={handleSaveRole} className="space-y-4">
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase">Nombre</Text>
              <TextInput
                name="name"
                defaultValue={editingRole?.name || ""}
                placeholder="Nombre del rol"
                required
              />
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase">Descripción</Text>
              <TextInput
                name="description"
                defaultValue={editingRole?.description || ""}
                placeholder="Descripción"
              />
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase">
                Nivel (Jerarquía)
              </Text>
              <TextInput
                name="level"
                type="number"
                defaultValue={editingRole?.level?.toString() || "1"}
                required
              />
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={() => setIsRoleDialogOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={loading}
                className="bg-larioja-azul"
              >
                {editingRole ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </Dialog>

      {/* USER-COMPANY DIALOG */}
      <Dialog
        open={isCompanyDialogOpen}
        onClose={() => setIsCompanyDialogOpen(false)}
        static={true}
      >
        <DialogPanel className="max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <Title>Empresas Asociadas</Title>
              <Text className="text-xs">
                Usuario:{" "}
                <span className="font-bold">
                  {selectedUserForCompanies?.email}
                </span>
              </Text>
            </div>
            <Button
              variant="light"
              icon={X}
              onClick={() => setIsCompanyDialogOpen(false)}
            />
          </div>

          <Card className="p-4 bg-gray-50 dark:bg-gray-900 border-none mb-6">
            <Title className="text-sm mb-4">Nueva Asignación</Title>
            <form
              onSubmit={handleAssignCompany}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4"
            >
              <div className="space-y-1">
                <Text className="text-[10px] font-bold uppercase">Empresa</Text>
                <select
                  name="company_id"
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {companies.map((c) => (
                    <option key={c.company_id} value={c.company_id}>
                      {c.company_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Text className="text-[10px] font-bold uppercase">
                  Rol en Empresa
                </Text>
                <select
                  name="role_id"
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  required
                >
                  {roles.map((r) => (
                    <option key={r.role_id} value={r.role_id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  type="submit"
                  icon={Plus}
                  className="w-full bg-larioja-azul"
                  loading={loading}
                >
                  Asignar
                </Button>
              </div>
            </form>
          </Card>

          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Empresa</TableHeaderCell>
                <TableHeaderCell>Rol</TableHeaderCell>
                <TableHeaderCell className="text-right">
                  Acciones
                </TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingUserCompanies ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center italic py-8">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : userCompanies.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center italic py-8 text-gray-400"
                  >
                    Sin empresas asignadas
                  </TableCell>
                </TableRow>
              ) : (
                userCompanies.map((uc) => (
                  <TableRow key={uc.company_id}>
                    <TableCell className="font-bold">
                      {uc.company.company_name}
                    </TableCell>
                    <TableCell>
                      <Badge color="blue">{uc.role_data.name}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="light"
                        icon={Trash}
                        size="xs"
                        color="rose"
                        onClick={() => handleRemoveFromCompany(uc.company_id)}
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </DialogPanel>
      </Dialog>
    </div>
  );
}
