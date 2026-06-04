"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Server action to fetch activity logs.
 */
export async function getActivityLogs() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_activity_log")
    .select(
      `
      *,
      users:user_id (full_name, email)
    `,
    )
    .order("timestamp", { ascending: false })
    .limit(100);

  if (error) {
    console.error("Error fetching activity logs:", error);
    return [];
  }
  return data;
}
