"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

/**
 * Server action to fetch all country codes.
 */
export async function getCountryCodes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("country_codes")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    console.error("Error fetching country codes:", error);
    return [];
  }
  return data;
}

/**
 * Server action to create or update a country code.
 */
export async function saveCountryCode(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const id = formData.get("id");
  const iso2 = formData.get("iso2") as string;
  const iso3 = formData.get("iso3") as string;
  const name = formData.get("name") as string;
  const phone_code = formData.get("phone_code") as string;
  const flag_emoji = formData.get("flag_emoji") as string;

  const countryData = {
    iso2,
    iso3,
    name,
    phone_code,
    flag_emoji,
    updated_at: new Date().toISOString(),
  };

  let error;
  let action: "INSERT" | "UPDATE" = id ? "UPDATE" : "INSERT";

  if (id) {
    const { error: updateError } = await supabase
      .from("country_codes")
      .update(countryData)
      .eq("id", id);
    error = updateError;
  } else {
    const { error: insertError } = await supabase
      .from("country_codes")
      .insert([countryData]);
    error = insertError;
  }

  if (error) {
    return { error: error.message };
  }

  // Log activity
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: action,
      entity: "country_codes",
      metadata: {
        country_name: name,
        iso2: iso2,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/settings/countries");
  return { success: true };
}

/**
 * Server action to delete a country code.
 */
export async function deleteCountryCode(id: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get name before deleting for the log
  const { data: country } = await supabase
    .from("country_codes")
    .select("name")
    .eq("id", id)
    .single();

  const { error } = await supabase.from("country_codes").delete().eq("id", id);

  if (error) {
    return { error: error.message };
  }

  // Log activity
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "DELETE",
      entity: "country_codes",
      metadata: {
        country_id: id,
        country_name: country?.name || "Unknown",
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/settings/countries");
  return { success: true };
}

/**
 * Server action to bulk import country codes.
 */
export async function importCountryCodes(countries: any[]) {
  const supabase = await createClient();

  // Get current user for logging
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const formattedData = countries.map((c) => ({
    iso2: c.iso2,
    iso3: c.iso3,
    name: c.name,
    phone_code: c.phone_code,
    flag_emoji: c.flag_emoji || null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("country_codes")
    .upsert(formattedData, { onConflict: "iso2" });

  if (error) {
    return { error: error.message };
  }

  // Log activity
  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "BULK_IMPORT",
      entity: "country_codes",
      metadata: {
        count: countries.length,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/settings/countries");
  return { success: true };
}

/**
 * Server action to log data export activity.
 */
export async function logExportActivity(count: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "DATA_EXPORT",
      entity: "country_codes",
      metadata: {
        count,
        format: "JSON",
        timestamp: new Date().toISOString(),
      },
    });
  }
  return { success: true };
}
