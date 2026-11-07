"use client";

import { useState, useCallback, useRef } from "react";
import { Card, Title, Text, Badge, Button, TextInput } from "@tremor/react";
import { Plus, Search, Infinity } from "lucide-react";
import { ACTION_BITS, type Action } from "@/lib/security/types";
import type {
  SecRole,
  SecModule,
  SecOption,
  SecResource,
  SecPermission,
} from "./SecurityModuleTabs";
import { callAction } from "@/lib/action-client";

/** Orden de módulos según el menú principal del admin. */
const NAV_MODULE_ORDER: Record<string, number> = {
  dashboard: 1,
  cms: 2,
  producto: 3,
  bingo: 4,
  configurac: 5,
  galer: 6,
};

function moduleNavIndex(name: string): number {
  const lower = name.toLowerCase();
  for (const [key, order] of Object.entries(NAV_MODULE_ORDER)) {
    if (lower.includes(key)) return order;
  }
  return 99;
}

const ACTIONS: Action[] = [
  "READ",
  "WRITE",
  "UPDATE",
  "DELETE",
  "PRINT",
  "DOWNLOAD",
  "UPLOAD",
  "EXECUTE",
];
const ACTION_LABELS: Record<Action, string> = {
  READ: "Leer",
  WRITE: "Crear",
  UPDATE: "Editar",
  DELETE: "Borrar",
  PRINT: "Impr.",
  DOWNLOAD: "Export.",
  UPLOAD: "Import.",
  EXECUTE: "Exec.",
  ALL: "Todas",
};

type MaskMap = Map<string, number>; // key: "optionId" | "optionId:resourceId"

function buildMaskMap(permissions: SecPermission[], roleId: string): MaskMap {
  const map = new Map<string, number>();
  permissions
    .filter((p) => p.role_id === roleId)
    .forEach((p) => {
      const key = p.resource_id ? `${p.option_id}:${p.resource_id}` : p.option_id;
      map.set(key, p.actions_mask);
    });
  return map;
}

interface Props {
  secRoles: SecRole[];
  moduleTree: SecModule[];
  initialPermissions: SecPermission[];
}

