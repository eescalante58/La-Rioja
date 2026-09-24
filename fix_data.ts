import { createAdminClient } from "./src/lib/supabase/server";

async function fixData() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wheel_items")
    .update({ is_active: true })
    .eq("wheel_id", 1)
    .gt("quantity", 0);

  if (error) {
    console.error("Error fixing data:", error);
    return;
  }
  console.log("DATA_FIXED: All items with stock are now active.");
}

fixData();
