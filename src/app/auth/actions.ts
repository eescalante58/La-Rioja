"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

/**
 * Handles email and password login.
 * @param {FormData} formData - The login form data.
 */
export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/auth/select-company");
}

/**
 * Handles sign out.
 */
export async function signOut() {
  const supabase = createClient();
  await supabase.auth.signOut();

  // Clear company cookies
  cookies().delete("selected_company_id");
  cookies().delete("selected_company_name");

  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Handles OAuth login (Google, Facebook, X).
 * @param {string} provider - The provider name.
 */
export async function signInWithOAuth(
  provider: "google" | "facebook" | "twitter",
) {
  const supabase = createClient();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${siteUrl}/auth/callback`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  if (data.url) {
    redirect(data.url);
  }
}

/**
 * Sends a password reset email.
 * @param {string} email - The user's email.
 */
export async function resetPasswordForEmail(email: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
  });

  if (error) {
    console.error("Error resetting password:", error);
    return { error: error.message };
  }

  return { success: true };
}

/**
 * Updates the user's password.
 * @param {string} password - The new password.
 */
export async function updatePassword(password: string) {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("Error updating password:", error);
    return { error: error.message };
  }

  return { success: true };
}
