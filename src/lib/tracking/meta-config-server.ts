import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import { encryptToken, decryptToken, maskToken } from "@/lib/encryption";
import {
  DEFAULT_META_EVENTS_CONFIG,
  type MetaAdminConfig,
  type MetaConsentMode,
  type MetaEventsConfigMap,
  type MetaPublicConfig,
  type MetaTrackingConfigRow,
  type MetaTrackingLogEntry,
} from "@/types/meta-tracking";

const FALLBACK_SECTION_KEY = "__meta_tracking_config__";
const FALLBACK_LOGS_KEY = "__meta_tracking_logs__";

/**
 * Construye una fila por defecto cuando aún no existe configuración en base de datos.
 */
function createDefaultRow(): MetaTrackingConfigRow {
  return {
    id: "singleton-default",
    is_enabled: false,
    pixel_id: "",
    capi_pixel_id: "",
    capi_access_token: "",
    currency: "USD",
    test_event_code: null,
    enable_advanced_matching: true,
    enable_auto_fbc_fbp: true,
    allowed_domains: [],
    events_config: { ...DEFAULT_META_EVENTS_CONFIG },
    consent_mode: "disabled",
    debug_mode: false,
    updated_by: null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Normaliza el mapa de eventos garantizando que todos los eventos estándar existan.
 */
export function normalizeEventsConfig(
  raw: unknown
): MetaEventsConfigMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_META_EVENTS_CONFIG };
  }

  const merged: MetaEventsConfigMap = { ...DEFAULT_META_EVENTS_CONFIG };
  const entries = Object.entries(raw as Record<string, unknown>);

  entries.forEach(([key, val], idx) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const item = val as Record<string, unknown>;
      merged[key] = {
        enabled: Boolean(item.enabled),
        sendCAPI: Boolean(item.sendCAPI),
        isCritical: Boolean(item.isCritical),
        requiredParams: Array.isArray(item.requiredParams)
          ? item.requiredParams.map(String)
          : DEFAULT_META_EVENTS_CONFIG[key]?.requiredParams || [],
        order:
          typeof item.order === "number"
            ? item.order
            : DEFAULT_META_EVENTS_CONFIG[key]?.order ?? idx + 1,
      };
    }
  });

  return merged;
}

/**
 * Lee la fila completa desde `cms_meta_tracking_config` (con fallback transparente
 * a `site_content` si la migración SQL aún no ha sido aplicada en el entorno).
 */
export async function getRawMetaTrackingConfig(): Promise<MetaTrackingConfigRow> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cms_meta_tracking_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const row = data as Record<string, unknown>;
      return {
        id: String(row.id || "singleton"),
        is_enabled: Boolean(row.is_enabled),
        pixel_id: row.pixel_id ? String(row.pixel_id) : "",
        capi_pixel_id: row.capi_pixel_id ? String(row.capi_pixel_id) : "",
        capi_access_token: row.capi_access_token
          ? String(row.capi_access_token)
          : "",
        currency: row.currency ? String(row.currency) : "USD",
        test_event_code: row.test_event_code
          ? String(row.test_event_code)
          : null,
        enable_advanced_matching:
          row.enable_advanced_matching !== undefined
            ? Boolean(row.enable_advanced_matching)
            : true,
        enable_auto_fbc_fbp:
          row.enable_auto_fbc_fbp !== undefined
            ? Boolean(row.enable_auto_fbc_fbp)
            : true,
        allowed_domains: Array.isArray(row.allowed_domains)
          ? row.allowed_domains.map(String)
          : [],
        events_config: normalizeEventsConfig(row.events_config),
        consent_mode: (["disabled", "basic", "advanced"].includes(
          String(row.consent_mode)
        )
          ? String(row.consent_mode)
          : "disabled") as MetaConsentMode,
        debug_mode: Boolean(row.debug_mode),
        updated_by: row.updated_by ? String(row.updated_by) : null,
        updated_at: row.updated_at
          ? String(row.updated_at)
          : new Date().toISOString(),
      };
    }

    // Fallback en caso de que la tabla cms_meta_tracking_config aún no exista
    const { data: fallbackData } = await supabase
      .from("site_content")
      .select("metadata, updated_at")
      .eq("section_key", FALLBACK_SECTION_KEY)
      .limit(1)
      .maybeSingle();

    if (
      fallbackData?.metadata &&
      typeof fallbackData.metadata === "object" &&
      !Array.isArray(fallbackData.metadata)
    ) {
      const meta = fallbackData.metadata as Record<string, unknown>;
      return {
        id: "fallback-singleton",
        is_enabled: Boolean(meta.is_enabled),
        pixel_id: meta.pixel_id ? String(meta.pixel_id) : "",
        capi_pixel_id: meta.capi_pixel_id ? String(meta.capi_pixel_id) : "",
        capi_access_token: meta.capi_access_token
          ? String(meta.capi_access_token)
          : "",
        currency: meta.currency ? String(meta.currency) : "USD",
        test_event_code: meta.test_event_code
          ? String(meta.test_event_code)
          : null,
        enable_advanced_matching:
          meta.enable_advanced_matching !== undefined
            ? Boolean(meta.enable_advanced_matching)
            : true,
        enable_auto_fbc_fbp:
          meta.enable_auto_fbc_fbp !== undefined
            ? Boolean(meta.enable_auto_fbc_fbp)
            : true,
        allowed_domains: Array.isArray(meta.allowed_domains)
          ? meta.allowed_domains.map(String)
          : [],
        events_config: normalizeEventsConfig(meta.events_config),
        consent_mode: (["disabled", "basic", "advanced"].includes(
          String(meta.consent_mode)
        )
          ? String(meta.consent_mode)
          : "disabled") as MetaConsentMode,
        debug_mode: Boolean(meta.debug_mode),
        updated_by: meta.updated_by ? String(meta.updated_by) : null,
        updated_at: fallbackData.updated_at || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error("[Meta Config Server] Error leyendo configuración:", err);
  }

  return createDefaultRow();
}

