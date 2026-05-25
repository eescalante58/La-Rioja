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
  getUserCompanies,
  uploadUserAvatar,
} from "./actions";

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
interface UserCompany {
  user_id: string;
  company_id: number;
  role_id: number;
  company: { company_name: string };
  role_data: { name: string };
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
  const [loading, setLoading] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [selectedUserForCompanies, setSelectedUserForCompanies] =
    useState<User | null>(null);
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([]);
  const [loadingUserCompanies, setLoadingUserCompanies] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const currentUser = users.find((u) => u.id === currentUserId);
  const currentUserLevel = currentUser?.roles?.level || 0;

  // RBAC: admin=10, admin_empresa=9
  const canEditUser = (userId: string) =>
    currentUserLevel >= 9 || userId === currentUserId;
  const canCreateUser = currentUserLevel >= 9;
  const canManageRoles = currentUserLevel >= 10;

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setAvatarPreview(user.avatar_url);
    setIsUserDialogOpen(true);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditRole = (role: Role | null) => {
    setEditingRole(role);
    setIsRoleDialogOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    let avatarUrl = editingUser.avatar_url || "";
    const avatarFile = formData.get("avatar") as File;
    if (avatarFile && avatarFile.size > 0) {
      const uploadRes = await uploadUserAvatar(new FormData(e.currentTarget));
      if (uploadRes.publicUrl) avatarUrl = uploadRes.publicUrl;
    }
    const data = {
      full_name: (formData.get("full_name") as string) || editingUser.full_name,
      role_id: formData.get("role_id")
        ? parseInt(formData.get("role_id") as string)
        : editingUser.role_id,
      status: (formData.get("status") as string) || editingUser.status,
      secondary_email: formData.get("secondary_email") as string,
      phone: `${formData.get("phone_code")}${formData.get("phone_number")}`,
      avatar_url: avatarUrl,
    };
    const res = await updateUser(editingUser.id, data);
    if (res.success) window.location.reload();
    else {
      alert("Error: " + res.error);
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    let avatarUrl = "";
    const avatarFile = formData.get("avatar") as File;
    if (avatarFile && avatarFile.size > 0) {
      const uploadRes = await uploadUserAvatar(new FormData(e.currentTarget));
      if (uploadRes.publicUrl) avatarUrl = uploadRes.publicUrl;
    }
    const data = {
      email: formData.get("email") as string,
      full_name: formData.get("full_name") as string,
      role_id: parseInt(formData.get("role_id") as string),
      secondary_email: formData.get("secondary_email") as string,
      phone: `${formData.get("phone_code")}${formData.get("phone_number")}`,
      avatar_url: avatarUrl,
    };
    const res = await createNewUser(data);
    if (res.success) window.location.reload();
    else {
      alert("Error: " + res.error);
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("¿Eliminar usuario?")) return;
    setLoading(true);
    const res = await deleteUser(id);
    if (res.success) window.location.reload();
    else {
      alert("Error: " + res.error);
      setLoading(false);
    }
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
    const res = editingRole
      ? await updateRole(editingRole.role_id, data)
      : await createRole(data);
    if (res.success) window.location.reload();
    else {
      alert("Error: " + res.error);
      setLoading(false);
    }
  };

  const handleDeleteRole = async (id: number) => {
    if (!confirm("¿Eliminar rol?")) return;
    setLoading(true);
    const res = await deleteRole(id);
    if (res.success) window.location.reload();
    else {
      alert("Error: " + res.error);
      setLoading(false);
    }
  };

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
    const res = await assignUserToCompany(
      selectedUserForCompanies.id,
      parseInt(formData.get("company_id") as string),
      parseInt(formData.get("role_id") as string),
    );
    if (res.success) {
      const data = await getUserCompanies(selectedUserForCompanies.id);
      setUserCompanies(data as any);
      setLoading(false);
      (e.target as HTMLFormElement).reset();
    } else {
      alert("Error: " + res.error);
      setLoading(false);
    }
  };

