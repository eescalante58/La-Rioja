// scripts/gen-security-routes.mjs — genera src/lib/security/routes.generated.ts desde sec_options
// Uso: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run sec:routes
import { writeFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await supabase
  .from('sec_options')
  .select('code, path_route, sec_modules!inner(code, is_active)')
  .eq('is_active', true)
  .eq('sec_modules.is_active', true);
if (error) throw error;

const rows = data
  .map((o) => ({ prefix: o.path_route, option: o.code, module: o.sec_modules.code }))
  .sort((a, b) => b.prefix.length - a.prefix.length);

const template = (list) => `// lib/security/routes.generated.ts
// GENERADO por \`npm run sec:routes\` el ${new Date().toISOString()}. No editar a mano.

export interface SecuredRoute { prefix: string; option: string; module: string; }

export const SECURED_ROUTES: readonly SecuredRoute[] = ${JSON.stringify(list, null, 2)};

/** Rutas sin sesión requerida. */
export const PUBLIC_PREFIXES = [
  '/login', '/auth', '/recuperar-clave',
  '/registro', '/registro-cancelado',
  '/about', '/apoyanos', '/contact', '/faq',
  '/privacidad', '/programs', '/productos',
  '/tombola', '/bingo', '/ruleta',
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
`;

writeFileSync('src/lib/security/routes.generated.ts', template(rows));
console.log(`OK: ${rows.length} rutas protegidas`);
