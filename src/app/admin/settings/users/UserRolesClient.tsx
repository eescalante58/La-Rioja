"use client";

import { useState } from "react";
import {
  Card,
  Title,
  Text,
  Badge,
  Button,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Select,
  SelectItem,
  TextInput,
} from "@tremor/react";
import { UserPlus, X, Search } from "lucide-react";
import type { SecRole, SecUserRole } from "./SecurityModuleTabs";
import { callAction } from "@/lib/action-client";

interface User {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

function UserAvatar({ user }: { user: User }) {
  if (user.avatar_url) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={user.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />;
  }
  const initials = (user.full_name ?? user.email)
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
  return (
    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-xs font-semibold text-blue-700 dark:text-blue-300">
      {initials}
    </div>
  );
}

interface Props {
  users: User[];
  secRoles: SecRole[];
  initialAssignments: SecUserRole[];
}

export default function UserRolesClient({ users, secRoles, initialAssignments }: Props) {
  const [assignments, setAssignments] = useState<SecUserRole[]>(initialAssignments);
  const [search, setSearch] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  // Form state for new assignment
  const [newRoleId, setNewRoleId] = useState("");
  const [newValidFrom, setNewValidFrom] = useState(new Date().toISOString().split("T")[0]);
  const [newValidTo, setNewValidTo] = useState("");
  const [saving, setSaving] = useState(false);

  // BUG-SEC-014: filtrar también valid_from futuro y roles desactivados
  const getActiveAssignments = (userId: string) =>
    assignments.filter(
      (a) =>
        a.user_id === userId &&
        a.is_active &&
        (!a.valid_from || new Date(a.valid_from) <= new Date()) &&
        (!a.valid_to || new Date(a.valid_to) > new Date()) &&
        a.sec_roles?.[0]?.is_active !== false,
    );

  const filteredUsers = users.filter(
    (u) =>
      (u.full_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const handleAssign = async (userId: string) => {
    if (!newRoleId) return;
    setSaving(true);
    try {
      const result = await callAction<{ data: SecUserRole | null; error: string | null }>(
        "users.assignSecRole",
        [userId, newRoleId, newValidFrom, newValidTo || null],
      );
      if (result.data) {
        setAssignments((prev) => [...prev, result.data as SecUserRole]);
        setNewRoleId("");
        setNewValidTo("");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (assignmentId: string) => {
    setSaving(true);
    try {
      await callAction("users.revokeSecRole", [assignmentId]);
      setAssignments((prev) =>
        prev.map((a) => (a.id === assignmentId ? { ...a, is_active: false } : a)),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="!border-[#012060] dark:!border-dark-tremor-border">
      <div className="flex items-center justify-between mb-4">
        <Title>Asignación de Roles</Title>
        <TextInput
          placeholder="Buscar usuario..."
          icon={Search}
          value={search}
          onValueChange={setSearch}
          className="max-w-xs"
        />
      </div>

      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Usuario</TableHeaderCell>
            <TableHeaderCell>Roles vigentes</TableHeaderCell>
            <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredUsers.map((user) => {
            const activeRoles = getActiveAssignments(user.id);
            const isExpanded = expandedUserId === user.id;

            return (
              <>
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <UserAvatar user={user} />
                      <div>
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {user.full_name ?? "—"}
                        </div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {activeRoles.length === 0 ? (
                        <Text className="text-xs text-gray-400">Sin roles asignados</Text>
                      ) : (
                        activeRoles.map((a) => {
                          const roleName =
                            a.sec_roles?.[0]?.name ??
                            secRoles.find((r) => r.id === a.role_id)?.name ??
                            a.role_id;
                          return (
                            <div key={a.id} className="flex items-center gap-1">
                              <Badge color="blue" size="xs">
                                {roleName}
                              </Badge>
                              {a.valid_to && (
                                <span className="text-xs text-gray-400">
                                  hasta {new Date(a.valid_to).toLocaleDateString("es-SV")}
                                </span>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRevoke(a.id)}
                                disabled={saving}
                                className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                                title="Revocar rol"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="xs"
                      variant="secondary"
                      icon={UserPlus}
                      onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                    >
                      {isExpanded ? "Cancelar" : "Asignar"}
                    </Button>
                  </TableCell>
                </TableRow>

                {/* Panel de asignación expandible */}
                {isExpanded && (
                  <TableRow key={`${user.id}-assign`}>
                    <TableCell colSpan={3}>
                      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-[#012060] dark:border-dark-tremor-border p-4 flex flex-wrap gap-4 items-end">
                        <div className="flex flex-col gap-1 min-w-[200px]">
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Rol
                          </label>
                          <Select
                            value={newRoleId}
                            onValueChange={setNewRoleId}
                            placeholder="Seleccionar rol..."
                          >
                            {secRoles
                              .filter((r) => r.is_active)
                              .map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.name}
                                </SelectItem>
                              ))}
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Desde
                          </label>
                          <input
                            type="date"
                            value={newValidFrom}
                            onChange={(e) => setNewValidFrom(e.target.value)}
                            className="h-9 rounded-tremor-default border border-[#012060] dark:border-dark-tremor-border bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-white"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            Hasta (opcional)
                          </label>
                          <input
                            type="date"
                            value={newValidTo}
                            onChange={(e) => setNewValidTo(e.target.value)}
                            min={newValidFrom}
                            className="h-9 rounded-tremor-default border border-[#012060] dark:border-dark-tremor-border bg-white dark:bg-gray-900 px-3 text-sm text-gray-900 dark:text-white"
                          />
                        </div>
                        <Button
                          size="sm"
                          loading={saving}
                          disabled={!newRoleId || saving}
                          onClick={() => handleAssign(user.id)}
                          icon={UserPlus}
                        >
                          Asignar rol
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </>
            );
          })}
        </TableBody>
      </Table>

      {filteredUsers.length === 0 && (
        <Text className="text-center text-gray-400 py-10">No se encontraron usuarios.</Text>
      )}
    </Card>
  );
}
