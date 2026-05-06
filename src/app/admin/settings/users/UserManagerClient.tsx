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
  X,
  Building2,
  Users as UsersIcon,
  ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import {
  updateUser,
  deleteUser,
  createNewUser,
  createRole,
  updateRole,
  deleteRole,
  assignUserToCompany,
  removeUserFromCompany,
  updateUserCompanyRole,
  getUserCompanies,
  uploadUserAvatar,
} from "./actions";

interface User {
  id: string;
  email: string;
  secondary_email: string | null;
  phone: string | null;
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

interface CountryCode {
  iso2: string;
  name: string;
  phone_code: string;
  flag_emoji: string;
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
  countryCodes,
}: {
  initialUsers: any[];
  roles: Role[];
  companies: Company[];
  countryCodes: CountryCode[];
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // User Dialog State
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
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

    // Handle Avatar Upload if a new one is selected
    let avatarUrl = editingUser.avatar_url || "";
    const avatarFile = formData.get("avatar") as File;
    if (avatarFile && avatarFile.size > 0) {
      const uploadFormData = new FormData();
      uploadFormData.append("file", avatarFile);
      const uploadResult = await uploadUserAvatar(uploadFormData);
      if (uploadResult.publicUrl) {
        avatarUrl = uploadResult.publicUrl;
      }
    }

    const phoneCode = formData.get("phone_code") as string;
    const phoneNumber = formData.get("phone_number") as string;
    const fullPhone = phoneNumber ? `${phoneCode}${phoneNumber}` : "";

    const data = {
      full_name: formData.get("full_name") as string,
      role_id: parseInt(formData.get("role_id") as string),
      status: formData.get("status") as string,
      secondary_email: formData.get("secondary_email") as string,
      phone: fullPhone,
      avatar_url: avatarUrl,
    };

    const result = await updateUser(editingUser.id, data);

    if (result.success) {
      window.location.reload();
    } else {
      alert("Error: " + result.error);
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    // Handle Avatar Upload
    let avatarUrl = "";
    const avatarFile = formData.get("avatar") as File;
    if (avatarFile && avatarFile.size > 0) {
      const uploadFormData = new FormData();
      uploadFormData.append("file", avatarFile);
      const uploadResult = await uploadUserAvatar(uploadFormData);
      if (uploadResult.publicUrl) {
        avatarUrl = uploadResult.publicUrl;
      }
    }

    const phoneCode = formData.get("phone_code") as string;
    const phoneNumber = formData.get("phone_number") as string;
    const fullPhone = phoneNumber ? `${phoneCode}${phoneNumber}` : "";

    const data = {
      email: formData.get("email") as string,
      full_name: formData.get("full_name") as string,
      role_id: parseInt(formData.get("role_id") as string),
      secondary_email: formData.get("secondary_email") as string,
      phone: fullPhone,
      avatar_url: avatarUrl,
    };

    const result = await createNewUser(data);

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
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700 flex-1">
                  <Search className="text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    className="bg-transparent border-none outline-none text-sm flex-1 dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button
                  icon={Plus}
                  className="bg-larioja-azul"
                  onClick={() => setIsCreateUserDialogOpen(true)}
                >
                  Nuevo Usuario
                </Button>
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

      {/* CREATE USER DIALOG */}
      <Dialog
        open={isCreateUserDialogOpen}
        onClose={() => setIsCreateUserDialogOpen(false)}
        static={true}
      >
        <DialogPanel className="max-w-2xl">
          <Title className="mb-2">Nuevo Usuario</Title>
          <Text className="mb-6">
            Completa la información para crear el acceso y el perfil del
            usuario.
          </Text>

          <form onSubmit={handleCreateUser} className="space-y-8">
            {/* Section 1: Authentication */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                <ShieldAlert
                  size={18}
                  className="text-larioja-azul dark:text-larioja-amarillo"
                />
                <Title className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  1. Datos de Autenticación
                </Title>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase">
                    Correo Institucional (Principal)
                  </Text>
                  <TextInput
                    name="email"
                    type="email"
                    placeholder="correo@larioja.edu.ar"
                    required
                  />
                  <Text className="text-[10px] text-gray-400">
                    Este será el correo para iniciar sesión.
                  </Text>
                </div>
                <div className="bg-larioja-amarillo/10 p-4 rounded-xl border border-larioja-amarillo/20 flex flex-col justify-center">
                  <Text className="text-xs font-bold text-larioja-azul mb-1">
                    Contraseña Temporal
                  </Text>
                  <Badge color="amber">Rioja2026!</Badge>
                  <Text className="text-[10px] text-larioja-azul/60 mt-1 italic">
                    El usuario debe cambiarla al ingresar.
                  </Text>
                </div>
              </div>
            </div>

            {/* Section 2: Profile Details */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-gray-800">
                <UsersIcon
                  size={18}
                  className="text-larioja-azul dark:text-larioja-amarillo"
                />
                <Title className="text-sm font-bold uppercase tracking-wider text-gray-500">
                  2. Información del Perfil
                </Title>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <Text className="text-xs font-bold uppercase">
                      Nombre Completo
                    </Text>
                    <TextInput
                      name="full_name"
                      placeholder="Ej: Juan Pérez"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <Text className="text-xs font-bold uppercase">
                      Correo Secundario
                    </Text>
                    <TextInput
                      name="secondary_email"
                      type="email"
                      placeholder="personal@ejemplo.com"
                    />
                  </div>

                  <div className="space-y-1">
                    <Text className="text-xs font-bold uppercase">
                      Teléfono de Contacto
                    </Text>
                    <div className="flex gap-2">
                      <select
                        name="phone_code"
                        className="w-32 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                      >
                        {countryCodes.map((c) => (
                          <option key={c.iso2} value={c.phone_code}>
                            {c.flag_emoji} {c.iso2} ({c.phone_code})
                          </option>
                        ))}
                      </select>
                      <TextInput
                        name="phone_number"
                        className="flex-1"
                        placeholder="Número sin prefijo"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1">
                    <Text className="text-xs font-bold uppercase">
                      Rol en el Sistema
                    </Text>
                    <select
                      name="role_id"
                      className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                      required
                    >
                      <option value="">Seleccionar rol...</option>
                      {roles.map((role) => (
                        <option key={role.role_id} value={role.role_id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Text className="text-xs font-bold uppercase">
                      Imagen de Perfil (Avatar)
                    </Text>
                    <div className="flex flex-col gap-2">
                      <input
                        type="file"
                        name="avatar"
                        accept="image/*"
                        className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-larioja-azul file:text-white hover:file:bg-blue-700 cursor-pointer"
                      />
                      <Text className="text-[10px] text-gray-400">
                        Se guardará en el bucket user_avatar.
                      </Text>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="secondary"
                onClick={() => setIsCreateUserDialogOpen(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                loading={loading}
                className="bg-larioja-azul px-8"
              >
                Crear Usuario Completo
              </Button>
            </div>
          </form>
        </DialogPanel>
      </Dialog>

      {/* USER DIALOG (EDIT) */}
      <Dialog
        open={isUserDialogOpen}
        onClose={() => setIsUserDialogOpen(false)}
        static={true}
      >
        <DialogPanel className="max-w-2xl">
          <Title className="mb-2">Editar Usuario</Title>
          <Text className="mb-6">
            Actualiza el perfil y los accesos para <b>{editingUser?.email}</b>.
          </Text>

          <form onSubmit={handleUpdateUser} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase">
                    Nombre Completo
                  </Text>
                  <TextInput
                    name="full_name"
                    defaultValue={editingUser?.full_name || ""}
                    placeholder="Nombre completo"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase">
                    Correo Secundario
                  </Text>
                  <TextInput
                    name="secondary_email"
                    type="email"
                    defaultValue={editingUser?.secondary_email || ""}
                    placeholder="personal@ejemplo.com"
                  />
                </div>

                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase">
                    Teléfono de Contacto
                  </Text>
                  <div className="flex gap-2">
                    <select
                      name="phone_code"
                      className="w-32 p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                      defaultValue={
                        countryCodes.find((c) =>
                          editingUser?.phone?.startsWith(c.phone_code),
                        )?.phone_code
                      }
                    >
                      {countryCodes.map((c) => (
                        <option key={c.iso2} value={c.phone_code}>
                          {c.flag_emoji} {c.iso2} ({c.phone_code})
                        </option>
                      ))}
                    </select>
                    <TextInput
                      name="phone_number"
                      className="flex-1"
                      defaultValue={
                        editingUser?.phone
                          ? editingUser.phone.replace(
                              countryCodes.find((c) =>
                                editingUser.phone?.startsWith(c.phone_code),
                              )?.phone_code || "",
                              "",
                            )
                          : ""
                      }
                      placeholder="Número sin prefijo"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase">
                    Rol Global
                  </Text>
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

                <div className="space-y-2">
                  <Text className="text-xs font-bold uppercase">
                    Imagen de Perfil (Avatar)
                  </Text>
                  <div className="flex flex-col gap-2">
                    {editingUser?.avatar_url && (
                      <div className="relative h-12 w-12 rounded-full overflow-hidden border border-gray-200">
                        <img
                          src={editingUser.avatar_url}
                          alt="Current avatar"
                          className="object-cover h-full w-full"
                        />
                      </div>
                    )}
                    <input
                      type="file"
                      name="avatar"
                      accept="image/*"
                      className="text-xs file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-larioja-azul file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
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
                className="bg-larioja-azul px-8"
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
