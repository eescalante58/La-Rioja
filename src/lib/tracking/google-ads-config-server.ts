import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/lib/supabase/server";
import {
  DEFAULT_GOOGLE_ADS_EVENTS_CONFIG,
  type GoogleAdsAdminConfig,
  type GoogleAdsConfigRow,
  type GoogleAdsConsentMode,
  type GoogleAdsEventsConfigMap,
  type GoogleAdsLogEntry,
  type GoogleAdsPublicConfig,
} from "@/types/google-ads-tracking";

const FALLBACK_SECTION_KEY = "__google_ads_tracking_config__";
const FALLBACK_LOGS_KEY = "__google_ads_tracking_logs__";

/**
 * Construye una fila por defecto con el Tag ID y Conversion Label institucionales de La Rioja.
 */
function createDefaultRow(): GoogleAdsConfigRow {
  return {
    id: "singleton-google-default",
    is_enabled: false,
    tag_id: "AW-18533492300",
    ga4_measurement_id: "",
    currency: "USD",
    enable_enhanced_conversions: true,
    enable_auto_gclid: true,
    allow_ad_personalization: false,
    restricted_data_processing: true,
    production_only: false,
    allowed_domains: [],
    events_config: { ...DEFAULT_GOOGLE_ADS_EVENTS_CONFIG },
    consent_mode: "disabled",
    debug_mode: false,
    updated_by: null,
    updated_at: new Date().toISOString(),
  };
}

/**
 * Normaliza el mapa de eventos garantizando que todos los eventos estándar de Google Ads existan.
 */
export function normalizeGoogleAdsEventsConfig(
  raw: unknown
): GoogleAdsEventsConfigMap {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ...DEFAULT_GOOGLE_ADS_EVENTS_CONFIG };
  }

  const merged: GoogleAdsEventsConfigMap = {
    ...DEFAULT_GOOGLE_ADS_EVENTS_CONFIG,
  };
  const entries = Object.entries(raw as Record<string, unknown>);

  entries.forEach(([key, val], idx) => {
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const item = val as Record<string, unknown>;
      const fallback = DEFAULT_GOOGLE_ADS_EVENTS_CONFIG[key];
      merged[key] = {
        enabled:
          item.enabled !== undefined
            ? Boolean(item.enabled)
            : fallback?.enabled ?? false,
        conversionLabel:
          typeof item.conversionLabel === "string"
            ? item.conversionLabel.trim()
            : fallback?.conversionLabel || "",
        actionName:
          typeof item.actionName === "string" && item.actionName.trim() !== ""
            ? item.actionName.trim()
            : fallback?.actionName || key,
        defaultValue:
          typeof item.defaultValue === "number" && !isNaN(item.defaultValue)
            ? item.defaultValue
            : null,
        isCritical:
          item.isCritical !== undefined
            ? Boolean(item.isCritical)
            : fallback?.isCritical ?? false,
        logServer:
          item.logServer !== undefined
            ? Boolean(item.logServer)
            : fallback?.logServer ?? true,
        allowedPaths: Array.isArray(item.allowedPaths)
          ? item.allowedPaths.map(String)
          : fallback?.allowedPaths || ["*"],
        order:
          typeof item.order === "number"
            ? item.order
            : fallback?.order ?? idx + 1,
      };
    }
  });

  return merged;
}

/**
 * Lee la fila completa desde `cms_google_ads_config` (con fallback transparente
 * a `site_content` si la migración SQL aún no ha sido aplicada en Supabase).
 */
