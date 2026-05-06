"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Server action to fetch all companies.
 */
export async function getCompanies() {
  const supabase = createClient();
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
  const supabase = createClient();
  const id = formData.get("id");
  const name = formData.get("company_name") as string;
  const phone_code = formData.get("phone_code_area") as string;
  const phone_number = formData.get("phone_number") as string;
  const session_timeout =
    parseInt(formData.get("session_timeout_minutes") as string) || 30;

  const companyData = {
    company_name: name,
    phone_code_area: phone_code,
    phone_number: phone_number,
    session_timeout_minutes: session_timeout,
    updated_at: new Date().toISOString(),
  };

  let error;
  if (id) {
    const { error: updateError } = await supabase
      .from("companies")
      .update(companyData)
      .eq("company_id", id);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("companies")
      .insert([companyData]);
    error = insertError;
  }

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/settings/companies");
  return { success: true };
}

/**
 * Server action to delete a company.
 */
export async function deleteCompany(id: number) {
  const supabase = createClient();
  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("company_id", id);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/admin/settings/companies");
  return { success: true };
}
