import { createClient } from "@/lib/supabase/server";
import ProfileClient from "./ProfileClient";
import { Title, Text } from "@tremor/react";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="p-6">
        <Title>Error</Title>
        <Text>Debes iniciar sesión para ver tu perfil.</Text>
      </div>
    );
  }

  const { data: userProfile, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error || !userProfile) {
    return (
      <div className="p-6">
        <Title>Error</Title>
        <Text>No se pudo cargar el perfil de usuario.</Text>
      </div>
    );
  }

  return <ProfileClient userProfile={userProfile} />;
}
