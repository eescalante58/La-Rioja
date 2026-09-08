import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Creates an administrative Supabase client using the Service Role Key.
 * This client bypasses RLS and can call admin auth functions (e.g. auth.admin.createUser).
 * MUST ONLY BE USED IN SERVER-SIDE CODE.
 */
export function createAdminClient() {
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error(
      "No se encontró la clave de servicio (SUPABASE_SERVICE_ROLE_KEY o NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY) en las variables de entorno.",
    );
  }

  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );
}

/**
 * Creates a static Supabase client that doesn't use cookies.
 * Ideal for public pages and ISR.
 */
export function createStaticClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    },
  );
}

/**
 * Creates a Supabase client for use in server-side (Server Components, Actions, Routes).
 * @param {string} [supabaseKey] - Optional custom Supabase key (e.g. Service Role Key).
 * @returns {Promise<ReturnType<typeof createServerClient>>} The Supabase server client.
 */
export async function createClient(supabaseKey?: string) {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: any }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
