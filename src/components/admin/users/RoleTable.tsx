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

interface Role {
  role_id: number;
  name: string;
  description: string;
  level: number;
}

interface RoleTableProps {
  roles: Role[];
  onEdit: (role: Role) => void;
  onDelete: (id: number) => void;
}

export default function RoleTable({ roles, onEdit, onDelete }: RoleTableProps) {
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell>Nombre</TableHeaderCell>
          <TableHeaderCell>Nivel</TableHeaderCell>
          <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
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
                onClick={() => onEdit(r)}
              >
                Editar
              </Button>
              <Button
                variant="light"
                size="xs"
                color="rose"
                onClick={() => onDelete(r.role_id)}
              >
                Eliminar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
