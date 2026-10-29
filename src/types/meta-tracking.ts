/**
 * Tipos estrictos para Meta Pixel + Conversions API (CAPI v21.0)
 * Administrable desde el CMS sin variables de entorno ni deploys.
 */

export type MetaConsentMode = "disabled" | "basic" | "advanced";

export type StandardMetaEvent =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "AddPaymentInfo"
  | "Purchase"
  | "Lead"
  | "CompleteRegistration"
  | "Search"
  | string;

export interface MetaEventSetting {
  enabled: boolean;
  sendCAPI: boolean;
  isCritical: boolean;
  requiredParams?: string[];
  order?: number;
}

export type MetaEventsConfigMap = Record<string, MetaEventSetting>;

export const DEFAULT_META_EVENTS_CONFIG: MetaEventsConfigMap = {
  Purchase: {
    enabled: true,
    sendCAPI: true,
    isCritical: true,
    requiredParams: ["value", "content_ids"],
    order: 1,
  },
  InitiateCheckout: {
    enabled: true,
    sendCAPI: true,
    isCritical: true,
    requiredParams: [],
    order: 2,
  },
  AddPaymentInfo: {
    enabled: true,
    sendCAPI: true,
    isCritical: true,
    requiredParams: [],
    order: 3,
  },
  Lead: {
    enabled: true,
    sendCAPI: true,
    isCritical: true,
    requiredParams: [],
    order: 4,
  },
  CompleteRegistration: {
    enabled: true,
    sendCAPI: true,
    isCritical: false,
    requiredParams: [],
    order: 5,
  },
  AddToCart: {
    enabled: true,
    sendCAPI: false,
    isCritical: false,
    requiredParams: ["content_ids"],
    order: 6,
  },
  ViewContent: {
    enabled: true,
    sendCAPI: false,
    isCritical: false,
    requiredParams: ["content_ids", "value"],
    order: 7,
  },
  PageView: {
    enabled: true,
    sendCAPI: false,
    isCritical: false,
    requiredParams: [],
    order: 8,
  },
  Search: {
    enabled: false,
    sendCAPI: false,
    isCritical: false,
    requiredParams: [],
    order: 9,
  },
};

/**
 * Representación de la fila en la tabla PostgreSQL `cms_meta_tracking_config`.
 */
export interface MetaTrackingConfigRow {
  id: string;
  is_enabled: boolean;
  pixel_id: string | null;
  capi_pixel_id: string | null;
  capi_access_token: string | null;
  currency: string;
  test_event_code: string | null;
  enable_advanced_matching: boolean;
  enable_auto_fbc_fbp: boolean;
  allowed_domains: string[];
  events_config: MetaEventsConfigMap;
  consent_mode: MetaConsentMode;
  debug_mode: boolean;
  updated_by: string | null;
  updated_at: string;
}

/**
 * Configuración pública expuesta en `GET /api/cms/meta-config` hacia el navegador.
 * Nunca incluye el `capiAccessToken`.
 */
export interface MetaPublicConfig {
  isEnabled: boolean;
  pixelId: string;
  currency: string;
  enableAdvancedMatching: boolean;
  enableAutoFbcFbp: boolean;
  allowedDomains: string[];
  eventsConfig: MetaEventsConfigMap;
  consentMode: MetaConsentMode;
  debugMode: boolean;
}

/**
 * Configuración extendida para el panel administrativo del CMS.
 */
export interface MetaAdminConfig extends MetaPublicConfig {
  id?: string;
  capiPixelId: string;
  capiAccessTokenMasked: string;
  hasAccessToken: boolean;
  testEventCode: string | null;
  updatedBy: string | null;
  updatedAt: string | null;
}

/**
 * Datos de usuario para Advanced Matching (se hashean con SHA-256 en servidor).
 */
export interface MetaUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
  externalId?: string;
}

/**
 * Parámetros personalizados de eventos de comercio o conversión.
 */
export interface MetaCustomData {
  value?: number;
  currency?: string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  content_category?: string;
  num_items?: number;
  search_string?: string;
  status?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

/**
 * Payload enviado desde `metaPixelService` hacia `POST /api/capi`.
 */
export interface MetaCapiRequestPayload {
  eventName: string;
  eventId: string;
  eventData?: MetaCustomData;
  eventSourceUrl?: string;
  userData?: MetaUserData;
  fbc?: string;
  fbp?: string;
}

/**
 * Registro de bitácora en `cms_meta_logs`.
 */
export interface MetaTrackingLogEntry {
  id: string;
  event_name: string;
  event_id: string;
  status: "ok" | "error" | "skipped";
  payload: Record<string, unknown> | null;
  response: Record<string, unknown> | null;
  error_message: string | null;
  created_at: string;
}
