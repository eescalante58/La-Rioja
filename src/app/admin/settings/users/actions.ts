"use server";

import { createClient } from "@/lib/supabase/server";
import { createServerClient } from "@supabase/ssr";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

/**
 * Server action to fetch all users with their roles.
 */
export async function getUsersWithRoles() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select(
      `
      *,
      roles:role_id (name, level)
    `,
    )
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  return data;
}

/**
 * Server action to fetch all available roles.
 */
export async function getRoles() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("roles")
    .select("*")
    .order("level", { ascending: false });

  if (error) {
    console.error("Error fetching roles:", error);
    return [];
  }
  return data;
}

/**
 * Server action to fetch all country codes.
 */
export async function getCountryCodes() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("country_codes")
    .select("iso2, name, phone_code, flag_emoji")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching country codes:", error);
    return [];
  }
  return data;
}

/**
 * Helper to log user activity.
 */
async function logActivity(
  action: string,
  entity: string,
  entityId: string | null,
  metadata: any = {},
) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from("user_activity_log").insert([
    {
      user_id: user.id,
      action,
      entity,
      entity_id: entityId,
      metadata,
      timestamp: new Date().toISOString(),
    },
  ]);
}

/**
 * Helper to check if the current user has a specific minimum role level.
 */
async function checkMinLevel(minLevel: number) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data: userData } = await supabase
    .from("users")
    .select("roles:role_id (level)")
    .eq("id", user.id)
    .single();

  const level = (userData?.roles as any)?.level || 0;
  return level >= minLevel;
}

/**
 * Server action to create a new user (Auth + Profile).
 */
export async function createNewUser(data: {
  email: string;
  full_name: string;
  role_id: number;
  secondary_email?: string;
  phone?: string;
  avatar_url?: string;
}) {
  if (!(await checkMinLevel(80))) {
    return { error: "No tienes permisos para crear usuarios." };
  }

  const cookieStore = cookies();

  // Need a special client with Service Role Key for admin operations
  const supabaseAdmin = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    },
  );

  // 1. Create user in Supabase Auth
  const { data: authUser, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: "Rioja2026!", // Temporary password
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });

  if (authError) {
    return { error: authError.message };
  }

  // 2. Profile update (public.users)
  const { error: profileError } = await supabaseAdmin
    .from("users")
    .update({
      full_name: data.full_name,
      secondary_email: data.secondary_email,
      phone: data.phone,
      role_id: data.role_id,
      avatar_url: data.avatar_url,
      status: "active",
    })
    .eq("id", authUser.user.id);

  if (profileError) {
    return { error: profileError.message };
  }

  await logActivity("CREATE", "users", authUser.user.id, {
    email: data.email,
    role_id: data.role_id,
  });

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/**
 * Server action to upload a user avatar.
 */
export async function uploadUserAvatar(file: FormData) {
  const supabase = createClient();
  const image = file.get("file") as File;
  const fileName = `${Date.now()}-${image.name}`;

  const { data, error } = await supabase.storage
    .from("user_avatar")
    .upload(fileName, image);

  if (error) {
    return { error: error.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("user_avatar").getPublicUrl(fileName);

  return { publicUrl };
}

/**
 * Server action to update a user's role and status.
 */
export async function updateUser(userId: string, data: any) {
  const supabase = createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) return { error: "No autenticado." };

  // RBAC: Admins (80+) can update anyone. Others can only update themselves.
  const isSelf = currentUser.id === userId;
  const isAuthorized = isSelf || (await checkMinLevel(80));

  if (!isAuthorized) {
    return { error: "No tienes permisos para actualizar este perfil." };
  }

  // Security: Non-admins cannot change their own role or status
  const finalData = { ...data };
  if (!isSelf || (await checkMinLevel(80))) {
    // Keep requested role/status if admin or editing someone else
  } else {
    // If self-editing and NOT admin, remove role_id and status from update
    delete finalData.role_id;
    delete finalData.status;
  }

  const { error } = await supabase
    .from("users")
    .update({
      full_name: finalData.full_name,
      secondary_email: finalData.secondary_email,
      phone: finalData.phone,
      role_id: finalData.role_id,
      status: finalData.status,
      avatar_url: finalData.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  await logActivity("UPDATE", "users", userId, data);

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/**
 * Server action to delete a user.
 */
export async function deleteUser(userId: string) {
  if (!(await checkMinLevel(100))) {
    return {
      error: "Solo los Super Administradores pueden eliminar usuarios.",
    };
  }

  const supabase = createClient();

  // Note: This only deletes from our 'users' table, not Supabase Auth
  const { error } = await supabase.from("users").delete().eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  await logActivity("DELETE", "users", userId);

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/**
 * Server action to create a new role.
 */
export async function createRole(data: any) {
  if (!(await checkMinLevel(100))) {
    return { error: "Solo los Super Administradores pueden gestionar roles." };
  }
  const supabase = createClient();
  const { data: newRole, error } = await supabase
    .from("roles")
    .insert([data])
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  await logActivity("CREATE", "roles", newRole.role_id, data);

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/**
 * Server action to update a role.
 */
export async function updateRole(roleId: number, data: any) {
  if (!(await checkMinLevel(100))) {
    return { error: "Solo los Super Administradores pueden gestionar roles." };
  }
  const supabase = createClient();
  const { error } = await supabase
    .from("roles")
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq("role_id", roleId);

  if (error) {
    return { error: error.message };
  }

  await logActivity("UPDATE", "roles", roleId.toString(), data);

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/**
 * Server action to delete a role.
 */
export async function deleteRole(roleId: number) {
  if (!(await checkMinLevel(100))) {
    return { error: "Solo los Super Administradores pueden gestionar roles." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("roles").delete().eq("role_id", roleId);

  if (error) {
    return { error: error.message };
  }

  await logActivity("DELETE", "roles", roleId.toString());

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/**
 * Server action to assign a user to a company.
 */
export async function assignUserToCompany(
  userId: string,
  companyId: number,
  roleId: number,
) {
  if (!(await checkMinLevel(80))) {
    return { error: "No tienes permisos para gestionar empresas de usuarios." };
  }
  const supabase = createClient();
  const { error } = await supabase.from("user_companies").insert([
    {
      user_id: userId,
      company_id: companyId,
      role_id: roleId,
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  await logActivity("ASSIGN_COMPANY", "user_companies", userId, {
    company_id: companyId,
    role_id: roleId,
  });

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/**
 * Server action to remove a user from a company.
 */
export async function removeUserFromCompany(userId: string, companyId: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_companies")
    .delete()
    .match({ user_id: userId, company_id: companyId });

  if (error) {
    return { error: error.message };
  }

  await logActivity("REMOVE_COMPANY", "user_companies", userId, {
    company_id: companyId,
  });

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/**
 * Server action to update user-company role.
 */
export async function updateUserCompanyRole(
  userId: string,
  companyId: number,
  roleId: number,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("user_companies")
    .update({
      role_id: roleId,
      updated_at: new Date().toISOString(),
    })
    .match({ user_id: userId, company_id: companyId });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/**
 * Server action to fetch user-company relationships.
 */
export async function getUserCompanies(userId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("user_companies")
    .select(
      `
      *,
      company:company_id (company_name),
      role_data:role_id (name)
    `,
    )
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user companies:", error);
    return [];
  }
  return data;
}
