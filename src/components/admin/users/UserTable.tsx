"use client";

import {
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
  Button,
} from "@tremor/react";

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

interface UserTableProps {
  users: User[];
  currentUserId?: string;
  canEditUser: (userId: string) => boolean;
  canManageRoles: boolean;
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
  onManageCompanies: (user: User) => void;
}

export default function UserTable({
  users,
  currentUserId,
  canEditUser,
  canManageRoles,
  onEdit,
  onDelete,
  onManageCompanies,
}: UserTableProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Usuario</TableHeaderCell>
          <TableHeaderCell>Email</TableHeaderCell>
          <TableHeaderCell>Rol</TableHeaderCell>
          <TableHeaderCell>Estado</TableHeaderCell>
          <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {users.map((u) => (
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
              <Badge color={u.status === "active" ? "emerald" : "rose"}>
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
                    onClick={() => onManageCompanies(u)}
                  >
                    Empresas
                  </Button>
                  <Button variant="light" size="xs" onClick={() => onEdit(u)}>
                    Editar
                  </Button>
                </>
              )}
              {canManageRoles && u.id !== currentUserId && (
                <Button
                  variant="light"
                  size="xs"
                  color="rose"
                  onClick={() => onDelete(u.id)}
                >
                  Eliminar
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
