// lib/security/routes.generated.ts
// GENERADO / mantenido a mano hasta que las tablas sec_* existan en producción.
// Cuando el módulo esté activo, regenerar con: npm run sec:routes
// Refleja las sec_options del 02_sec_seed.sql (La Rioja).

export interface SecuredRoute {
  prefix: string;
  option: string;
  module: string;
}

/**
 * Rutas protegidas por una opción de seguridad catalogada.
 * Ordenadas de la más específica (ruta más larga) a la más general,
 * para que matchRoute() tome el permiso correcto en sub-rutas.
 */
export const SECURED_ROUTES: readonly SecuredRoute[] = [
  // CONFIG ─────────────────────────────────────────────────────────────
  { prefix: "/admin/settings/users", option: "CFG_USERS_ROLES", module: "CONFIG" },
  { prefix: "/admin/settings/logs", option: "CFG_AUDIT", module: "CONFIG" },
  { prefix: "/admin/settings/companies", option: "CFG_COMPANIES", module: "CONFIG" },
  { prefix: "/admin/settings/countries", option: "CFG_COUNTRY_CODES", module: "CONFIG" },
  { prefix: "/admin/settings/students", option: "CFG_STUDENTS", module: "CONFIG" },
  { prefix: "/admin/settings/contact", option: "CFG_CONTACT_MSGS", module: "CONFIG" },
  { prefix: "/admin/settings/registration-limits", option: "CFG_REG_LIMITS", module: "CONFIG" },
  { prefix: "/admin/settings/test-data", option: "CFG_TEST_DATA", module: "CONFIG" },
  // BINGO ───────────────────────────────────────────────────────────────
  { prefix: "/admin/bingo", option: "BINGO_EVENTS", module: "BINGO" },
  // CMS ─────────────────────────────────────────────────────────────────
  { prefix: "/admin/cms", option: "CMS_CONTENT", module: "CMS" },
  // SHOP ────────────────────────────────────────────────────────────────
  { prefix: "/admin/productos", option: "SHOP_PRODUCTS", module: "SHOP" },
  // DASHBOARD ───────────────────────────────────────────────────────────
  { prefix: "/admin", option: "DASH_HOME", module: "DASHBOARD" },
];

/** Rutas accesibles sin sesión. */
export const PUBLIC_PREFIXES = [
  "/",
  "/login",
  "/auth",
  "/recuperar-clave",
  "/registro",
  "/registro-cancelado",
  "/about",
  "/apoyanos",
  "/contact",
  "/faq",
  "/privacidad",
  "/programs",
  "/productos",
  "/tombola",
  "/bingo",
  "/ruleta",
  "/api",
  "/matricula",
  "/robots.txt",
  "/sitemap.xml",
] as const;

/**
 * Rutas que requieren sesión activa pero NO tienen una opción sec_* asignada.
 * Se mantienen aquí mientras el módulo de seguridad se activa gradualmente.
 * Una vez que SECURITY_MODULE_ENABLED=true, estas rutas pasarán a SECURED_ROUTES
 * o quedarán como rutas auxiliares sin restricción de opción.
 */
export const AUTHENTICATED_ONLY = [
  // Perfil y páginas auxiliares (ningún dato sensible propio)
  "/admin/profile",
  "/perfil",
  "/acceso-denegado",
  // Panel hub de configuración (solo muestra tarjetas de acceso rápido)
  "/admin/settings",
  // Seguridad RLS/vistas: solo SuperAdmin, guard en page.tsx (level 10)
  "/admin/settings/security",
  // Manuales (solo lectura de documentación interna)
  "/admin/manual",
  "/admin/settings/manual-tecnico",
  "/admin/settings/manual-usuario",
  "/admin/cms/manual",
  "/admin/bingo/manual",
  "/admin/productos/manual",
] as const;

const startsWithSegment = (path: string, prefix: string) =>
  path === prefix || path.startsWith(prefix + "/");

export const isPublic = (path: string) => PUBLIC_PREFIXES.some((p) => startsWithSegment(path, p));

export const isAuthenticatedOnly = (path: string) =>
  (AUTHENTICATED_ONLY as readonly string[]).some((p) => startsWithSegment(path, p));

export const matchRoute = (path: string) =>
  SECURED_ROUTES.find((r) => startsWithSegment(path, r.prefix));
