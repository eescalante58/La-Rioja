import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { buildFbcCookie, buildFbpCookie, FB_COOKIE_OPTIONS } from "@/lib/tracking/fb-cookies";
import { buildGclCookie, GOOGLE_COOKIE_OPTIONS } from "@/lib/tracking/google-cookies";

/**
 * Proxy to handle canonical domain redirection, session refreshing and route protection.
 * @param {NextRequest} request - The incoming request.
 */
export async function proxy(request: NextRequest) {
  // Redirección canónica de www al dominio principal conservando ruta y parámetros
  const host = request.headers.get("host") || "";
  if (host === "www.lariojacflsv.site") {
    const url = request.nextUrl.clone();
    url.host = "lariojacflsv.site";
    url.protocol = "https:";
    return NextResponse.redirect(url, 308);
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const selectedCompany = request.cookies.get("selected_company_id")?.value;

  // Route Protection Logic
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Force company selection if not set
    if (!selectedCompany && request.nextUrl.pathname !== "/auth/select-company") {
      return NextResponse.redirect(new URL("/auth/select-company", request.url));
    }

    // Security module: when the Supabase JWT hook injects app_authz ({ v, sa, ma, o })
    // into the token, deny /admin access if the user has no superadmin flag, no module-admin
    // codes (ma) and no option permissions (o). When app_authz is absent the hook is not
    // configured and the check is skipped gracefully.
    // /admin/profile is exempt so the user can log out even after being denied.
    const SECURITY_BYPASS = ["/admin/profile"];
    if (!SECURITY_BYPASS.some((p) => request.nextUrl.pathname.startsWith(p))) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        try {
          const [, b64] = session.access_token.split(".");
          // base64url → base64 with padding
          const padded = b64
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(b64.length + ((4 - (b64.length % 4)) % 4), "=");
          const payload = JSON.parse(atob(padded)) as {
            app_authz?: { sa?: boolean; ma?: unknown[]; o?: Record<string, unknown> };
          };
          const authz = payload.app_authz;
          // Only enforce when app_authz is present (hook is configured).
          if (
            authz &&
            !authz.sa &&
            Object.keys(authz.o ?? {}).length === 0 &&
            (!authz.ma || authz.ma.length === 0)
          ) {
            const denyUrl = new URL("/acceso-denegado", request.url);
            denyUrl.searchParams.set("from", request.nextUrl.pathname);
            return NextResponse.redirect(denyUrl);
          }
        } catch {
          // JWT parse failed — allow through to avoid locking out legitimate users
        }
      }
    }
  }

  // Redirect from login or select-company if already done
  if (
    user &&
    selectedCompany &&
    (request.nextUrl.pathname === "/login" || request.nextUrl.pathname === "/auth/select-company")
  ) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Captura automática de cookies Meta (_fbc y _fbp) para rutas públicas
  if (!request.nextUrl.pathname.startsWith("/api")) {
    const fbclid = request.nextUrl.searchParams.get("fbclid");
    if (fbclid) {
      const existingFbc = request.cookies.get("_fbc")?.value;
      if (!existingFbc || !existingFbc.includes(fbclid)) {
        const fbcValue = buildFbcCookie(fbclid);
        response.cookies.set("_fbc", fbcValue, FB_COOKIE_OPTIONS);
      }
    }

    const existingFbp = request.cookies.get("_fbp")?.value;
    if (!existingFbp) {
      const fbpValue = buildFbpCookie();
      response.cookies.set("_fbp", fbpValue, FB_COOKIE_OPTIONS);
    }

    // Captura automática de cookies Google Ads (_gcl_aw, _gcl_gb, _gcl_ag) por 90 días
    const gclid = request.nextUrl.searchParams.get("gclid");
    if (gclid) {
      const existingGcl = request.cookies.get("_gcl_aw")?.value;
      if (!existingGcl || !existingGcl.includes(gclid)) {
        response.cookies.set("_gcl_aw", buildGclCookie(gclid), GOOGLE_COOKIE_OPTIONS);
      }
    }

    const gbraid = request.nextUrl.searchParams.get("gbraid");
    if (gbraid) {
      const existingGbraid = request.cookies.get("_gcl_gb")?.value;
      if (!existingGbraid || !existingGbraid.includes(gbraid)) {
        response.cookies.set("_gcl_gb", buildGclCookie(gbraid), GOOGLE_COOKIE_OPTIONS);
      }
    }

    const wbraid = request.nextUrl.searchParams.get("wbraid");
    if (wbraid) {
      const existingWbraid = request.cookies.get("_gcl_ag")?.value;
      if (!existingWbraid || !existingWbraid.includes(wbraid)) {
        response.cookies.set("_gcl_ag", buildGclCookie(wbraid), GOOGLE_COOKIE_OPTIONS);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt, sitemap.xml, manifest.json and static images/icons
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|robots\\.txt|sitemap\\.xml|manifest\\.json|.*\\.(?:ico|svg|png|jpg|jpeg|gif|webp|avif)$).*)",
  ],
};
