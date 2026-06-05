"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  TextInput,
  Button,
  Select,
  SelectItem,
} from "@tremor/react";
import { X, UserPlus, Upload, Smartphone } from "lucide-react";
import { createNewUser, uploadUserAvatar } from "@/app/admin/settings/users/actions";

interface Role {
  role_id: number;
  name: string;
}

interface CountryCode {
  iso2: string;
  name: string;
  phone_code: string;
  flag_emoji: string;
}

interface CreateUserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  roles: Role[];
  countryCodes: CountryCode[];
}

export default function CreateUserDialog({
  isOpen,
  onClose,
  roles,
  countryCodes,
}: CreateUserDialogProps) {
  const [loading, setLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    let avatarUrl = "";
    const avatarFile = formData.get("avatar") as File;
    if (avatarFile && avatarFile.size > 0) {
      const uploadRes = await uploadUserAvatar(formData);
      if (uploadRes.publicUrl) avatarUrl = uploadRes.publicUrl;
    }
    const data = {
      email: formData.get("email") as string,
      full_name: formData.get("full_name") as string,
      role_id: parseInt(formData.get("role_id") as string),
      secondary_email: formData.get("secondary_email") as string || "",
      phone: `${formData.get("phone_code")}${formData.get("phone_number")}`,
      avatar_url: avatarUrl,
      status: "active" as const,
    };
    const res = await createNewUser(data);
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
            <Title>Nuevo Usuario</Title>
            <Button variant="light" icon={X} onClick={onClose} />
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex flex-col items-center gap-4 mb-4">
              <div className="relative group">
                <img src={avatarPreview || "https://www.gravatar.com/avatar/000?d=mp"} className="h-24 w-24 rounded-full object-cover border-4 border-gray-50 shadow-lg" alt="Avatar" />
                <label className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                  <Upload size={20} />
                  <input type="file" name="avatar" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                </label>
              </div>
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Email Principal</Text>
              <TextInput name="email" type="email" placeholder="usuario@ejemplo.com" required />
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Nombre Completo</Text>
              <TextInput name="full_name" placeholder="Juan Pérez" required />
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Rol del Sistema</Text>
              <Select name="role_id" defaultValue={String(roles[0]?.role_id)}>
                {roles.map((r) => <SelectItem key={r.role_id} value={String(r.role_id)}>{r.name}</SelectItem>)}
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1 space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Código</Text>
                <Select name="phone_code" defaultValue="503">
                  {countryCodes.map((c) => <SelectItem key={c.iso2} value={c.phone_code}>{c.flag_emoji} +{c.phone_code}</SelectItem>)}
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Teléfono</Text>
                <TextInput name="phone_number" icon={Smartphone} placeholder="7000-0000" />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
              <Button icon={UserPlus} color="blue" loading={loading} type="submit">Crear Usuario</Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
