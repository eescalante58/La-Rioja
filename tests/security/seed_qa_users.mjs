/**
 * QA Módulo de Seguridad — Fase 1: Seed completo
 * Crea los 12 usuarios QA en Supabase Auth y todos los datos de roles/permisos/asignaciones.
 * Ejecutar: node --env-file=.env.local tests/security/seed_qa_users.mjs
 * Eliminar datos: node --env-file=.env.local tests/security/seed_qa_users.mjs --cleanup
 */
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "fs";

const CLEANUP = process.argv.includes("--cleanup");

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// ── Utilidades ────────────────────────────────────────────────────────────────

function log(msg) {
  console.log(msg);
}
function err(msg) {
  console.error("ERROR:", msg);
}

async function sbCheck(label, { data, error }) {
  if (error) {
    err(`${label}: ${error.message}`);
    process.exit(1);
  }
  return data;
}

// ── Limpieza ─────────────────────────────────────────────────────────────────

async function cleanup() {
  log("\n=== LIMPIEZA DE DATOS QA ===");

  // 1. Obtener IDs de usuarios QA en public.users
  const { data: qaUsers } = await supabase
    .from("users")
    .select("id, email")
    .like("email", "%@qa.larioja.test%");

  const qaUserIds = (qaUsers ?? []).map((u) => u.id);
  log(`Usuarios QA encontrados: ${qaUserIds.length}`);

  if (qaUserIds.length) {
    // 2. Borrar asignaciones de roles
    await supabase.from("sec_user_roles").delete().in("user_id", qaUserIds);
    log("  sec_user_roles: borrado");

    // 3. Borrar membresías de empresa
    await supabase.from("user_companies").delete().in("user_id", qaUserIds);
    log("  user_companies: borrado");

    // 4. Borrar versiones de autorización
    await supabase.from("sec_authz_version").delete().in("user_id", qaUserIds);
    log("  sec_authz_version: borrado");
  }

  // 5. Obtener IDs de roles QA
  const { data: qaRoles } = await supabase
    .from("sec_roles")
    .select("id, code")
    .like("code", "QA_%");

  const qaRoleIds = (qaRoles ?? []).map((r) => r.id);
  log(`Roles QA encontrados: ${qaRoleIds.length}`);

  if (qaRoleIds.length) {
    // 6. Borrar permisos de roles QA
    await supabase.from("sec_permissions").delete().in("role_id", qaRoleIds);
    log("  sec_permissions: borrado");

    // 7. Borrar roles QA
    await supabase.from("sec_roles").delete().like("code", "QA_%");
    log("  sec_roles: borrado");
  }

  // 8. Borrar perfil público
  if (qaUserIds.length) {
    await supabase.from("users").delete().like("email", "%@qa.larioja.test%");
    log("  public.users: borrado");
  }

  // 9. Borrar en auth.users via Admin API
  for (const uid of qaUserIds) {
    const { error } = await supabase.auth.admin.deleteUser(uid);
    if (error) err(`deleteUser(${uid}): ${error.message}`);
  }
  log(`  auth.users: ${qaUserIds.length} usuarios borrados`);

  // 10. Verificación final
  const { data: remaining } = await supabase
    .from("users")
    .select("id", { count: "exact", head: true })
    .like("email", "%@qa.larioja.test%");
  const { count: rolesLeft } = await supabase
    .from("sec_roles")
    .select("id", { count: "exact", head: true })
    .like("code", "QA_%");

  log(
    `\nVerificación: usuarios QA residuales=${remaining ?? 0}, roles QA residuales=${rolesLeft ?? 0}`,
  );
  if ((remaining ?? 0) === 0 && (rolesLeft ?? 0) === 0) {
    log("✓ Limpieza completada exitosamente");
  } else {
    err("⚠ Quedan datos QA residuales — revisar manualmente");
  }
  process.exit(0);
}

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seed() {
  log("\n=== FASE 1: SEED QA ===");
  log("Proyecto: wfkqsifhxnarmxrvbgiu (producción)\n");

  // ── 0. Verificar que no existan datos QA previos ──────────────────────────
  const { data: existing } = await supabase
    .from("users")
    .select("email")
    .like("email", "%@qa.larioja.test%");
  if (existing?.length) {
    err(`Ya existen ${existing.length} usuarios QA. Ejecuta con --cleanup primero.`);
    process.exit(1);
  }
  const { data: existingRoles } = await supabase
    .from("sec_roles")
    .select("code")
    .like("code", "QA_%");
  if (existingRoles?.length) {
    err(
      `Ya existen roles QA: ${existingRoles.map((r) => r.code).join(", ")}. Ejecuta con --cleanup primero.`,
    );
    process.exit(1);
  }

  // ── 1. Obtener IDs de opciones ────────────────────────────────────────────
  const { data: opts } = await supabase
    .from("sec_options")
    .select("id, code")
    .in("code", ["CFG_USERS_ROLES", "BINGO_EVENTS", "DASH_HOME"]);

  const optMap = Object.fromEntries((opts ?? []).map((o) => [o.code, o.id]));
  log(`Opciones encontradas: ${JSON.stringify(Object.keys(optMap))}`);

  if (!optMap.CFG_USERS_ROLES) {
    err("No se encontró opción CFG_USERS_ROLES");
    process.exit(1);
  }
  if (!optMap.BINGO_EVENTS) {
    err("No se encontró opción BINGO_EVENTS");
    process.exit(1);
  }

  // ── 2. Crear roles QA ─────────────────────────────────────────────────────
  log("\n--- Creando roles QA ---");

  const roleDefs = [
    {
      code: "QA_SUPER",
      name: "QA SuperAdmin",
      is_super_admin: true,
      is_system: false,
      is_active: true,
      perms: [],
    },
    {
      code: "QA_USERS_FULL",
      name: "QA Users Full",
      is_super_admin: false,
      is_system: false,
      is_active: true,
      perms: [{ option_id: optMap.CFG_USERS_ROLES, resource_id: null, actions_mask: 255 }],
    },
    {
      code: "QA_USERS_READ",
      name: "QA Users Read",
      is_super_admin: false,
      is_system: false,
      is_active: true,
      perms: [{ option_id: optMap.CFG_USERS_ROLES, resource_id: null, actions_mask: 1 }],
    },
    {
      code: "QA_BINGO_OPS",
      name: "QA Bingo Ops",
      is_super_admin: false,
      is_system: false,
      is_active: true,
      perms: [{ option_id: optMap.BINGO_EVENTS, resource_id: null, actions_mask: 63 }],
    },
    {
      code: "QA_MULTI_A",
      name: "QA Multi A (3)",
      is_super_admin: false,
      is_system: false,
      is_active: true,
      perms: [{ option_id: optMap.CFG_USERS_ROLES, resource_id: null, actions_mask: 3 }],
    },
    {
      code: "QA_MULTI_B",
      name: "QA Multi B (5)",
      is_super_admin: false,
      is_system: false,
      is_active: true,
      perms: [{ option_id: optMap.CFG_USERS_ROLES, resource_id: null, actions_mask: 5 }],
    },
    {
      code: "QA_INACTIVE_ROLE",
      name: "QA Inactive Role",
      is_super_admin: false,
      is_system: false,
      is_active: false,
      perms: [],
    },
  ];

  const roleMap = {};
  for (const def of roleDefs) {
    const { perms, ...roleData } = def;
    const { data: role, error: roleErr } = await supabase
      .from("sec_roles")
      .insert({ ...roleData, description: `Rol QA para pruebas — eliminar post-QA` })
      .select("id, code")
      .single();
    if (roleErr) {
      err(`crear rol ${def.code}: ${roleErr.message}`);
      process.exit(1);
    }
    roleMap[def.code] = role.id;
    log(`  ✓ ${def.code} → ${role.id}`);

    if (perms.length) {
      const { error: permErr } = await supabase
        .from("sec_permissions")
        .insert(perms.map((p) => ({ role_id: role.id, ...p })));
      if (permErr) {
        err(`permisos de ${def.code}: ${permErr.message}`);
        process.exit(1);
      }
      log(`    └ permisos: ${perms.map((p) => `mask=${p.actions_mask}`).join(", ")}`);
    }
  }

  // ── 3. Crear usuarios en Supabase Auth ────────────────────────────────────
  log("\n--- Creando usuarios en Supabase Auth ---");

  const TEMP_PASSWORD = "QA_Rioja2026!";
  const userDefs = [
    { email: "qa_sa@qa.larioja.test", full_name: "QA SuperAdmin" },
    { email: "qa_admin_users@qa.larioja.test", full_name: "QA Admin Users" },
    { email: "qa_users_read@qa.larioja.test", full_name: "QA Users Read" },
    { email: "qa_users_write@qa.larioja.test", full_name: "QA Users Write" },
    { email: "qa_bingo@qa.larioja.test", full_name: "QA Bingo Ops" },
    { email: "qa_multi@qa.larioja.test", full_name: "QA Multi Roles" },
    { email: "qa_norole@qa.larioja.test", full_name: "QA Sin Roles" },
    { email: "qa_expired@qa.larioja.test", full_name: "QA Rol Vencido" },
    { email: "qa_future@qa.larioja.test", full_name: "QA Rol Futuro" },
    { email: "qa_inactive_assign@qa.larioja.test", full_name: "QA Asignación Inactiva" },
    { email: "qa_inactive_role@qa.larioja.test", full_name: "QA Rol Inactivo" },
    { email: "qa_nocompany@qa.larioja.test", full_name: "QA Sin Empresa" },
  ];

  const userIds = {};
  for (const u of userDefs) {
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: u.email,
      password: TEMP_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: u.full_name },
    });
    if (authErr) {
      err(`createUser(${u.email}): ${authErr.message}`);
      process.exit(1);
    }
    userIds[u.email] = authUser.user.id;
    log(`  ✓ ${u.email} → ${authUser.user.id}`);

    // Esperar brevemente para que el trigger on_auth_user_created procese
    await new Promise((r) => setTimeout(r, 300));
  }

  // ── 4. Verificar que el trigger creó los perfiles en public.users ─────────
  log("\n--- Verificando perfiles en public.users ---");
  await new Promise((r) => setTimeout(r, 1000)); // dar tiempo al trigger

  const { data: profiles } = await supabase
    .from("users")
    .select("id, email")
    .like("email", "%@qa.larioja.test%");

  const profileEmails = new Set((profiles ?? []).map((p) => p.email));
  const missing = userDefs.filter((u) => !profileEmails.has(u.email));

  if (missing.length) {
    log(`  ⚠ ${missing.length} perfiles no creados por trigger — insertando manualmente:`);
    for (const u of missing) {
      const uid = userIds[u.email];
      const { error: insErr } = await supabase
        .from("users")
        .insert({ id: uid, email: u.email, full_name: u.full_name, status: "active" });
      if (insErr) {
        err(`insert public.users(${u.email}): ${insErr.message}`);
        process.exit(1);
      }
      log(`    ✓ ${u.email} insertado manualmente`);
    }
  } else {
    log(`  ✓ Todos los ${profiles.length} perfiles creados por trigger`);
  }

  // ── 5. Asignar roles a usuarios ───────────────────────────────────────────
  log("\n--- Asignando roles ---");

  const now = new Date().toISOString();
  const past30d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const past1d = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
  const future1d = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();

  const assignments = [
    // qa_sa: QA_SUPER
    {
      user_id: userIds["qa_sa@qa.larioja.test"],
      role_id: roleMap.QA_SUPER,
      valid_from: now,
      valid_to: null,
      is_active: true,
    },
    // qa_admin_users: QA_USERS_FULL (mask=255 en CFG_USERS_ROLES)
    {
      user_id: userIds["qa_admin_users@qa.larioja.test"],
      role_id: roleMap.QA_USERS_FULL,
      valid_from: now,
      valid_to: null,
      is_active: true,
    },
    // qa_users_read: QA_USERS_READ (mask=1)
    {
      user_id: userIds["qa_users_read@qa.larioja.test"],
      role_id: roleMap.QA_USERS_READ,
      valid_from: now,
      valid_to: null,
      is_active: true,
    },
    // qa_users_write: QA_MULTI_A (mask=3, R+W)
    {
      user_id: userIds["qa_users_write@qa.larioja.test"],
      role_id: roleMap.QA_MULTI_A,
      valid_from: now,
      valid_to: null,
      is_active: true,
    },
    // qa_bingo: QA_BINGO_OPS (mask=63 en BINGO_EVENTS, 0 en CFG)
    {
      user_id: userIds["qa_bingo@qa.larioja.test"],
      role_id: roleMap.QA_BINGO_OPS,
      valid_from: now,
      valid_to: null,
      is_active: true,
    },
    // qa_multi: QA_MULTI_A (3) + QA_MULTI_B (5) → OR esperado = 7
    {
      user_id: userIds["qa_multi@qa.larioja.test"],
      role_id: roleMap.QA_MULTI_A,
      valid_from: now,
      valid_to: null,
      is_active: true,
    },
    {
      user_id: userIds["qa_multi@qa.larioja.test"],
      role_id: roleMap.QA_MULTI_B,
      valid_from: now,
      valid_to: null,
      is_active: true,
    },
    // qa_norole: sin asignación (intentionally empty)
    // qa_expired: vigencia vencida ayer
    {
      user_id: userIds["qa_expired@qa.larioja.test"],
      role_id: roleMap.QA_USERS_READ,
      valid_from: past30d,
      valid_to: past1d,
      is_active: true,
    },
    // qa_future: válido desde mañana
    {
      user_id: userIds["qa_future@qa.larioja.test"],
      role_id: roleMap.QA_USERS_READ,
      valid_from: future1d,
      valid_to: null,
      is_active: true,
    },
    // qa_inactive_assign: is_active=false
    {
      user_id: userIds["qa_inactive_assign@qa.larioja.test"],
      role_id: roleMap.QA_USERS_READ,
      valid_from: now,
      valid_to: null,
      is_active: false,
    },
    // qa_inactive_role: rol con is_active=false
    {
      user_id: userIds["qa_inactive_role@qa.larioja.test"],
      role_id: roleMap.QA_INACTIVE_ROLE,
      valid_from: now,
      valid_to: null,
      is_active: true,
    },
    // qa_nocompany: tiene rol activo pero sin empresa
    {
      user_id: userIds["qa_nocompany@qa.larioja.test"],
      role_id: roleMap.QA_USERS_READ,
      valid_from: now,
      valid_to: null,
      is_active: true,
    },
  ];

  const { error: assErr } = await supabase.from("sec_user_roles").insert(assignments);
  if (assErr) {
    err(`insertar asignaciones: ${assErr.message}`);
    process.exit(1);
  }
  log(`  ✓ ${assignments.length} asignaciones creadas`);

  // ── 6. Membresías en "La Rioja Prueba" (company_id=4) ────────────────────
  log("\n--- Asignando membresías a empresa 'La Rioja Prueba' (ID=4) ---");

  const memberships = [
    "qa_sa",
    "qa_admin_users",
    "qa_users_read",
    "qa_users_write",
    "qa_bingo",
    "qa_multi",
    "qa_norole",
    "qa_expired",
    "qa_future",
    "qa_inactive_assign",
    "qa_inactive_role",
    // qa_nocompany: intencionalmente sin membresía
  ].map((prefix) => ({
    user_id: userIds[`${prefix}@qa.larioja.test`],
    company_id: 4,
    role: "Miembro",
  }));

  const { error: memErr } = await supabase.from("user_companies").insert(memberships);
  if (memErr) {
    err(`insertar membresías: ${memErr.message}`);
    process.exit(1);
  }
  log(`  ✓ ${memberships.length} membresías creadas (qa_nocompany excluido intencionalmente)`);

  // ── 7. Guardar UUIDs para referencia ──────────────────────────────────────
  const outputPath = "tests/security/qa_user_ids.json";
  writeFileSync(outputPath, JSON.stringify(userIds, null, 2), "utf8");
  log(`\n  UUIDs guardados en ${outputPath}`);

  // ── 8. Resumen final ──────────────────────────────────────────────────────
  log("\n=== SEED COMPLETADO ===");
  log(`Usuarios creados:   12`);
  log(`Roles QA creados:   ${Object.keys(roleMap).length}`);
  log(`Asignaciones:       ${assignments.length}`);
  log(`Membresías empresa: ${memberships.length}`);
  log(`Contraseña temporal: ${TEMP_PASSWORD}`);
  log(`\nPróximo paso: ejecutar los casos de prueba UI con estos usuarios.`);
  log(`Para limpiar: node --env-file=.env.local tests/security/seed_qa_users.mjs --cleanup`);
}

// ── Punto de entrada ──────────────────────────────────────────────────────────
if (CLEANUP) {
  await cleanup();
} else {
  await seed();
}