export async function getRawGoogleAdsConfig(): Promise<GoogleAdsConfigRow> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cms_google_ads_config")
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      const row = data as Record<string, unknown>;
      return {
        id: String(row.id || "singleton"),
        is_enabled: Boolean(row.is_enabled),
        tag_id: row.tag_id ? String(row.tag_id) : "AW-18533492300",
        ga4_measurement_id: row.ga4_measurement_id
          ? String(row.ga4_measurement_id)
          : "",
        currency: row.currency ? String(row.currency) : "USD",
        enable_enhanced_conversions:
          row.enable_enhanced_conversions !== undefined
            ? Boolean(row.enable_enhanced_conversions)
            : true,
        enable_auto_gclid:
          row.enable_auto_gclid !== undefined
            ? Boolean(row.enable_auto_gclid)
            : true,
        allow_ad_personalization: Boolean(row.allow_ad_personalization),
        restricted_data_processing:
          row.restricted_data_processing !== undefined
            ? Boolean(row.restricted_data_processing)
            : true,
        production_only: Boolean(row.production_only),
        allowed_domains: Array.isArray(row.allowed_domains)
          ? row.allowed_domains.map(String)
          : [],
        events_config: normalizeGoogleAdsEventsConfig(row.events_config),
        consent_mode: (["disabled", "basic", "advanced"].includes(
          String(row.consent_mode)
        )
          ? String(row.consent_mode)
          : "disabled") as GoogleAdsConsentMode,
        debug_mode: Boolean(row.debug_mode),
        updated_by: row.updated_by ? String(row.updated_by) : null,
        updated_at: row.updated_at
          ? String(row.updated_at)
          : new Date().toISOString(),
      };
    }

    // Fallback en site_content si la tabla aún no fue creada
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
        id: "fallback-google-singleton",
        is_enabled: Boolean(meta.is_enabled),
        tag_id: meta.tag_id ? String(meta.tag_id) : "AW-18533492300",
        ga4_measurement_id: meta.ga4_measurement_id
          ? String(meta.ga4_measurement_id)
          : "",
        currency: meta.currency ? String(meta.currency) : "USD",
        enable_enhanced_conversions:
          meta.enable_enhanced_conversions !== undefined
            ? Boolean(meta.enable_enhanced_conversions)
            : true,
        enable_auto_gclid:
          meta.enable_auto_gclid !== undefined
            ? Boolean(meta.enable_auto_gclid)
            : true,
        allow_ad_personalization: Boolean(meta.allow_ad_personalization),
        restricted_data_processing:
          meta.restricted_data_processing !== undefined
            ? Boolean(meta.restricted_data_processing)
            : true,
        production_only: Boolean(meta.production_only),
        allowed_domains: Array.isArray(meta.allowed_domains)
          ? meta.allowed_domains.map(String)
          : [],
        events_config: normalizeGoogleAdsEventsConfig(meta.events_config),
        consent_mode: (["disabled", "basic", "advanced"].includes(
          String(meta.consent_mode)
        )
          ? String(meta.consent_mode)
          : "disabled") as GoogleAdsConsentMode,
        debug_mode: Boolean(meta.debug_mode),
        updated_by: meta.updated_by ? String(meta.updated_by) : null,
        updated_at: fallbackData.updated_at || new Date().toISOString(),
      };
    }
  } catch (err) {
    console.error("[Google Ads Config Server] Error leyendo configuración:", err);
  }

  return createDefaultRow();
}

/**
 * Transforma la fila de base de datos en configuración pública para el navegador.
 */
export function toPublicGoogleAdsConfig(
  row: GoogleAdsConfigRow
): GoogleAdsPublicConfig {
  return {
    isEnabled: Boolean(row.is_enabled),
    tagId: (row.tag_id || "").trim(),
    ga4MeasurementId: (row.ga4_measurement_id || "").trim(),
    currency: (row.currency || "USD").trim().toUpperCase(),
    enableEnhancedConversions: Boolean(row.enable_enhanced_conversions),
    enableAutoGclid: Boolean(row.enable_auto_gclid),
    allowAdPersonalization: Boolean(row.allow_ad_personalization),
    restrictedDataProcessing: Boolean(row.restricted_data_processing),
    productionOnly: Boolean(row.production_only),
    allowedDomains: Array.isArray(row.allowed_domains)
      ? row.allowed_domains
      : [],
    eventsConfig: normalizeGoogleAdsEventsConfig(row.events_config),
    consentMode: row.consent_mode || "disabled",
    debugMode: Boolean(row.debug_mode),
  };
}

/**
 * Transforma la fila de base de datos en configuración para el panel CMS Admin.
 */
