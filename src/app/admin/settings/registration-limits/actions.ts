"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { withRole } from "@/lib/auth/guards";

/**
 * Presets de límites anti-abuso del registro público /registro.
 *
 * - normal: protección estándar (uso diario del sitio).
 * - evento: ventana del registro masivo — los asistentes pueden compartir
 *   UNA IP pública (WiFi del venue o CGNAT del operador), por lo que los
 *   topes por IP deben ser holgados para no bloquear gente real.
 */
const LIMIT_PRESETS = {
  normal: {
    max_attempts_minute: 10,
    max_cards_day_ip: 40,
    max_cards_phone: 30,
  },
  evento: {
    max_attempts_minute: 500,
    max_cards_day_ip: 15000,
    max_cards_phone: 30,
  },
} as const;

type LimitMode = keyof typeof LIMIT_PRESETS;

/**
 * Lee la configuración vigente de límites (fila única id=1 de
 * registration_limits, creada por la migración 20261008000000).
 */
async function getRegistrationLimitsInternal() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("registration_limits")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true, limits: data };
}

export const getRegistrationLimits = withRole(10, getRegistrationLimitsInternal);

/**
 * Cambia el modo de límites aplicando el preset correspondiente.
 * Equivale operativamente a ejecutar loadtest/raise_limits.sql (modo
 * 'evento') o restore_limits.sql (modo 'normal') desde el SQL Editor,
 * pero sin tocar la función: el RPC lee esta tabla en cada llamada.
 */
async function setRegistrationModeInternal(
  mode: LimitMode,
  context: { user: any },
) {
  const { user } = context;
  const preset = LIMIT_PRESETS[mode];
  if (!preset) {
    return { success: false, error: "Modo inválido." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("registration_limits")
    .update({
      mode,
      ...preset,
      updated_at: new Date().toISOString(),
      updated_by: user?.id ?? null,
    })
    .eq("id", 1);

  if (error) {
    return { success: false, error: error.message };
  }

  if (user) {
    await supabase.from("user_activity_log").insert({
      user_id: user.id,
      action: "UPDATE",
      entity: "registration_limits",
      metadata: {
        mode,
        ...preset,
        timestamp: new Date().toISOString(),
      },
    });
  }

  revalidatePath("/admin/settings/registration-limits");
  return { success: true, mode, ...preset };
}

export const setRegistrationMode = withRole(10, setRegistrationModeInternal);
