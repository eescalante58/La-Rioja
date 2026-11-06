// lib/security/routes.generated.ts
// GENERADO por `npm run sec:routes` (scripts/gen-security-routes.mjs) a partir de sec_options.
// No editar a mano: agregar la opción en la base de datos y regenerar.

export interface SecuredRoute {
  prefix: string;
  option: string;
  module: string;
}

/** Ordenadas de la más específica a la más general. */
export const SECURED_ROUTES: readonly SecuredRoute[] = [
  { prefix: '/admin/settings/users',     option: 'CFG_USERS_ROLES',   module: 'CONFIG' },
  { prefix: '/admin/settings/logs',      option: 'CFG_AUDIT',         module: 'CONFIG' },
  { prefix: '/admin/settings/companies', option: 'CFG_COMPANIES',     module: 'CONFIG' },
  { prefix: '/admin/settings/countries', option: 'CFG_COUNTRY_CODES', module: 'CONFIG' },
];

/** Rutas sin sesión requerida. */
export const PUBLIC_PREFIXES = [
  '/login',
  '/auth',
  '/recuperar-clave',
  '/registro',
  '/registro-cancelado',
  '/about',
  '/apoyanos',
  '/contact',
  '/faq',
  '/privacidad',
  '/programs',
  '/productos',
  '/tombola',
  '/bingo',
  '/ruleta',
  '/api',
] as const;

/**
 * Rutas con sesión activa pero sin opción de seguridad catalogada.
 * Mover cada ruta a SECURED_ROUTES cuando se agregue su sec_option correspondiente.
 */
export const AUTHENTICATED_ONLY = [
  '/',
  '/admin',
  '/admin/cms',
  '/admin/productos',
  '/admin/bingo',
  '/admin/manual',
  '/admin/profile',
  '/admin/settings',
  '/admin/settings/security',
  '/admin/settings/students',
  '/admin/settings/registration-limits',
  '/admin/settings/contact',
  '/admin/settings/test-data',
  '/admin/settings/manual-tecnico',
  '/admin/settings/manual-usuario',
  '/perfil',
  '/acceso-denegado',
] as const;

const startsWithSegment = (path: string, prefix: string) =>
  path === prefix || path.startsWith(prefix + '/');

export const isPublic = (path: string) =>
  PUBLIC_PREFIXES.some((p) => startsWithSegment(path, p));

export const isAuthenticatedOnly = (path: string) =>
  (AUTHENTICATED_ONLY as readonly string[]).some((p) => startsWithSegment(path, p));

export const matchRoute = (path: string) =>
  SECURED_ROUTES.find((r) => startsWithSegment(path, r.prefix));
