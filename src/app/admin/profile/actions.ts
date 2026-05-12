"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateMyProfile(formData: FormData) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Usuario no autenticado." };
  }

  const fullName = formData.get("full_name") as string;
  const phone = formData.get("phone") as string;
  const secondaryEmail = formData.get("email") as string;
  const avatarFile = formData.get("avatar_url") as File;

  let avatar_url = formData.get("current_avatar_url") as string;
  const oldAvatarUrl = avatar_url;

  // Subir nueva imagen si se proporcionó una
  if (avatarFile && avatarFile.size > 0) {
    const fileName = `${user.id}/${Date.now()}_${avatarFile.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("user_avatar")
      .upload(fileName, avatarFile);

    if (uploadError) {
      console.error("Error subiendo avatar:", uploadError);
      return { success: false, error: "No se pudo subir la imagen." };
    }

    // Obtener la URL pública de la imagen subida
    const { data: publicUrlData } = supabase.storage
      .from("user_avatar")
      .getPublicUrl(fileName);

    avatar_url = publicUrlData.publicUrl;

    // Eliminar avatar anterior si existe
    if (oldAvatarUrl && oldAvatarUrl.includes("user_avatar")) {
      try {
        const url = new URL(oldAvatarUrl);
        const path = url.pathname.split("user_avatar/")[1];
        if (path) {
          await supabase.storage
            .from("user_avatar")
            .remove([decodeURIComponent(path)]);
        }
      } catch (e) {
        console.error("Error eliminando avatar anterior:", e);
      }
    }
  }

  // Actualizar el perfil del usuario en la tabla public.users
  const { error: updateError } = await supabase
    .from("users")
    .update({
      full_name: fullName,
      phone: phone,
      email: secondaryEmail,
      avatar_url: avatar_url,
    })
    .eq("id", user.id);

  if (updateError) {
    console.error("Error actualizando perfil:", updateError);
    return { success: false, error: "No se pudo actualizar el perfil." };
  }

  // Registro de auditoría
  await supabase.from("user_activity_log").insert({
    user_id: user.id,
    action: "UPDATE_PROFILE",
    entity: "users",
    metadata: {
      full_name: fullName,
      phone: phone,
      secondary_email: secondaryEmail,
      avatar_updated: avatar_url !== oldAvatarUrl,
      timestamp: new Date().toISOString(),
    },
  });

  revalidatePath("/admin/profile");
  revalidatePath("/admin"); // Revalidar layout para actualizar el avatar en el header
  return {
    success: true,
    message: "Perfil actualizado con éxito.",
    newAvatarUrl: avatar_url,
  };
}
