// proxy.ts (raíz del proyecto) — Next.js 16.
// Guard optimista de rutas: verifica sesión y permiso de la opción con los claims del JWT, sin consultar la base.
// La autorización definitiva ocurre en el servidor (requireOption / requirePermission) y en RLS.

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { canOption, type AuthzClaims } from "@/lib/security/types";
import { isAuthenticatedOnly, isPublic, matchRoute } from "@/lib/security/routes.generated";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Feature flag: mantener en false hasta que el JWT Hook esté activado en Supabase
  // y el primer SuperAdmin tenga asignación en sec_user_roles.
  // Cambiar a true en .env (SECURITY_MODULE_ENABLED=true) después de verificar los claims.
  const securityEnabled = process.env.SECURITY_MODULE_ENABLED === "true";

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options: CookieOptions }[]) => {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // getClaims() valida la firma del JWT y refresca la sesión si expiró
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const path = request.nextUrl.pathname;

  // '/' necesita match exacto — startsWithSegment('/', '/') = true, pero forzamos
  // aquí también para garantizar que el bundle recompilado no use caché vieja.
  if (path === "/" || isPublic(path)) return response;

  if (!claims) {
    const login = request.nextUrl.clone();
    login.pathname = "/login";
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  if (isAuthenticatedOnly(path)) return response;

  // Bypass durante migración: si el flag no está activo, dejar pasar rutas autenticadas
  if (!securityEnabled) return response;

  const route = matchRoute(path);
  const authz = claims.app_authz as AuthzClaims | undefined;

  // Fail-closed: una ruta no catalogada en sec_options se deniega
  if (!route || !canOption(authz, route.option, "READ")) {
    const denied = request.nextUrl.clone();
    denied.pathname = "/acceso-denegado";
    denied.searchParams.set("from", path);
    const res = NextResponse.rewrite(denied, { status: 403 });
    response.cookies.getAll().forEach((c) => res.cookies.set(c));
    return res;
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/health|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
