"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Card, Title, Text, TextInput, Button, Callout } from "@tremor/react";
import { User, Mail, Phone, Camera, Save, Lock, Eye, EyeOff, KeyRound } from "lucide-react";
import { callAction, callActionForm } from "@/lib/action-client";
import { useUser } from "@/providers/UserProvider";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { validatePasswordStrength } from "@/lib/auth/password";

interface ProfileClientProps {
  userProfile: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  };
}

export default function ProfileClient({ userProfile }: ProfileClientProps) {
  const { refreshProfile } = useUser();
  const [fullName, setFullName] = useState(userProfile.full_name || "");
  const [email, setEmail] = useState(userProfile.email || "");
  const [phone, setPhone] = useState(userProfile.phone || "");
  const [avatarUrl, setAvatarUrl] = useState(userProfile.avatar_url || "");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    userProfile.avatar_url,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estado del bloque "Cambiar Contraseña"
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("full_name", fullName);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("current_avatar_url", avatarUrl);
    if (avatarFile) {
      formData.append("avatar_url", avatarFile);
    }

    const result = await callActionForm<{
      success?: boolean;
      error?: string;
      message?: string;
      newAvatarUrl?: string;
    }>("profile.updateMyProfile", formData);

    if (result.success) {
      await refreshProfile(); // Actualizar el contexto global
      setMessage({
        type: "success",
        text: result.message || "Perfil actualizado con éxito.",
      });
      if (result.newAvatarUrl) setAvatarUrl(result.newAvatarUrl);
    } else {
      setMessage({ type: "error", text: result.error || "Ocurrió un error." });
    }

    setIsSaving(false);
  };

  /**
   * Envía el cambio de contraseña al dispatcher /api/actions.
   * Valida coincidencia y longitud mínima en cliente antes de llamar.
   */
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword) {
      setPasswordMessage({
        type: "error",
        text: "Ingresa tu contraseña actual.",
      });
      return;
    }
    const strengthError = validatePasswordStrength(newPassword);
    if (strengthError) {
      setPasswordMessage({ type: "error", text: strengthError });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "La confirmación no coincide con la nueva contraseña.",
      });
      return;
    }

    setIsSavingPassword(true);
    const result = await callAction<{ success?: boolean; error?: string; message?: string }>(
      "profile.updateMyPassword",
      [currentPassword, newPassword],
    );

    if (result.success) {
      setPasswordMessage({
        type: "success",
        text: result.message || "Contraseña actualizada correctamente.",
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setPasswordMessage({
        type: "error",
        text: result.error || "Ocurrió un error al cambiar la contraseña.",
      });
    }
    setIsSavingPassword(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Title className="text-2xl font-bold text-larioja-azul dark:text-larioja-amarillo">
        Mi Perfil
      </Title>
      <Text className="mb-6">
        Actualiza tu información personal y foto de perfil.
      </Text>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-lg">
                {previewUrl ? (
                  <Image
                    src={previewUrl}
                    alt="Avatar"
                    layout="fill"
                    objectFit="cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <User className="w-16 h-16 text-gray-400" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-1 right-1 bg-larioja-azul text-white p-2 rounded-full hover:bg-larioja-azul/90 transition-all shadow-md"
              >
                <Camera size={18} />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/webp"
              />
            </div>
            <div className="flex-1 w-full space-y-4">
              <div>
                <Text>Nombre Completo</Text>
                <TextInput
                  icon={User}
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <Text>Correo Secundario</Text>
                <TextInput
                  icon={Mail}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                />
              </div>
              <div>
                <Text>Teléfono de Contacto</Text>
                <TextInput
                  icon={Phone}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          {message && (
            <Callout
              title={message.type === "success" ? "Éxito" : "Error"}
              color={message.type === "success" ? "teal" : "rose"}
            >
              {message.text}
            </Callout>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button icon={Save} loading={isSaving} type="submit">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Card>

      <Card className="p-6 mt-6">
        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Title className="text-lg flex items-center gap-2">
                <KeyRound size={18} className="text-larioja-azul dark:text-larioja-amarillo" />
                Cambiar Contraseña
              </Title>
              <Text className="text-xs text-gray-500">
                Debe cumplir los requisitos de seguridad.
              </Text>
            </div>
            <button
              type="button"
              onClick={() => setShowPasswords(!showPasswords)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title={showPasswords ? "Ocultar contraseñas" : "Mostrar contraseñas"}
            >
              {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Text>Contraseña Actual</Text>
              <TextInput
                icon={Lock}
                type={showPasswords ? "text" : "password"}
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div>
              <Text>Nueva Contraseña</Text>
              <TextInput
                icon={Lock}
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              {/* Checklist en vivo, mismo componente que el login */}
              {newPassword.length > 0 && (
                <PasswordRequirements password={newPassword} />
              )}
            </div>
            <div>
              <Text>Confirmar Nueva</Text>
              <TextInput
                icon={Lock}
                type={showPasswords ? "text" : "password"}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                error={confirmPassword.length > 0 && newPassword !== confirmPassword}
                errorMessage="No coincide"
              />
            </div>
          </div>

          {passwordMessage && (
            <Callout
              title={passwordMessage.type === "success" ? "Éxito" : "Error"}
              color={passwordMessage.type === "success" ? "teal" : "rose"}
            >
              {passwordMessage.text}
            </Callout>
          )}

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-800">
            <Button icon={KeyRound} loading={isSavingPassword} type="submit">
              Actualizar Contraseña
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
