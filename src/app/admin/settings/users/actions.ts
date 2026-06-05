"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireRoleLevel } from "@/lib/auth/authorization";
import { userSchema, roleSchema, type UserInput, type RoleInput } from "@/lib/validation/users";

/**
 * Server action to fetch all users with their roles.
 */
export async function getUsersWithRoles() {
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const supabase = await createClient();
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
 * Server action to create a new user (Auth + Profile).
 */
export async function createNewUser(rawInput: UserInput) {
  const { error: authErrorRBAC } = await requireRoleLevel(80);
  if (authErrorRBAC) {
    return { error: authErrorRBAC };
  }

  // Validation with Zod
  const validation = userSchema.safeParse(rawInput);
  if (!validation.success) {
    return { error: "Datos inválidos: " + validation.error.issues.map(e => e.message).join(", ") };
  }
  const data = validation.data;

  // Need a special client with Service Role Key for admin operations
  const supabaseAdmin = await createClient(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
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
  const supabase = await createClient();
  const image = file.get("avatar") as File;
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
export async function updateUser(userId: string, rawInput: any) {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) return { error: "No autenticado." };

  const { level: currentLevel } = await requireRoleLevel(0);

  // Validation with Zod
  const validation = userSchema.partial().safeParse(rawInput);
  if (!validation.success) {
    return { error: "Datos inválidos: " + validation.error.issues.map(e => e.message).join(", ") };
  }
  const data = validation.data;

  // RBAC: Admins (80+) can update anyone. Others can only update themselves.
  const isSelf = currentUser.id === userId;
  const isAdmin = currentLevel >= 80;
  const isAuthorized = isSelf || isAdmin;

  if (!isAuthorized) {
    return { error: "No tienes permisos para actualizar este perfil." };
  }

  // Security: Non-admins cannot change their own role or status
  const finalData = { ...data };
  if (!isAdmin) {
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

  await logActivity("UPDATE", "users", userId, rawInput);

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/**
 * Server action to delete a user.
 */
export async function deleteUser(userId: string) {
  const { error: authError } = await requireRoleLevel(100);
  if (authError) return { error: authError };

  const supabase = await createClient();

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
export async function createRole(rawInput: RoleInput) {
  const { error: authErrorRBAC } = await requireRoleLevel(100);
  if (authErrorRBAC) return { error: authErrorRBAC };

  // Validation with Zod
  const validation = roleSchema.safeParse(rawInput);
  if (!validation.success) {
    return { error: "Datos inválidos: " + validation.error.issues.map(e => e.message).join(", ") };
  }
  const data = validation.data;

  const supabase = await createClient();
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
export async function updateRole(roleId: number, rawInput: any) {
  const { error: authErrorRBAC } = await requireRoleLevel(100);
  if (authErrorRBAC) return { error: authErrorRBAC };

  // Validation with Zod
  const validation = roleSchema.partial().safeParse(rawInput);
  if (!validation.success) {
    return { error: "Datos inválidos: " + validation.error.issues.map(e => e.message).join(", ") };
  }
  const data = validation.data;

  const supabase = await createClient();
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
  const { error: authError } = await requireRoleLevel(100);
  if (authError) return { error: authError };
  const supabase = await createClient();
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
  const { error: authError } = await requireRoleLevel(80);
  if (authError) return { error: authError };
  const supabase = await createClient();
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
  const { error: authError } = await requireRoleLevel(80);
  if (authError) return { error: authError };
  const supabase = await createClient();
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
  const { error: authError } = await requireRoleLevel(80);
  if (authError) return { error: authError };
  const supabase = await createClient();
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
  const supabase = await createClient();
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
