"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Server action to fetch security advisors from the database.
 * This now queries the database directly to get real-time info.
 */
export async function getSecurityAdvisors() {
  const supabase = createClient();

  // Query to find views with SECURITY DEFINER
  const { data: definerViews, error: viewsError } = await supabase.rpc(
    "check_security_definer_views",
  );

  const advisors = [];

  if (!viewsError && definerViews) {
    definerViews.forEach((view: any) => {
      advisors.push({
        name: "security_definer_view",
        title: "Security Definer View",
        level: "ERROR",
        description:
          "Detects views defined with the SECURITY DEFINER property.",
        detail: `View \`public.${view.view_name}\` is defined with the SECURITY DEFINER property`,
        remediation:
          "https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view",
      });
    });
  }

  // Check for leaked password protection (simulated check or static if not queryable easily)
  advisors.push({
    name: "auth_leaked_password_protection",
    title: "Leaked Password Protection Disabled",
    level: "WARN",
    description: "Leaked password protection is currently disabled.",
    detail:
      "Supabase Auth prevents the use of compromised passwords by checking against HaveIBeenPwned.org.",
    remediation:
      "https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection",
  });

  return advisors;
}

/**
 * Server action to fetch security policies for a specific table.
 */
export async function getTablePolicies(tableName: string) {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_table_policies", {
    t_name: tableName,
  });
  if (error) {
    console.error("Error fetching policies:", error);
    return [];
  }
  return data;
}

/**
 * Server action to fetch RLS status for all tables.
 */
export async function getRLSStatus() {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("get_tables_rls_status");

  if (error) {
    console.error("Error fetching RLS status:", error);
    return [];
  }

  return data;
}

/**
 * Server action to fetch all views in the public schema.
 */
export async function getViewsStatus() {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_views_status");

  if (error) {
    console.error("Error fetching views status:", error);
    return [];
  }
  return data;
}