/**
 * Transforma la fila de base de datos en la configuración pública segura (sin token).
 */
export function toPublicConfig(row: MetaTrackingConfigRow): MetaPublicConfig {
  return {
    isEnabled: Boolean(row.is_enabled),
    pixelId: (row.pixel_id || "").trim(),
    currency: (row.currency || "USD").trim(),
    enableAdvancedMatching: Boolean(row.enable_advanced_matching),
    enableAutoFbcFbp: Boolean(row.enable_auto_fbc_fbp),
    allowedDomains: Array.isArray(row.allowed_domains)
      ? row.allowed_domains
      : [],
    eventsConfig: normalizeEventsConfig(row.events_config),
    consentMode: row.consent_mode || "disabled",
    debugMode: Boolean(row.debug_mode),
  };
}

/**
 * Transforma la fila de base de datos en la configuración para el panel CMS Admin
 * (con token enmascarado y nunca en texto plano).
 */
export function toAdminConfig(row: MetaTrackingConfigRow): MetaAdminConfig {
  const decrypted = decryptToken(row.capi_access_token);
  return {
    ...toPublicConfig(row),
    id: row.id,
    capiPixelId: (row.capi_pixel_id || row.pixel_id || "").trim(),
    capiAccessTokenMasked: maskToken(row.capi_access_token),
    hasAccessToken: decrypted.length > 0,
    testEventCode: row.test_event_code || null,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

/**
 * Versión cacheada con `unstable_cache` y tag `'meta-config'` (ISR 60s).
 */
export const getCachedPublicMetaConfig = unstable_cache(
  async (): Promise<MetaPublicConfig> => {
    const row = await getRawMetaTrackingConfig();
    return toPublicConfig(row);
  },
  ["cms-meta-public-config"],
  {
    revalidate: 60,
    tags: ["meta-config"],
  }
);

export interface SaveMetaTrackingInput {
  isEnabled: boolean;
  pixelId: string;
  capiPixelId: string;
  capiAccessToken?: string;
  clearAccessToken?: boolean;
  currency: string;
  testEventCode: string | null;
  enableAdvancedMatching: boolean;
  enableAutoFbcFbp: boolean;
  allowedDomains: string[];
  eventsConfig: MetaEventsConfigMap;
  consentMode: MetaConsentMode;
  debugMode: boolean;
  updatedBy: string | null;
}

/**
 * Guarda la configuración de Meta Pixel + CAPI encriptando el token con AES-256-GCM.
 */
export async function saveMetaTrackingConfig(
  input: SaveMetaTrackingInput
): Promise<MetaAdminConfig> {
  const supabase = createAdminClient();
  const current = await getRawMetaTrackingConfig();

  let encryptedToken = current.capi_access_token || "";
  if (input.clearAccessToken) {
    encryptedToken = "";
  } else if (
    input.capiAccessToken &&
    input.capiAccessToken.trim() !== "" &&
    !input.capiAccessToken.includes("••••")
  ) {
    encryptedToken = encryptToken(input.capiAccessToken.trim());
  }

  const now = new Date().toISOString();
  const rowPayload = {
    singleton_key: true,
    is_enabled: Boolean(input.isEnabled),
    pixel_id: input.pixelId.trim(),
    capi_pixel_id: (input.capiPixelId || input.pixelId).trim(),
    capi_access_token: encryptedToken,
    currency: (input.currency || "USD").trim().toUpperCase(),
    test_event_code: input.testEventCode?.trim() || null,
    enable_advanced_matching: Boolean(input.enableAdvancedMatching),
    enable_auto_fbc_fbp: Boolean(input.enableAutoFbcFbp),
    allowed_domains: input.allowedDomains
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean),
    events_config: normalizeEventsConfig(input.eventsConfig),
    consent_mode: input.consentMode,
    debug_mode: Boolean(input.debugMode),
    updated_by: input.updatedBy,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("cms_meta_tracking_config")
    .upsert(rowPayload, { onConflict: "singleton_key" })
    .select("*")
    .single();

  if (!error && data) {
    const saved = await getRawMetaTrackingConfig();
    return toAdminConfig(saved);
  }

  // Fallback transparente en site_content si la tabla aún no fue migrada
  const { data: existingFallback } = await supabase
    .from("site_content")
    .select("id")
    .eq("section_key", FALLBACK_SECTION_KEY)
    .maybeSingle();

  if (existingFallback?.id) {
    await supabase
      .from("site_content")
      .update({
        metadata: rowPayload,
        updated_at: now,
      })
      .eq("id", existingFallback.id);
  } else {
    await supabase.from("site_content").insert({
      page: "home",
      section_key: FALLBACK_SECTION_KEY,
      title: "Configuración interna Meta Pixel & CAPI",
      description: "Singleton de configuración Meta Pixel",
      is_active: false,
      content_order: 9999,
      metadata: rowPayload,
    });
  }

  const updatedRow = await getRawMetaTrackingConfig();
  return toAdminConfig(updatedRow);
}

/**
 * Registra un evento enviado a CAPI en la bitácora `cms_meta_logs`.
 */
export async function recordMetaCapiLog(entry: {
  eventName: string;
  eventId: string;
  status: "ok" | "error" | "skipped";
  payload?: Record<string, unknown> | null;
  response?: Record<string, unknown> | null;
  errorMessage?: string | null;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("cms_meta_logs").insert({
      event_name: entry.eventName,
      event_id: entry.eventId,
      status: entry.status,
      payload: entry.payload || null,
      response: entry.response || null,
      error_message: entry.errorMessage || null,
    });

    if (!error) return;

    // Fallback en site_content si cms_meta_logs aún no existe
    const { data: existingLogs } = await supabase
      .from("site_content")
      .select("id, metadata")
      .eq("section_key", FALLBACK_LOGS_KEY)
      .maybeSingle();

    const currentList: MetaTrackingLogEntry[] = Array.isArray(
      (existingLogs?.metadata as Record<string, unknown> | null)?.logs
    )
      ? (((existingLogs?.metadata as Record<string, unknown>).logs as unknown[]) || []).map(
          (item) => item as MetaTrackingLogEntry
        )
      : [];

    const newLog: MetaTrackingLogEntry = {
      id: crypto.randomUUID(),
      event_name: entry.eventName,
      event_id: entry.eventId,
      status: entry.status,
      payload: entry.payload || null,
      response: entry.response || null,
      error_message: entry.errorMessage || null,
      created_at: new Date().toISOString(),
    };

    const updatedLogs = [newLog, ...currentList].slice(0, 50);

    if (existingLogs?.id) {
      await supabase
        .from("site_content")
        .update({
          metadata: { logs: updatedLogs },
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingLogs.id);
    } else {
      await supabase.from("site_content").insert({
        page: "home",
        section_key: FALLBACK_LOGS_KEY,
        title: "Logs internos Meta CAPI",
        description: "Historial de los últimos 50 eventos CAPI",
        is_active: false,
        content_order: 9998,
        metadata: { logs: updatedLogs },
      });
    }
  } catch (err) {
    console.error("[Meta Logs] Error registrando log de CAPI:", err);
  }
}

/**
 * Obtiene los últimos 50 logs de envíos CAPI para visualización en el CMS.
 */
export async function getMetaCapiLogs(
  limit = 50
): Promise<MetaTrackingLogEntry[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cms_meta_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && Array.isArray(data)) {
      return data as MetaTrackingLogEntry[];
    }

    const { data: fallbackLogs } = await supabase
      .from("site_content")
      .select("metadata")
      .eq("section_key", FALLBACK_LOGS_KEY)
      .maybeSingle();

    const list = (fallbackLogs?.metadata as Record<string, unknown> | null)
      ?.logs;
    if (Array.isArray(list)) {
      return (list as MetaTrackingLogEntry[]).slice(0, limit);
    }
  } catch (err) {
    console.error("[Meta Logs] Error consultando logs:", err);
  }
  return [];
}
