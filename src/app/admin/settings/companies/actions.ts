"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
 * Helper to check if the current user has a specific minimum role level.
 */
async function checkMinLevel(minLevel: number) {
  const supabase = await createClient();
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
 * Server action to fetch all companies.
 */
export async function getCompanies() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("*")
    .order("company_name", { ascending: true });

  if (error) {
    console.error("Error fetching companies:", error);
    return [];
  }
  return data;
}

/**
 * Server action to save a company (create or update).
 */
export async function saveCompany(formData: FormData) {
  if (!(await checkMinLevel(9))) {
    return { error: "No tienes permisos para gestionar empresas." };
  }

  const supabase = await createClient();
  const id = formData.get("id");
  const name = formData.get("company_name") as string;
  const phone_code = formData.get("phone_code_area") as string;
  const phone_number = formData.get("phone_number") as string;
  const timeoutStr = formData.get("session_timeout_minutes") as string;
  const session_timeout = timeoutStr ? parseInt(timeoutStr) : 30;

  const companyData = {
    company_name: name,
    phone_code_area: phone_code,
    phone_number: phone_number,
    session_timeout_minutes: session_timeout,
    updated_at: new Date().toISOString(),
  };

  let error;
  let finalId: string | null = id ? id.toString() : null;

  if (id) {
    const { data, error: updateError } = await supabase
      .from("companies")
      .update(companyData)
      .eq("company_id", id)
      .select();

    error = updateError;

    if (!error && (!data || data.length === 0)) {
      return {
        error:
          "No se encontró la empresa o no tienes permisos para actualizarla.",
      };
    }

    if (!error) await logActivity("UPDATE", "companies", finalId!, companyData);
  } else {
    const { data, error: insertError } = await supabase
      .from("companies")
      .insert([companyData])
      .select()
      .single();
    error = insertError;
    if (!error && data) {
      finalId = data.company_id.toString();
      await logActivity("CREATE", "companies", finalId, companyData);
    }
  }

  if (error) {
    console.error("Error saving company:", error);
    return { error: error.message };
  }

  revalidatePath("/admin/settings/companies");
  return { success: true };
}

/**
 * Server action to delete a company.
 */
export async function deleteCompany(id: number) {
  if (!(await checkMinLevel(10))) {
    return {
      error: "Solo los Super Administradores pueden eliminar empresas.",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("company_id", id);

  if (error) {
    return { error: error.message };
  }

  await logActivity("DELETE", "companies", id.toString());

  revalidatePath("/admin/settings/companies");
  return { success: true };
}
