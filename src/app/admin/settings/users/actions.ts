"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { requireRoleLevel } from "@/lib/auth/authorization";
import { withRole } from "@/lib/auth/guards";
import { userSchema, type UserInput } from "@/lib/validation/users";

/**
 * Devuelve todos los usuarios del sistema.
 */
export async function getUsers() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, email, full_name, secondary_email, phone, status, avatar_url")
    .order("full_name", { ascending: true });

  if (error) {
    console.error("Error fetching users:", error);
    return [];
  }
  return data;
}

/**
 * Devuelve los códigos de país disponibles.
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
 * Helper para registrar actividad del usuario.
 */
async function logActivity(
  action: string,
  entity: string,
  entityId: string | null,
  metadata: Record<string, unknown> = {},
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

async function createNewUserInternal(rawInput: UserInput) {
  const validation = userSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      error: "Datos inválidos: " + validation.error.issues.map((e) => e.message).join(", "),
    };
  }
  const data = validation.data;

  let supabaseAdmin;
  try {
    supabaseAdmin = createAdminClient();
  } catch (clientErr) {
    console.error("Error creating supabase admin client:", clientErr);
    return {
      error: "Error de configuración: Clave de servicio de Supabase no disponible en el servidor.",
    };
  }

  const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: "Rioja2026!",
    email_confirm: true,
    user_metadata: { full_name: data.full_name },
  });

  if (authError) {
    return { error: authError.message };
  }

  const { error: profileError } = await supabaseAdmin.from("users").upsert({
    id: authUser.user.id,
    email: data.email,
    full_name: data.full_name,
    secondary_email: data.secondary_email,
    phone: data.phone,
    avatar_url: data.avatar_url,
    status: "active",
    updated_at: new Date().toISOString(),
  });

  if (profileError) {
    await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
    return { error: profileError.message };
  }

  await logActivity("CREATE", "users", authUser.user.id, { email: data.email });

  revalidatePath("/admin/settings/users");
  return { success: true };
}

export const createNewUser = withRole(8, createNewUserInternal);

/**
 * Sube un avatar de usuario a Storage.
 */
export async function uploadUserAvatar(file: FormData) {
  const supabase = await createClient();
  const image = file.get("avatar") as File;
  const fileName = `${Date.now()}-${image.name}`;

  const { data, error } = await supabase.storage.from("user_avatar").upload(fileName, image);

  if (error) {
    return { error: error.message };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("user_avatar").getPublicUrl(fileName);

  return { publicUrl };
}

/**
 * Actualiza datos del perfil de un usuario.
 */
export async function updateUser(userId: string, rawInput: unknown) {
  const supabase = await createClient();
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser();

  if (!currentUser) return { error: "No autenticado." };

  const { level: currentLevel } = await requireRoleLevel(0);

  const validation = userSchema.partial().safeParse(rawInput);
  if (!validation.success) {
    return {
      error: "Datos inválidos: " + validation.error.issues.map((e) => e.message).join(", "),
    };
  }
  const data = validation.data;

  const isSelf = currentUser.id === userId;
  const isAdmin = currentLevel >= 8;
  const isAuthorized = isSelf || isAdmin;

  if (!isAuthorized) {
    return { error: "No tienes permisos para actualizar este perfil." };
  }

  const finalData = { ...data };
  if (!isAdmin) {
    delete finalData.status;
  }

  const { error } = await supabase
    .from("users")
    .update({
      full_name: finalData.full_name,
      secondary_email: finalData.secondary_email,
      phone: finalData.phone,
      status: finalData.status,
      avatar_url: finalData.avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  await logActivity("UPDATE", "users", userId, finalData);

  revalidatePath("/admin/settings/users");
  return { success: true };
}

async function deleteUserInternal(userId: string) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("users").delete().eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  await logActivity("DELETE", "users", userId);

  revalidatePath("/admin/settings/users");
  return { success: true };
}

export const deleteUser = withRole(10, deleteUserInternal);

/**
 * Asigna una empresa a un usuario.
 */
async function assignUserToCompanyInternal(userId: string, companyId: number) {
  const supabase = createAdminClient();

  const { error } = await supabase.from("user_companies").insert([
    {
      user_id: userId,
      company_id: companyId,
      role: "Miembro",
    },
  ]);

  if (error) {
    return { error: error.message };
  }

  await logActivity("ASSIGN_COMPANY", "user_companies", userId, { company_id: companyId });

  revalidatePath("/admin/settings/users");
  return { success: true };
}

export const assignUserToCompany = withRole(8, assignUserToCompanyInternal);

/**
 * Elimina la asignación de una empresa a un usuario.
 */
async function removeUserFromCompanyInternal(userId: string, companyId: number) {
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("user_companies")
    .delete()
    .match({ user_id: userId, company_id: companyId });

  if (error) {
    return { error: error.message };
  }

  await logActivity("REMOVE_COMPANY", "user_companies", userId, { company_id: companyId });

  revalidatePath("/admin/settings/users");
  return { success: true };
}

export const removeUserFromCompany = withRole(8, removeUserFromCompanyInternal);

/**
 * Devuelve las empresas asignadas a un usuario.
 */
export async function getUserCompanies(userId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("user_companies")
    .select("user_id, company_id, role, company:company_id (company_name)")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user companies:", error);
    return [];
  }
  return data;
}

// ─────────────────────────────────────────────────────────────────────────────
// MÓDULO DE SEGURIDAD — sec_* Server Actions
// ─────────────────────────────────────────────────────────────────────────────

/** Devuelve todos los roles del módulo de seguridad. */
export async function getSecRoles() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sec_roles")
    .select("id, code, name, description, is_super_admin, is_system, is_active")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching sec_roles:", error);
    return [];
  }
  return data ?? [];
}