export default function PermissionMatrixClient({
  secRoles,
  moduleTree,
  initialPermissions,
}: Props) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(
    secRoles.find((r) => !r.is_super_admin)?.id ?? secRoles[0]?.id ?? null,
  );
  const [permissions, setPermissions] = useState<SecPermission[]>(initialPermissions);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState(0);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sortedModuleTree = [...moduleTree].sort(
    (a, b) => moduleNavIndex(a.name) - moduleNavIndex(b.name),
  );
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    () => new Set(moduleTree.map((m) => m.id)),
  );
  const toggleModule = (modId: string) =>
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(modId)) next.delete(modId);
      else next.add(modId);
      return next;
    });

  const selectedRole = secRoles.find((r) => r.id === selectedRoleId);
  const isLocked = selectedRole?.is_super_admin ?? false;

  const maskMap: MaskMap = selectedRoleId ? buildMaskMap(permissions, selectedRoleId) : new Map();

  const getMask = (optionId: string, resourceId?: string): number => {
    const key = resourceId ? `${optionId}:${resourceId}` : optionId;
    return maskMap.get(key) ?? 0;
  };

  const toggleBit = useCallback(
    (optionId: string, action: Action, resourceId?: string) => {
      if (!selectedRoleId || isLocked) return;
      const bit = ACTION_BITS[action];
      const currentMask = getMask(optionId, resourceId);
      const newMask = currentMask & bit ? currentMask & ~bit : currentMask | bit;

      // Optimistic update
      setPermissions((prev) => {
        const others = prev.filter(
          (p) =>
            !(
              p.role_id === selectedRoleId &&
              p.option_id === optionId &&
              p.resource_id === (resourceId ?? null)
            ),
        );
        if (newMask === 0) return others;
        return [
          ...others,
          {
            role_id: selectedRoleId,
            option_id: optionId,
            resource_id: resourceId ?? null,
            actions_mask: newMask,
          },
        ];
      });
      setPendingChanges((n) => n + 1);

      // Debounced server save
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await callAction("users.upsertPermission", [
            selectedRoleId,
            optionId,
            resourceId ?? null,
            newMask,
          ]);
          setPendingChanges(0);
        } finally {
          setSaving(false);
        }
      }, 500);
    },
    [selectedRoleId, isLocked, maskMap],
  );

  const toggleAll = useCallback(
    (optionId: string, resourceId?: string) => {
      if (!selectedRoleId || isLocked) return;
      const currentMask = getMask(optionId, resourceId);
      const newMask = currentMask === 255 ? 0 : 255;

      setPermissions((prev) => {
        const others = prev.filter(
          (p) =>
            !(
              p.role_id === selectedRoleId &&
              p.option_id === optionId &&
              p.resource_id === (resourceId ?? null)
            ),
        );
        if (newMask === 0) return others;
        return [
          ...others,
          {
            role_id: selectedRoleId,
            option_id: optionId,
            resource_id: resourceId ?? null,
            actions_mask: newMask,
          },
        ];
      });
      setPendingChanges((n) => n + 1);

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await callAction("users.upsertPermission", [
            selectedRoleId,
            optionId,
            resourceId ?? null,
            newMask,
          ]);
          setPendingChanges(0);
        } finally {
          setSaving(false);
        }
      }, 500);
    },
    [selectedRoleId, isLocked, maskMap],
  );

  const filteredRoles = secRoles.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.code.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Panel de roles */}
      <Card className="lg:w-72 shrink-0 !border-[#012060] dark:!border-dark-tremor-border">
        <div className="flex items-center justify-between mb-3">
          <Title className="text-sm font-semibold">Roles</Title>
          <Button
            size="xs"
            variant="secondary"
            icon={Plus}
            onClick={async () => {
              const code = prompt("Código del nuevo rol (MAYÚSCULAS):");
              const name = prompt("Nombre del rol:");
              if (!code || !name) return;
              await callAction("users.createSecRole", [code, name, ""]);
            }}
          >
            Nuevo
          </Button>
        </div>
        <TextInput
          placeholder="Buscar..."
          icon={Search}
          value={search}
          onValueChange={setSearch}
          className="mb-3"
        />
        <div className="flex flex-col gap-1.5 max-h-[600px] overflow-y-auto pr-1">
          {filteredRoles.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => setSelectedRoleId(role.id)}
              className={[
                "w-full text-left rounded-lg px-3 py-2.5 border transition-colors",
                selectedRoleId === role.id
                  ? "bg-blue-50 dark:bg-blue-900/20 border-[#012060] dark:border-blue-700"
                  : "bg-white dark:bg-gray-900 border-[#012060]/30 dark:border-gray-700 hover:bg-gray-50 hover:border-[#012060]/60 dark:hover:bg-gray-800",
              ].join(" ")}
            >
              <div className="flex items-center justify-between gap-2 mb-0.5">
                <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {role.name}
                </span>
                {role.is_super_admin ? (
                  <Badge color="red" size="xs">
                    SuperAdmin
                  </Badge>
                ) : role.is_system ? (
                  <Badge color="gray" size="xs">
                    Sistema
                  </Badge>
                ) : null}
              </div>
              <span className="font-mono text-xs text-gray-500">{role.code}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Matriz de permisos */}
      <div className="flex-1 min-w-0">
        {selectedRole ? (
          <Card className="!border-[#012060] dark:!border-dark-tremor-border">
            <div className="flex items-center justify-between mb-1">
              <div>
                <Title className="text-lg">{selectedRole.name}</Title>
                {selectedRole.description && (
                  <Text className="text-sm text-gray-500 mt-0.5">{selectedRole.description}</Text>
                )}
              </div>
              {isLocked && (
                <Badge color="red" icon={Infinity}>
                  Acceso irrestricto
                </Badge>
              )}
            </div>

            {/* HTML nativo: Tremor <Table> agrega overflow-auto internamente,
                lo que rompe position:sticky. Con <table> nativo tenemos control total. */}
            <div className="overflow-auto max-h-[calc(100vh-280px)] mt-4 rounded-md border border-[#012060] dark:border-gray-700">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-10 bg-white dark:bg-gray-900 shadow-sm">
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-medium text-gray-500 dark:text-gray-400 min-w-[200px] whitespace-nowrap">
                      Opción / Recurso
                    </th>
                    {ACTIONS.map((a) => (
                      <th
                        key={a}
                        className="text-center py-3 px-1 text-xs font-medium text-gray-500 dark:text-gray-400 w-14 whitespace-nowrap"
                      >
                        {ACTION_LABELS[a]}
                      </th>
                    ))}
                    <th className="text-center py-3 px-1 text-xs font-medium text-gray-500 dark:text-gray-400 w-14">
                      Todas
                    </th>
                    <th className="text-center py-3 px-1 text-xs font-medium text-gray-500 dark:text-gray-400 w-14">
                      Máscara
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedModuleTree.map((mod) => {
                    const isExpanded = expandedModules.has(mod.id);
                    return (
                      <>
                        {/* Fila de módulo — expandible */}
                        <tr
                          key={`mod-${mod.id}`}
                          className="bg-gray-50 dark:bg-gray-800/60 cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-800"
                          onClick={() => toggleModule(mod.id)}
                        >
                          <td
                            colSpan={ACTIONS.length + 3}
                            className="font-semibold text-sm text-gray-700 dark:text-gray-300 py-2 px-4 border-b border-gray-200 dark:border-gray-700"
                          >
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center justify-center w-4 h-4 rounded border border-gray-400 dark:border-gray-600 text-gray-500 text-[10px] font-bold leading-none select-none flex-shrink-0">
                                {isExpanded ? "−" : "+"}
                              </span>
                              {mod.name}
                              <span className="text-xs font-normal text-gray-400 ml-1">
                                ({mod.options.length})
                              </span>
                            </div>
                          </td>
                        </tr>

                        {isExpanded &&
                          mod.options.map((opt: SecOption) => {
                            const optMask = getMask(opt.id);
                            return (
                              <>
                                {/* Fila de opción */}
                                <tr
                                  key={`opt-${opt.id}`}
                                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50/50 dark:hover:bg-gray-800/30"
                                >
                                  <td className="font-medium text-sm py-2 pl-8 pr-4 text-gray-800 dark:text-gray-200">
                                    {opt.name}
                                  </td>
                                  {ACTIONS.map((a) => {
                                    const checked = (optMask & ACTION_BITS[a]) !== 0;
                                    return (
                                      <td key={a} className="text-center px-1 py-2">
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          disabled={isLocked}
                                          onChange={() => toggleBit(opt.id, a)}
                                          className="cursor-pointer accent-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                          title={
                                            isLocked
                                              ? "Rol con acceso irrestricto"
                                              : ACTION_LABELS[a]
                                          }
                                        />
                                      </td>
                                    );
                                  })}
                                  <td className="text-center px-1 py-2">
                                    <input
                                      type="checkbox"
                                      checked={optMask === 255}
                                      disabled={isLocked}
                                      onChange={() => toggleAll(opt.id)}
                                      className="cursor-pointer accent-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                      title="Seleccionar todas las acciones"
                                    />
                                  </td>
                                  <td className="text-center px-1 py-2">
                                    <Badge color={optMask > 0 ? "blue" : "gray"} size="xs">
                                      {optMask}
                                    </Badge>
                                  </td>
                                </tr>

                                {/* Filas de recursos */}
                                {opt.resources.map((res: SecResource) => {
                                  const resMask = getMask(opt.id, res.id);
                                  return (
                                    <tr
                                      key={`res-${res.id}`}
                                      className="bg-gray-50/50 dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-800"
                                    >
                                      <td className="text-xs text-gray-500 dark:text-gray-400 py-1.5 pl-14 pr-4">
                                        {res.display_name}{" "}
                                        <span className="font-mono text-gray-400">
                                          ({res.table_name})
                                        </span>
                                      </td>
                                      {ACTIONS.map((a) => {
                                        const checked = (resMask & ACTION_BITS[a]) !== 0;
                                        return (
                                          <td key={a} className="text-center px-1 py-1.5">
                                            <input
                                              type="checkbox"
                                              checked={checked}
                                              disabled={isLocked}
                                              onChange={() => toggleBit(opt.id, a, res.id)}
                                              className="cursor-pointer accent-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                            />
                                          </td>
                                        );
                                      })}
                                      <td className="text-center px-1 py-1.5">
                                        <input
                                          type="checkbox"
                                          checked={resMask === 255}
                                          disabled={isLocked}
                                          onChange={() => toggleAll(opt.id, res.id)}
                                          className="cursor-pointer accent-blue-600 disabled:opacity-40 disabled:cursor-not-allowed"
                                        />
                                      </td>
                                      <td className="text-center px-1 py-1.5">
                                        <Badge color={resMask > 0 ? "blue" : "gray"} size="xs">
                                          {resMask}
                                        </Badge>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </>
                            );
                          })}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Barra inferior */}
            {pendingChanges > 0 && (
              <div className="mt-4 flex items-center gap-3 text-sm text-amber-600 dark:text-amber-400">
                <span className="inline-block h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                {saving
                  ? "Guardando..."
                  : `${pendingChanges} cambio${pendingChanges > 1 ? "s" : ""} pendiente${pendingChanges > 1 ? "s" : ""}`}
              </div>
            )}
          </Card>
        ) : (
          <Card className="!border-[#012060] dark:!border-dark-tremor-border">
            <Text className="text-center text-gray-500 py-16">
              Selecciona un rol para ver y editar su matriz de permisos.
            </Text>
          </Card>
        )}
      </div>
    </div>
  );
}
