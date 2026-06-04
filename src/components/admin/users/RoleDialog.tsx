"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  TextInput,
  Button,
} from "@tremor/react";
import { X, Save } from "lucide-react";
import { createRole, updateRole } from "@/app/admin/settings/users/actions";

interface Role {
  role_id: number;
  name: string;
  description: string;
  level: number;
}

interface RoleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  role: Role | null;
}

export default function RoleDialog({
  isOpen,
  onClose,
  role,
}: RoleDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      level: parseInt(formData.get("level") as string),
    };
    const res = role
      ? await updateRole(role.role_id, data)
      : await createRole(data);
    if (res.success) window.location.reload();
    else {
      alert("Error: " + res.error);
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 sm:backdrop-blur-sm z-50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl sm:shadow-xl border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <Title>{role ? "Editar Rol" : "Nuevo Rol"}</Title>
            <Button variant="light" icon={X} onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Nombre del Rol</Text>
              <TextInput name="name" defaultValue={role?.name || ""} required />
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Nivel de Acceso (0-100)</Text>
              <TextInput type="number" name="level" defaultValue={String(role?.level || 0)} required />
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Descripción</Text>
              <textarea name="description" className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent dark:text-white h-24" defaultValue={role?.description || ""} />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
              <Button icon={Save} color="blue" loading={loading} type="submit">{role ? "Actualizar" : "Crear"} Rol</Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
