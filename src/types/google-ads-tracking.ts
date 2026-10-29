/**
 * Tipos estrictos para Google Ads (gtag.js + Conversiones Mejoradas + GCLID + Consent Mode v2)
 * 100% administrable desde el panel CMS e independiente de Meta Pixel + CAPI.
 */

export type GoogleAdsConsentMode = "disabled" | "basic" | "advanced";

export type StandardGoogleAdsEvent =
  | "Lead"
  | "Purchase"
  | "CompleteRegistration"
  | "InitiateCheckout"
  | "Contact"
  | "ViewContent"
  | "PageView"
  | string;

export interface GoogleAdsEventSetting {
  enabled: boolean;
  conversionLabel: string;
  actionName: string;
  defaultValue: number | null;
  isCritical: boolean;
  logServer: boolean;
  allowedPaths: string[];
  order?: number;
}

export type GoogleAdsEventsConfigMap = Record<string, GoogleAdsEventSetting>;

export const DEFAULT_GOOGLE_ADS_EVENTS_CONFIG: GoogleAdsEventsConfigMap = {
  Lead: {
    enabled: true,
    conversionLabel: "-252CIjfxqgdEMzMuoVF",
    actionName: "Website lead (Matrícula / Contacto)",
    defaultValue: null,
    isCritical: true,
    logServer: true,
    allowedPaths: ["*"],
    order: 1,
  },
  Purchase: {
    enabled: true,
    conversionLabel: "",
    actionName: "Compra / Donación completada",
    defaultValue: null,
    isCritical: true,
    logServer: true,
    allowedPaths: ["*"],
    order: 2,
  },
  CompleteRegistration: {
    enabled: true,
    conversionLabel: "",
    actionName: "Registro completado (Bingo / Evento)",
    defaultValue: null,
    isCritical: false,
    logServer: true,
    allowedPaths: ["*"],
    order: 3,
  },
  InitiateCheckout: {
    enabled: false,
    conversionLabel: "",
    actionName: "Inicio de pago / donación",
    defaultValue: null,
    isCritical: false,
    logServer: false,
    allowedPaths: ["*"],
    order: 4,
  },
  Contact: {
    enabled: true,
    conversionLabel: "",
    actionName: "Clic en WhatsApp / Contacto directo",
    defaultValue: null,
    isCritical: false,
    logServer: true,
    allowedPaths: ["*"],
    order: 5,
  },
  ViewContent: {
    enabled: false,
    conversionLabel: "",
    actionName: "Vista de programa / taller / producto",
    defaultValue: null,
    isCritical: false,
    logServer: false,
    allowedPaths: ["*"],
    order: 6,
  },
  PageView: {
    enabled: true,
    conversionLabel: "",
    actionName: "Carga de etiqueta base en páginas",
    defaultValue: null,
    isCritical: false,
    logServer: false,
    allowedPaths: ["*"],
    order: 7,
  },
};

/**
 * Representación de la fila en PostgreSQL `cms_google_ads_config`.
 */
export interface GoogleAdsConfigRow {
  id: string;
  is_enabled: boolean;
  tag_id: string;
  ga4_measurement_id: string | null;
  currency: string;
  enable_enhanced_conversions: boolean;
  enable_auto_gclid: boolean;
  allow_ad_personalization: boolean;
  restricted_data_processing: boolean;
  production_only: boolean;
  allowed_domains: string[];
  events_config: GoogleAdsEventsConfigMap;
  consent_mode: GoogleAdsConsentMode;
  debug_mode: boolean;
  updated_by: string | null;
  updated_at: string;
}

/**
 * Configuración pública devuelta en `GET /api/cms/google-ads-config`.
 */
export interface GoogleAdsPublicConfig {
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
}

/**
 * Configuración extendida para el panel administrativo del CMS.
 */
export interface GoogleAdsAdminConfig extends GoogleAdsPublicConfig {
  id?: string;
  updatedBy: string | null;
  updatedAt: string | null;
}

/**
 * Datos de usuario para Enhanced Conversions de Google Ads.
 */
export interface GoogleAdsUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
}

/**
 * Parámetros personalizados de un evento de conversión en Google Ads.
 */
export interface GoogleAdsCustomData {
  value?: number;
  currency?: string;
  transaction_id?: string;
  content_name?: string;
  origin?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

/**
 * Payload enviado al endpoint de bitácora y auditoría `POST /api/google-ads/track`.
 */
export interface GoogleAdsTrackRequestPayload {
  eventName: string;
  sendTo: string;
  transactionId: string;
  eventData?: GoogleAdsCustomData;
  eventSourceUrl?: string;
  userData?: GoogleAdsUserData;
  gclid?: string;
}

/**
 * Registro de bitácora en `cms_google_ads_logs`.
 */
export interface GoogleAdsLogEntry {
  id: string;
  event_name: string;
  send_to: string;
  transaction_id: string;
  gclid: string | null;
  status: "ok" | "error" | "skipped";
  payload: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
}