  const handleRemoveFromCompany = async (companyId: number) => {
    if (!selectedUserForCompanies || !confirm("¿Eliminar?")) return;
    setLoading(true);
    const res = await removeUserFromCompany(
      selectedUserForCompanies.id,
      companyId,
    );
    if (res.success) {
      const data = await getUserCompanies(selectedUserForCompanies.id);
      setUserCompanies(data as any);
      setLoading(false);
    } else {
      alert("Error: " + res.error);
      setLoading(false);
    }
  };

  const getFlagUrl = (code: string | null) => {
    const iso =
      countryCodes
        .find((c) => code?.startsWith(c.phone_code))
        ?.iso2?.toLowerCase() || "sv";
    return `https://flagcdn.com/w40/${iso}.png`;
  };

  const visibleTabs = [
    <Tab key="u" icon={UsersIcon}>
      Usuarios
    </Tab>,
  ];
  if (canManageRoles)
    visibleTabs.push(
      <Tab key="r" icon={Shield}>
        Roles
      </Tab>,
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="light" icon={ArrowLeft}>
              Volver
            </Button>
          </Link>
          <Title className="text-lg font-bold text-larioja-azul dark:text-larioja-amarillo">
            Usuarios [v2.9]
          </Title>
        </div>
      </div>
      <TabGroup>
        <TabList>{visibleTabs}</TabList>
        <TabPanels>
          <TabPanel>
            <Card className="p-4 mt-4">
              <div className="flex gap-4 mb-6">
                <TextInput
                  icon={Search}
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
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
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Usuario</TableHeaderCell>
                    <TableHeaderCell>Email</TableHeaderCell>
                    <TableHeaderCell>Rol</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell className="text-right">
                      Acciones
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img
                            src={u.avatar_url || ""}
                            className="h-8 w-8 rounded-full bg-gray-100"
                            onError={(e) =>
                              (e.currentTarget.src =
                                "https://www.gravatar.com/avatar/000?d=mp")
                            }
                            alt="Avatar"
                          />
                          {u.full_name}
                        </div>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge color="blue">{u.roles?.name}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          color={u.status === "active" ? "emerald" : "rose"}
                        >
                          {u.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        {canEditUser(u.id) && (
                          <>
                            <Button
                              variant="light"
                              size="xs"
                              color="amber"
                              onClick={() => handleManageCompanies(u)}
                            >
                              Empresas
                            </Button>
                            <Button
                              variant="light"
                              size="xs"
                              onClick={() => handleEditUser(u)}
                            >
                              Editar
                            </Button>
                          </>
                        )}
                        {canManageRoles && u.id !== currentUserId && (
                          <Button
                            variant="light"
                            size="xs"
                            color="rose"
                            onClick={() => handleDeleteUser(u.id)}
                          >
                            Eliminar
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabPanel>
          {canManageRoles && (
            <TabPanel>
              <Card className="p-4 mt-4">
                <div className="flex justify-between mb-4">
                  <Title>Roles</Title>
                  <Button
                    icon={Plus}
                    size="xs"
                    onClick={() => handleEditRole(null)}
                  >
                    Nuevo
                  </Button>
                </div>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>Nombre</TableHeaderCell>
                      <TableHeaderCell>Nivel</TableHeaderCell>
                      <TableHeaderCell className="text-right">
                        Acciones
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {roles.map((r) => (
                      <TableRow key={r.role_id}>
                        <TableCell className="font-bold">{r.name}</TableCell>
                        <TableCell>
                          <Badge>{r.level}</Badge>
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          <Button
                            variant="light"
                            size="xs"
                            onClick={() => handleEditRole(r)}
                          >
                            Editar
                          </Button>
                          <Button
                            variant="light"
                            size="xs"
                            color="rose"
                            onClick={() => handleDeleteRole(r.role_id)}
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
          )}
        </TabPanels>
      </TabGroup>

      {/* DIALOGS */}
      <Dialog
        open={isCreateUserDialogOpen}
        onClose={() => {
          setIsCreateUserDialogOpen(false);
          setAvatarPreview(null);
        }}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-larioja-azul/[0.08] via-larioja-verde/[0.08] to-larioja-amarillo/[0.12] hover:shadow-larioja-azul/20 hover:shadow-2xl transition-all duration-500">
            <Title className="mb-4 text-larioja-azul dark:text-larioja-amarillo">
              Nuevo Usuario
            </Title>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  name="email"
                  type="email"
                  placeholder="Email Principal"
                  required
                />
                <TextInput
                  name="secondary_email"
                  type="email"
                  placeholder="Email Secundario (Opcional)"
                />
                <TextInput
                  name="full_name"
                  placeholder="Nombre Completo"
                  required
                />
                <select
                  name="role_id"
                  className="p-2 border rounded-lg text-sm bg-white"
                  required
                >
                  <option value="">Rol...</option>
                  {roles.map((r) => (
                    <option key={r.role_id} value={r.role_id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <select
                    name="phone_code"
                    className="w-1/2 p-2 border rounded-lg text-sm bg-white"
                    defaultValue="503"
                  >
                    {countryCodes.map((c) => (
                      <option key={c.iso2} value={c.phone_code}>
                        {c.flag_emoji} {c.name} (+{c.phone_code})
                      </option>
                    ))}
                  </select>
                  <TextInput
                    name="phone_number"
                    className="flex-1"
                    placeholder="Teléfono"
                    required
                  />
                </div>
                <div className="col-span-2 flex items-center gap-4 p-4 border rounded-lg bg-gray-50/50">
                  <div className="flex-1 flex flex-col gap-2">
                    <Text className="text-xs font-bold uppercase">
                      Avatar / Foto de Perfil
                    </Text>
                    <div className="flex items-center gap-4">
                      {avatarPreview && (
                        <img
                          src={avatarPreview}
                          className="h-12 w-12 rounded-full object-cover border-2 border-larioja-azul"
                          alt="Preview"
                        />
                      )}
                      <input
                        type="file"
                        name="avatar"
                        accept="image/*"
                        className="text-xs flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-larioja-azul file:text-white hover:file:bg-blue-700 transition-all"
                        onChange={handleAvatarChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsCreateUserDialogOpen(false);
                    setAvatarPreview(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="bg-larioja-azul"
                >
                  Crear Usuario
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        open={isUserDialogOpen}
        onClose={() => {
          setIsUserDialogOpen(false);
          setAvatarPreview(null);
        }}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-larioja-azul/[0.08] via-larioja-verde/[0.08] to-larioja-amarillo/[0.12] hover:shadow-larioja-azul/20 hover:shadow-2xl transition-all duration-500">
            <Title className="mb-4 text-larioja-azul dark:text-larioja-amarillo">
              Editar Usuario
            </Title>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TextInput
                  name="full_name"
                  defaultValue={editingUser?.full_name || ""}
                  placeholder="Nombre Completo"
                  required
                />
                <TextInput
                  name="secondary_email"
                  type="email"
                  defaultValue={editingUser?.secondary_email || ""}
                  placeholder="Email Secundario (Opcional)"
                />
                <select
                  name="role_id"
                  defaultValue={editingUser?.role_id}
                  disabled={currentUserLevel < 9}
                  className="p-2 border rounded-lg text-sm bg-white"
                >
                  {roles.map((r) => (
                    <option key={r.role_id} value={r.role_id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <select
                  name="status"
                  defaultValue={editingUser?.status}
                  disabled={currentUserLevel < 9}
                  className="p-2 border rounded-lg text-sm bg-white"
                >
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                </select>
                <div className="flex gap-2">
                  <select
                    name="phone_code"
                    className="w-1/2 p-2 border rounded-lg text-sm bg-white"
                    defaultValue={
                      countryCodes.find((c) =>
                        editingUser?.phone?.startsWith(c.phone_code),
                      )?.phone_code || "503"
                    }
                  >
                    {countryCodes.map((c) => (
                      <option key={c.iso2} value={c.phone_code}>
                        {c.flag_emoji} {c.name} (+{c.phone_code})
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
                              editingUser?.phone?.startsWith(c.phone_code),
                            )?.phone_code || "",
                            "",
                          )
                        : ""
                    }
                    placeholder="Teléfono"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-4 p-4 border rounded-lg bg-gray-50/50">
                  <div className="flex-1 flex flex-col gap-2">
                    <Text className="text-xs font-bold uppercase">
                      Avatar / Foto de Perfil
                    </Text>
                    <div className="flex items-center gap-4">
                      {avatarPreview && (
                        <img
                          src={avatarPreview}
                          className="h-12 w-12 rounded-full object-cover border-2 border-larioja-azul"
                          alt="Preview"
                        />
                      )}
                      <input
                        type="file"
                        name="avatar"
                        accept="image/*"
                        className="text-xs flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-larioja-azul file:text-white hover:file:bg-blue-700 transition-all"
                        onChange={handleAvatarChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsUserDialogOpen(false);
                    setAvatarPreview(null);
                  }}
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
        </div>
      </Dialog>

      <Dialog
        open={isRoleDialogOpen}
        onClose={() => setIsRoleDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-larioja-azul/[0.08] via-larioja-verde/[0.08] to-larioja-amarillo/[0.12] hover:shadow-larioja-azul/20 hover:shadow-2xl transition-all duration-500">
            <Title className="mb-4 text-larioja-azul dark:text-larioja-amarillo">
              {editingRole ? "Editar Rol" : "Nuevo Rol"}
            </Title>
            <form onSubmit={handleSaveRole} className="space-y-4">
              <TextInput
                name="name"
                defaultValue={editingRole?.name || ""}
                required
              />
              <TextInput
                name="level"
                type="number"
                defaultValue={editingRole?.level?.toString() || "1"}
                required
              />
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setIsRoleDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="bg-larioja-azul"
                >
                  Guardar
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      <Dialog
        open={isCompanyDialogOpen}
        onClose={() => setIsCompanyDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-larioja-azul/[0.08] via-larioja-verde/[0.08] to-larioja-amarillo/[0.12] hover:shadow-larioja-azul/20 hover:shadow-2xl transition-all duration-500">
            <div className="flex justify-between mb-4">
              <Title className="text-larioja-azul dark:text-larioja-amarillo">
                Empresas: {selectedUserForCompanies?.email}
              </Title>
              <Button
                variant="light"
                icon={X}
                onClick={() => setIsCompanyDialogOpen(false)}
              />
            </div>
            <Card className="p-4 bg-gray-50 border-none mb-4">
              <form
                onSubmit={handleAssignCompany}
                className="flex gap-2 items-end"
              >
                <div className="flex-1 text-xs font-bold">
                  EMPRESA
                  <select
                    name="company_id"
                    className="w-full p-2 border rounded text-sm bg-white"
                    required
                  >
                    <option value="">Empresa...</option>
                    {companies.map((c) => (
                      <option key={c.company_id} value={c.company_id}>
                        {c.company_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1 text-xs font-bold">
                  ROL
                  <select
                    name="role_id"
                    className="w-full p-2 border rounded text-sm bg-white"
                    required
                  >
                    {roles.map((r) => (
                      <option key={r.role_id} value={r.role_id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="submit"
                  loading={loading}
                  className="bg-larioja-azul"
                >
                  Asignar
                </Button>
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
                {userCompanies.map((uc) => (
                  <TableRow key={uc.company_id}>
                    <TableCell>{uc.company.company_name}</TableCell>
                    <TableCell>
                      <Badge>{uc.role_data.name}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="light"
                        size="xs"
                        color="rose"
                        onClick={() => handleRemoveFromCompany(uc.company_id)}
                      >
                        Remover
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