/** Devuelve la jerarquía completa módulo → opción → recurso. */
export async function getModuleTree() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sec_modules")
    .select(
      `id, code, name, icon, order_index,
       sec_options (
         id, code, name, path_route, order_index,
         sec_resources ( id, table_name, display_name )
       )`,
    )
    .eq("is_active", true)
    .order("order_index", { ascending: true });

  if (error) {
    console.error("Error fetching module tree:", error);
    return [];
  }

  return (data ?? []).map((mod) => ({
    ...mod,
    options: (mod.sec_options ?? [])
      .sort(
        (a: { order_index: number }, b: { order_index: number }) => a.order_index - b.order_index,
      )
      .map((opt: { sec_resources?: unknown[]; [key: string]: unknown }) => ({
        ...opt,
        resources: opt.sec_resources ?? [],
      })),
  }));
}

/** Devuelve todas las filas de sec_permissions (todos los roles). */
export async function getSecPermissions() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sec_permissions")
    .select("role_id, option_id, resource_id, actions_mask");

  if (error) {
    console.error("Error fetching sec_permissions:", error);
    return [];
  }
  return data ?? [];
}

/** Inserta o actualiza la máscara de permisos para un rol/opción/recurso. */
export async function upsertPermission(
  roleId: string,
  optionId: string,
  resourceId: string | null,
  mask: number,
) {
  const { error: authError } = await requireRoleLevel(9);
  if (authError) return { error: authError };

  const supabase = createAdminClient();

  if (mask === 0) {
    const query = supabase
      .from("sec_permissions")
      .delete()
      .eq("role_id", roleId)
      .eq("option_id", optionId);
    if (resourceId) query.eq("resource_id", resourceId);
    else query.is("resource_id", null);
    const { error } = await query;
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("sec_permissions")
      .upsert(
        { role_id: roleId, option_id: optionId, resource_id: resourceId, actions_mask: mask },
        { onConflict: "role_id,option_id,resource_id" },
      );
    if (error) return { error: error.message };
  }

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/** Crea un nuevo rol en sec_roles. */
export async function createSecRole(code: string, name: string, description: string) {
  const { error: authError } = await requireRoleLevel(9);
  if (authError) return { error: authError };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sec_roles")
    .insert({ code: code.toUpperCase(), name, description, is_active: true })
    .select("id, code, name, description, is_super_admin, is_system, is_active")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/settings/users");
  return { data };
}

/** Actualiza nombre y descripción de un rol de seguridad (no modifica is_system ni is_super_admin). */
export async function updateSecRole(id: string, name: string, description: string) {
  const { error: authError } = await requireRoleLevel(9);
  if (authError) return { error: authError };

  if (!id || !name.trim()) return { error: "Nombre requerido." };

  const supabase = createAdminClient();

  const { data: target } = await supabase
    .from("sec_roles")
    .select("is_super_admin, is_system")
    .eq("id", id)
    .single();

  if (!target) return { error: "Rol no encontrado." };
  if (target.is_super_admin) return { error: "El rol Super Administrador no puede modificarse." };
  if (target.is_system) return { error: "Los roles de sistema no pueden modificarse." };

  const { error } = await supabase
    .from("sec_roles")
    .update({ name: name.trim(), description: description.trim() })
    .eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/** Elimina un rol de seguridad no-sistema. Falla si tiene asignaciones activas. */
export async function deleteSecRole(id: string) {
  const { error: authError } = await requireRoleLevel(9);
  if (authError) return { error: authError };

  const supabase = createAdminClient();

  const { data: target } = await supabase
    .from("sec_roles")
    .select("is_super_admin, is_system, name")
    .eq("id", id)
    .single();

  if (!target) return { error: "Rol no encontrado." };
  if (target.is_super_admin) return { error: "El rol Super Administrador no puede eliminarse." };
  if (target.is_system) return { error: "Los roles de sistema no pueden eliminarse." };

  const { count } = await supabase
    .from("sec_user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role_id", id)
    .eq("is_active", true);

  if ((count ?? 0) > 0) {
    return { error: "El rol tiene usuarios asignados. Revoca las asignaciones primero." };
  }

  const { error } = await supabase.from("sec_roles").delete().eq("id", id);

  if (error) return { error: error.message };

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/** Devuelve todas las asignaciones de roles a usuarios (sec_user_roles). */
export async function getSecUserRoles() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sec_user_roles")
    .select("id, user_id, role_id, valid_from, valid_to, is_active, sec_roles (code, name)")
    .order("valid_from", { ascending: false });

  if (error) {
    console.error("Error fetching sec_user_roles:", error);
    return [];
  }
  return data ?? [];
}

/** Asigna un rol de seguridad a un usuario. */
export async function assignSecRole(
  userId: string,
  roleId: string,
  validFrom: string,
  validTo: string | null,
) {
  const { error: authError } = await requireRoleLevel(9);
  if (authError) return { error: authError };

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("sec_user_roles")
    .insert({
      user_id: userId,
      role_id: roleId,
      valid_from: validFrom,
      valid_to: validTo ?? null,
      is_active: true,
    })
    .select("id, user_id, role_id, valid_from, valid_to, is_active, sec_roles (code, name)")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/admin/settings/users");
  return { data };
}

/** Revoca una asignación de rol (desactiva la fila). */
export async function revokeSecRole(assignmentId: string) {
  const { error: authError } = await requireRoleLevel(9);
  if (authError) return { error: authError };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("sec_user_roles")
    .update({ is_active: false, valid_to: new Date().toISOString() })
    .eq("id", assignmentId);

  if (error) return { error: error.message };

  revalidatePath("/admin/settings/users");
  return { success: true };
}
