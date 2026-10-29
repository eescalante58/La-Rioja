"use client";

import {
  DEFAULT_META_EVENTS_CONFIG,
  type MetaCustomData,
  type MetaPublicConfig,
  type MetaUserData,
  type StandardMetaEvent,
} from "@/types/meta-tracking";

export type FbqFunction = (
  command: "init" | "track" | "trackCustom" | "consent",
  eventNameOrPixelId: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string }
) => void;

export interface ConsentState {
  marketing?: boolean;
}

declare global {
  interface Window {
    fbq?: FbqFunction;
    _fbq?: FbqFunction;
    consent?: ConsentState;
  }
}

export interface TrackOptions {
  sendCAPI?: boolean;
  userData?: MetaUserData;
  eventId?: string;
}

interface QueuedBrowserEvent {
  event: string;
  params: Record<string, unknown>;
  eventId: string;
}

const CONSENT_STORAGE_KEY = "la_rioja_meta_consent";

let currentConfig: MetaPublicConfig | null = null;
let configPromise: Promise<MetaPublicConfig | null> | null = null;
const browserQueue: QueuedBrowserEvent[] = [];

/**
 * Genera un identificador único de evento para deduplicación entre Navegador y CAPI.
 */
export function generateMetaEventId(): string {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `evt_${Date.now()}_${randomPart}`;
}

/**
 * Verifica si el usuario ha otorgado consentimiento de marketing según `consentMode`.
 */
export function hasMarketingConsent(
  consentMode: MetaPublicConfig["consentMode"]
): boolean {
  if (consentMode === "disabled") return true;
  if (typeof window === "undefined") return false;

  if (window.consent?.marketing === true) return true;
  try {
    return window.localStorage.getItem(CONSENT_STORAGE_KEY) === "granted";
  } catch {
    return false;
  }
}

/**
 * Guarda la preferencia de consentimiento del usuario y despacha evento para actualizar el Provider.
 */
export function setMarketingConsent(granted: boolean): void {
  if (typeof window === "undefined") return;
  window.consent = { ...window.consent, marketing: granted };
  try {
    window.localStorage.setItem(
      CONSENT_STORAGE_KEY,
      granted ? "granted" : "denied"
    );
  } catch {
    // Ignorar errores de almacenamiento en modo incógnito restringido
  }
  window.dispatchEvent(
    new CustomEvent("meta-consent-updated", { detail: { granted } })
  );
}

/**
 * Verifica si el dominio actual está autorizado según `allowedDomains`.
 */
export function isCurrentDomainAllowed(allowedDomains: string[]): boolean {
  if (!allowedDomains || allowedDomains.length === 0) return true;
  if (typeof window === "undefined") return true;

  const hostname = window.location.hostname.toLowerCase();
  if (hostname === "localhost" || hostname === "127.0.0.1") return true;

  return allowedDomains.some((d) => {
    const clean = d.trim().toLowerCase().replace(/^https?:\/\//, "");
    return hostname === clean || hostname.endsWith(`.${clean}`);
  });
}

/**
 * Establece la configuración pública en memoria desde `MetaPixelProvider`.
 */
export function setMetaClientConfig(config: MetaPublicConfig): void {
  currentConfig = config;
  flushBrowserQueue();
}

/**
 * Obtiene la configuración pública desde memoria o desde `GET /api/cms/meta-config`.
 */
export async function ensureMetaClientConfig(): Promise<MetaPublicConfig | null> {
  if (currentConfig) return currentConfig;
  if (typeof window === "undefined") return null;

  if (!configPromise) {
    configPromise = fetch("/api/cms/meta-config")
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as MetaPublicConfig;
        currentConfig = data;
        return data;
      })
      .catch(() => null)
      .finally(() => {
        configPromise = null;
      });
  }

  return configPromise;
}

/**
 * Procesa los eventos encolados cuando `window.fbq` termina de inicializarse.
 */
export function flushBrowserQueue(): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  while (browserQueue.length > 0) {
    const item = browserQueue.shift();
    if (item) {
      window.fbq("track", item.event, item.params, { eventID: item.eventId });
    }
  }
}

/**
 * Servicio principal de tracking de Meta Pixel + Conversions API (CAPI).
 */
export const metaPixel = {
  /**
   * Dispara un evento hacia Meta Pixel (navegador) y/o Conversions API (servidor)
   * respetando la configuración dinámica del CMS y deduplicando con `eventId`.
   */
  async track(
    event: StandardMetaEvent,
    params: MetaCustomData = {},
    options: TrackOptions = {}
  ): Promise<string | null> {
    if (typeof window === "undefined") return null;

    const config = await ensureMetaClientConfig();
    if (!config || !config.isEnabled || !config.pixelId) {
      return null;
    }

    if (!isCurrentDomainAllowed(config.allowedDomains)) {
      if (config.debugMode) {
        console.warn(
          `[Meta Pixel] Dominio actual (${window.location.hostname}) no incluido en allowedDomains.`
        );
      }
      return null;
    }

    if (!hasMarketingConsent(config.consentMode)) {
      if (config.debugMode) {
        console.info(
          `[Meta Pixel] Evento '${event}' omitido: esperando consentimiento (${config.consentMode}).`
        );
      }
      return null;
    }

    const eventsMap = config.eventsConfig || DEFAULT_META_EVENTS_CONFIG;
    const eventSetting = eventsMap[event];

    if (eventSetting && !eventSetting.enabled) {
      if (config.debugMode) {
        console.info(
          `[Meta Pixel] Evento '${event}' desactivado en la matriz del CMS.`
        );
      }
      return null;
    }

    const eventId = options.eventId || generateMetaEventId();
    const enrichedParams: Record<string, unknown> = {
      ...params,
      currency: String(params.currency || config.currency || "USD").toUpperCase(),
    };

    // Validación informativa de parámetros requeridos en modo debug
    if (
      config.debugMode &&
      eventSetting?.requiredParams &&
      eventSetting.requiredParams.length > 0
    ) {
      const missing = eventSetting.requiredParams.filter(
        (reqKey) => enrichedParams[reqKey] === undefined
      );
      if (missing.length > 0) {
        console.warn(
          `[Meta Pixel] Evento '${event}' disparado sin parámetros requeridos:`,
          missing
        );
      }
    }

    // 1. Disparo en navegador (o encolado si fbevents.js sigue cargando)
    if (typeof window.fbq === "function") {
      window.fbq("track", event, enrichedParams, { eventID: eventId });
    } else {
      browserQueue.push({ event, params: enrichedParams, eventId });
    }

    if (config.debugMode) {
      console.info(`[Meta Pixel] ${event}`, enrichedParams, { eventId });
    }

    // 2. Disparo Server-Side (CAPI) si el evento lo tiene habilitado en CMS o por opción explícita
    // Funciona incluso cuando el usuario tiene AdBlocker activo en su navegador
    const shouldSendCAPI =
      Boolean(options.sendCAPI) ||
      Boolean(eventSetting?.sendCAPI) ||
      Boolean(eventSetting?.isCritical);

    if (shouldSendCAPI) {
      fetch("/api/capi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          eventName: event,
          eventData: enrichedParams,
          eventId,
          eventSourceUrl: window.location.href,
          userData: options.userData,
        }),
      }).catch((err) => {
        if (config.debugMode) {
          console.error("[Meta CAPI Client Error]", err);
        }
      });
    }

    return eventId;
  },
};