export function toAdminGoogleAdsConfig(
  row: GoogleAdsConfigRow
): GoogleAdsAdminConfig {
  return {
    ...toPublicGoogleAdsConfig(row),
    id: row.id,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}

/**
 * Versión cacheada con `unstable_cache` y tag `'google-ads-config'` (ISR 60s).
 */
export const getCachedPublicGoogleAdsConfig = unstable_cache(
  async (): Promise<GoogleAdsPublicConfig> => {
    const row = await getRawGoogleAdsConfig();
    return toPublicGoogleAdsConfig(row);
  },
  ["cms-google-ads-public-config"],
  {
    revalidate: 60,
    tags: ["google-ads-config"],
  }
);

export interface SaveGoogleAdsInput {
  isEnabled: boolean;
  tagId: string;
  ga4MeasurementId: string;
  currency: string;
  enableEnhancedConversions: boolean;
  enableAutoGclid: boolean;
  allowAdPersonalization: boolean;
  restrictedDataProcessing: boolean;
  productionOnly: boolean;
  allowedDomains: string[];
  eventsConfig: GoogleAdsEventsConfigMap;
  consentMode: GoogleAdsConsentMode;
  debugMode: boolean;
  updatedBy: string | null;
}

/**
 * Guarda la configuración de Google Ads en base de datos.
 */
export async function saveGoogleAdsConfig(
  input: SaveGoogleAdsInput
): Promise<GoogleAdsAdminConfig> {
  const supabase = createAdminClient();
  const now = new Date().toISOString();

  const rowPayload = {
    singleton_key: true,
    is_enabled: Boolean(input.isEnabled),
    tag_id: input.tagId.trim(),
    ga4_measurement_id: input.ga4MeasurementId.trim(),
    currency: (input.currency || "USD").trim().toUpperCase(),
    enable_enhanced_conversions: Boolean(input.enableEnhancedConversions),
    enable_auto_gclid: Boolean(input.enableAutoGclid),
    allow_ad_personalization: Boolean(input.allowAdPersonalization),
    restricted_data_processing: Boolean(input.restrictedDataProcessing),
    production_only: Boolean(input.productionOnly),
    allowed_domains: input.allowedDomains
      .map((d) => d.trim().toLowerCase())
      .filter(Boolean),
    events_config: normalizeGoogleAdsEventsConfig(input.eventsConfig),
    consent_mode: input.consentMode,
    debug_mode: Boolean(input.debugMode),
    updated_by: input.updatedBy,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("cms_google_ads_config")
    .upsert(rowPayload, { onConflict: "singleton_key" })
    .select("*")
    .single();

  if (!error && data) {
    const saved = await getRawGoogleAdsConfig();
    return toAdminGoogleAdsConfig(saved);
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
      title: "Configuración interna Google Ads",
      description: "Singleton de configuración Google Ads",
      is_active: false,
      content_order: 9997,
      metadata: rowPayload,
    });
  }

  const updatedRow = await getRawGoogleAdsConfig();
  return toAdminGoogleAdsConfig(updatedRow);
}

/**
 * Registra un evento de conversión de Google Ads en `cms_google_ads_logs`.
 */
export async function recordGoogleAdsLog(entry: {
  eventName: string;
  sendTo: string;
  transactionId: string;
  gclid?: string | null;
  status: "ok" | "error" | "skipped";
  payload?: Record<string, unknown> | null;
  errorMessage?: string | null;
}): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("cms_google_ads_logs").insert({
      event_name: entry.eventName,
      send_to: entry.sendTo,
      transaction_id: entry.transactionId,
      gclid: entry.gclid || null,
      status: entry.status,
      payload: entry.payload || null,
      error_message: entry.errorMessage || null,
    });

    if (!error) return;

    // Fallback en site_content si cms_google_ads_logs aún no existe
    const { data: existingLogs } = await supabase
      .from("site_content")
      .select("id, metadata")
      .eq("section_key", FALLBACK_LOGS_KEY)
      .maybeSingle();

    const currentList: GoogleAdsLogEntry[] = Array.isArray(
      (existingLogs?.metadata as Record<string, unknown> | null)?.logs
    )
      ? (
          ((existingLogs?.metadata as Record<string, unknown>)
            .logs as unknown[]) || []
        ).map((item) => item as GoogleAdsLogEntry)
      : [];

    const newLog: GoogleAdsLogEntry = {
      id: crypto.randomUUID(),
      event_name: entry.eventName,
      send_to: entry.sendTo,
      transaction_id: entry.transactionId,
      gclid: entry.gclid || null,
      status: entry.status,
      payload: entry.payload || null,
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
        title: "Logs internos Google Ads",
        description: "Historial de los últimos 50 eventos de Google Ads",
        is_active: false,
        content_order: 9996,
        metadata: { logs: updatedLogs },
      });
    }
  } catch (err) {
    console.error("[Google Ads Logs] Error registrando log:", err);
  }
}

/**
 * Obtiene los últimos 50 logs de conversiones de Google Ads para el CMS.
 */
export async function getGoogleAdsLogs(
  limit = 50
): Promise<GoogleAdsLogEntry[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("cms_google_ads_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (!error && Array.isArray(data)) {
      return data as GoogleAdsLogEntry[];
    }

    const { data: fallbackLogs } = await supabase
      .from("site_content")
      .select("metadata")
      .eq("section_key", FALLBACK_LOGS_KEY)
      .maybeSingle();

    const list = (fallbackLogs?.metadata as Record<string, unknown> | null)
      ?.logs;
    if (Array.isArray(list)) {
      return (list as GoogleAdsLogEntry[]).slice(0, limit);
    }
  } catch (err) {
    console.error("[Google Ads Logs] Error consultando logs:", err);
  }
  return [];
}
