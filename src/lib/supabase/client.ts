import { createBrowserClient } from "@supabase/ssr";

/**
 * Creates a Supabase client for use in browser-side (Client Components).
 * @returns {ReturnType<typeof createBrowserClient>} The Supabase browser client.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
