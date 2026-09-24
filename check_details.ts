import { createAdminClient } from "./src/lib/supabase/server";

async function checkDetails() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wheel_items")
    .select("id, label, quantity, is_active")
    .eq("wheel_id", 1)
    .order("id");

  if (error) {
    console.error("Error checking stock:", error);
    return;
  }
  console.log("DETAILS:", JSON.stringify(data));
}

checkDetails();
