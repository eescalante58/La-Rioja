import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** Destino por defecto tras un login OAuth válido. */
const DEFAULT_NEXT = "/auth/select-company";

/**
 * Valida el parámetro `next` para evitar redirecciones abiertas: solo se
 * aceptan rutas internas ("/algo"). Se rechazan "//host", "/\host" y
 * cualquier valor que no empiece con "/" (p. ej. "@host", que concatenado
 * al origin produciría "https://sitio@host").
 * @param raw - Valor recibido en la query string.
 * @returns Ruta interna segura.
 */
function safeNext(raw: string | null): string {
  if (!raw || !raw.startsWith("/")) return DEFAULT_NEXT;
  if (raw.startsWith("//") || raw.startsWith("/\\")) return DEFAULT_NEXT;
  return raw;
}

/**
 * Callback OAuth (Google): intercambia el código por una sesión y verifica
 * que la cuenta esté autorizada (al menos una empresa en `user_companies`).
 * Autenticarse con Google no da acceso por sí solo: si la cuenta no tiene
 * empresa se cierra la sesión y se vuelve a /login con el aviso.
 * @param {Request} request - The incoming request.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = safeNext(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  const user = data?.user;

  if (error || !user) {
    return NextResponse.redirect(`${origin}/login?error=oauth`);
  }

  // RLS user_companies_select permite leer las filas propias.
  const { count, error: membershipError } = await supabase
    .from("user_companies")
    .select("company_id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (membershipError || !count) {
    await supabase.auth.signOut();
    return NextResponse.redirect(`${origin}/login?error=no_autorizado`);
  }

  await supabase.from("user_activity_log").insert({
    user_id: user.id,
    action: "LOGIN",
    entity: "users",
    metadata: {
      email: user.email,
      method: user.app_metadata?.provider ?? "oauth",
      timestamp: new Date().toISOString(),
    },
  });

  return NextResponse.redirect(`${origin}${next}`);
}
