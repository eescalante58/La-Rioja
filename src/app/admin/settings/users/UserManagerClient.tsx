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
  Select,
  SelectItem,
} from "@tremor/react";
import {
  Edit,
  Search,
  ArrowLeft,
  UserCheck,
  UserX,
  Shield,
} from "lucide-react";
import Link from "next/link";
import { updateUser } from "./actions";

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
}

/**
 * Client component for managing users and their global roles.
 */
export default function UserManagerClient({
  initialUsers,
  roles,
}: {
  initialUsers: any[];
  roles: Role[];
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const roleId = formData.get("role_id");
    const status = formData.get("status");

    const result = await updateUser(editingUser.id, {
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
              Usuarios y Roles
            </Title>
            <Text className="text-xs">
              Administra el acceso global y estados de cuenta.
            </Text>
          </div>
        </div>
      </div>

      <Card className="p-4">
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
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
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
                <TableCell className="text-right">
                  <Button
                    variant="light"
                    icon={Edit}
                    size="xs"
                    onClick={() => handleEdit(user)}
                  >
                    Editar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        static={true}
      >
        <DialogPanel className="max-w-md">
          <Title className="mb-4">Editar Usuario</Title>
          <Text className="mb-6">
            Actualiza el rol global y el estado para <b>{editingUser?.email}</b>
            .
          </Text>

          <form onSubmit={handleUpdate} className="space-y-4">
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
              <Text className="text-xs font-bold uppercase">
                Estado de Cuenta
              </Text>
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
                onClick={() => setIsDialogOpen(false)}
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
    </div>
  );
}
