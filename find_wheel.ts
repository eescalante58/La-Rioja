import { createAdminClient } from "./src/lib/supabase/server";

async function findWheel() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("wheel_configs")
    .select("id, wheel_name")
    .eq("event_id", "20260821092300")
    .eq("published", true)
    .single();

  if (error) {
    console.error("Error finding wheel:", error);
    return;
  }
  console.log("FOUND_WHEEL_ID:", data.id);
}

findWheel();
