"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";

/**
 * Origen (protocolo + dominio) desde el que el usuario hizo la petición.
 * Los flujos PKCE (OAuth y recuperación de contraseña) guardan la cookie
 * `code-verifier` en el dominio actual; si la URL de retorno apunta a otro
 * dominio (p. ej. un dominio alterno o un preview de Vercel) la cookie no
 * viaja y el intercambio del código falla. Por eso el retorno debe volver
 * al mismo dominio. Next valida que Origin coincida con Host en las Server
 * Actions, y Supabase solo acepta URLs de su lista de redirección.
 * @returns Origen, o NEXT_PUBLIC_SITE_URL como respaldo.
 */
async function getRequestOrigin(): Promise<string> {
  const h = await headers();
  const origin = h.get("origin");
  if (origin) return origin;
  const host = h.get("x-forwarded-host") ?? h.get("host");
  if (host) return `${h.get("x-forwarded-proto") ?? "https"}://${host}`;
  return process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

/**
 * Handles email and password login.
 * @param {FormData} formData - The login form data.
 */
export async function login(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  // Log activity
  if (data.user) {
    await supabase.from("user_activity_log").insert({
      user_id: data.user.id,
      action: "LOGIN",
      entity: "users",
      metadata: {
        email: data.user.email,
        method: "password",
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/", "layout");
  redirect("/auth/select-company");
}

/**
 * Handles sign out.
 */
export async function signOut() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "LOGOUT",
      entity: "users",
      metadata: {
        email: user.email,
        timestamp: new Date().toISOString(),
      },
    });
  }

  await supabase.auth.signOut();

  // Clear company cookies
  const cookieStore = await cookies();
  cookieStore.delete("selected_company_id");
  cookieStore.delete("selected_company_name");

  revalidatePath("/", "layout");
  redirect("/login");
}

/**
 * Inicia el login OAuth. Solo Google: es la única cuenta social que usa el
 * personal. La autorización (empresa asignada) se valida en /auth/callback.
 * @param provider - Proveedor OAuth.
 */
export async function signInWithOAuth(provider: "google") {
  const supabase = await createClient();
  const siteUrl = await getRequestOrigin();
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
  const supabase = await createClient();
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${await getRequestOrigin()}/auth/reset-password`,
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
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("Error updating password:", error);
    return { error: error.message };
  }

  return { success: true };
}
