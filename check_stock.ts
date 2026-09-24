import { createAdminClient } from "./src/lib/supabase/server";

async function checkStock() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wheel_items")
    .select("id, label, quantity")
    .eq("wheel_id", 1)
    .order("id");

  if (error) {
    console.error("Error checking stock:", error);
    return;
  }
  console.log("CURRENT_STOCK:", JSON.stringify(data));
}

checkStock();
