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
      roles:role_id (name)
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
    .select("iso2, name, phone_code")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching country codes:", error);
    return [];
  }
  return data;
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

  const { error } = await supabase
    .from("users")
    .update({
      full_name: data.full_name,
      role_id: data.role_id,
      status: data.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/**
 * Server action to delete a user.
 */
export async function deleteUser(userId: string) {
  const supabase = createClient();

  // Note: This only deletes from our 'users' table, not Supabase Auth
  const { error } = await supabase.from("users").delete().eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/**
 * Server action to create a new role.
 */
export async function createRole(data: any) {
  const supabase = createClient();
  const { error } = await supabase.from("roles").insert([data]);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/**
 * Server action to update a role.
 */
export async function updateRole(roleId: number, data: any) {
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

  revalidatePath("/admin/settings/users");
  return { success: true };
}

/**
 * Server action to delete a role.
 */
export async function deleteRole(roleId: number) {
  const supabase = createClient();
  const { error } = await supabase.from("roles").delete().eq("role_id", roleId);

  if (error) {
    return { error: error.message };
  }

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
