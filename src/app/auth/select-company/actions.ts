"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/**
 * Server Action for selecting the company.
 * Revalidates user membership and sets secure cookies.
 */
export async function selectCompany(formData: FormData) {
  const companyIdStr = formData.get("companyId") as string;
  const companyId = parseInt(companyIdStr);

  if (isNaN(companyId)) {
    console.error("ID de empresa inválido.");
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // P0.3: Revalidate: Check if user actually belongs to this company
  const { data: membership, error } = await supabase
    .from("user_companies")
    .select("companies(company_name)")
    .eq("user_id", user.id)
    .eq("company_id", companyId)
    .single();

  if (error || !membership) {
    console.error(
      `SECURITY ALERT: User ${user.id} tried to select company ${companyId} without membership.`
    );
    return;
  }

  const companyName = (membership.companies as any)?.company_name || "Empresa";

  // Set cookies with strict security settings
  const cookieStore = await cookies();
  
  const cookieOptions = {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 1 week
  };

  cookieStore.set("selected_company_id", companyIdStr, cookieOptions);
  cookieStore.set("selected_company_name", companyName, cookieOptions);

  redirect("/admin");
}
