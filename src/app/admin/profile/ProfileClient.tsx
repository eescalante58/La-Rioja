"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { Card, Title, Text, TextInput, Button, Callout } from "@tremor/react";
import { User, Mail, Phone, Camera, Save } from "lucide-react";
import { updateMyProfile } from "./actions";
import { useUser } from "@/providers/UserProvider";

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

    const result = await updateMyProfile(formData);

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
    </div>
  );
}
