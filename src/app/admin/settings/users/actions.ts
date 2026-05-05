"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Server action to fetch all users with their roles.
 */
export async function getUsersWithRoles() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("users")
    .select(`
      *,
      roles:role_id (name)
    `)
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
 * Server action to update a user's role and status.
 */
export async function updateUser(userId: string, data: any) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from("users")
    .update({
      role_id: data.role_id,
      status: data.status,
      updated_at: new Date().toISOString()
    })
    .eq("id", userId);

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
    .select(`
      *,
      company:company_id (company_name),
      role_data:role_id (name)
    `)
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user companies:", error);
    return [];
  }
  return data;
}
