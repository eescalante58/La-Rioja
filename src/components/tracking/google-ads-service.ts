"use client";

import {
  DEFAULT_GOOGLE_ADS_EVENTS_CONFIG,
  type GoogleAdsCustomData,
  type GoogleAdsPublicConfig,
  type GoogleAdsUserData,
  type StandardGoogleAdsEvent,
} from "@/types/google-ads-tracking";
import {
  hasMarketingConsent,
  isCurrentDomainAllowed,
} from "./meta-pixel-service";

export interface GoogleAdsTrackOptions {
  userData?: GoogleAdsUserData;
  transactionId?: string;
  conversionLabel?: string;
  onComplete?: () => void;
}

let currentGoogleConfig: GoogleAdsPublicConfig | null = null;
let googleConfigPromise: Promise<GoogleAdsPublicConfig | null> | null = null;

/**
 * Genera un identificador único de transacción/evento para deduplicación en Google Ads.
 */
export function generateGoogleTransactionId(): string {
  const randomPart =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `gads_${Date.now()}_${randomPart}`;
}

/**
 * Establece la configuración pública de Google Ads en memoria desde `GoogleAdsProvider`.
 */
export function setGoogleAdsClientConfig(config: GoogleAdsPublicConfig): void {
  currentGoogleConfig = config;
}

/**
 * Obtiene la configuración pública de Google Ads desde memoria o desde `/api/cms/google-ads-config`.
 */
export async function ensureGoogleAdsClientConfig(): Promise<GoogleAdsPublicConfig | null> {
  if (currentGoogleConfig) return currentGoogleConfig;
  if (typeof window === "undefined") return null;

  if (!googleConfigPromise) {
    googleConfigPromise = fetch("/api/cms/google-ads-config")
      .then(async (res) => {
        if (!res.ok) return null;
        const data = (await res.json()) as GoogleAdsPublicConfig;
        currentGoogleConfig = data;
        return data;
      })
      .catch(() => null)
      .finally(() => {
        googleConfigPromise = null;
      });
  }

  return googleConfigPromise;
}

/**
 * Verifica si la ruta actual está permitida para el evento según `allowedPaths`.
 */
function isPathAllowed(allowedPaths: string[] | undefined): boolean {
  if (!allowedPaths || allowedPaths.length === 0) return true;
  if (allowedPaths.includes("*")) return true;
  if (typeof window === "undefined") return true;

  const pathname = window.location.pathname;
  return allowedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

/**
 * Servicio principal de seguimiento y conversiones de Google Ads (`gtag.js`).
 * Funciona de manera 100% independiente de Meta Pixel + CAPI.
 */
export const googleAds = {
  /**
   * Verifica si el módulo global de Google Ads está activo en el CMS.
   */
  isGlobalActive(): boolean {
    return Boolean(
      currentGoogleConfig?.isEnabled && currentGoogleConfig?.tagId
    );
  },

  /**
   * Dispara un evento de conversión hacia Google Ads (`gtag.js`) y lo registra
   * en la bitácora del servidor (`/api/google-ads/track`).
   * Incluye timeout de seguridad de 800 ms para no bloquear redirecciones (ej. WhatsApp).
   */
  async track(
    event: StandardGoogleAdsEvent,
    params: GoogleAdsCustomData = {},
    options: GoogleAdsTrackOptions = {}
  ): Promise<string | null> {
    let completed = false;
    const finish = () => {
      if (completed) return;
      completed = true;
      if (options.onComplete) {
        options.onComplete();
      }
    };

    if (typeof window === "undefined") {
      finish();
      return null;
    }

    const config = await ensureGoogleAdsClientConfig();
    if (!config || !config.isEnabled || !config.tagId) {
      finish();
      return null;
    }

    if (
      config.productionOnly &&
      process.env.NODE_ENV !== "production" &&
      !config.debugMode
    ) {
      if (config.debugMode) {
        console.info(
          `[Google Ads] Evento '${event}' omitido por modo productionOnly.`
        );
      }
      finish();
      return null;
    }

    if (!isCurrentDomainAllowed(config.allowedDomains)) {
      if (config.debugMode) {
        console.warn(
          `[Google Ads] Dominio actual (${window.location.hostname}) no incluido en allowedDomains.`
        );
      }
      finish();
      return null;
    }

    if (!hasMarketingConsent(config.consentMode)) {
      if (config.debugMode) {
        console.info(
          `[Google Ads] Evento '${event}' omitido: esperando consentimiento (${config.consentMode}).`
        );
      }
      finish();
      return null;
    }

    const eventsMap = config.eventsConfig || DEFAULT_GOOGLE_ADS_EVENTS_CONFIG;
    const eventSetting = eventsMap[event];

    if (eventSetting && !eventSetting.enabled) {
      if (config.debugMode) {
        console.info(
          `[Google Ads] Evento '${event}' desactivado en la matriz del CMS.`
        );
      }
      finish();
      return null;
    }

    if (eventSetting && !isPathAllowed(eventSetting.allowedPaths)) {
      if (config.debugMode) {
        console.info(
          `[Google Ads] Evento '${event}' no permitido en la ruta ${window.location.pathname}.`
        );
      }
      finish();
      return null;
    }

    const conversionLabel = (
      options.conversionLabel ||
      eventSetting?.conversionLabel ||
      ""
    ).trim();

    const sendTo = conversionLabel
      ? `${config.tagId}/${conversionLabel}`
      : config.tagId;

    const transactionId =
      options.transactionId ||
      params.transaction_id ||
      generateGoogleTransactionId();

    const resolvedValue =
      params.value !== undefined
        ? params.value
        : eventSetting?.defaultValue ?? undefined;

    const resolvedCurrency = String(
      params.currency || config.currency || "USD"
    ).toUpperCase();

    // 1. Configurar Enhanced Conversions si está habilitado y hay datos de usuario
    if (
      config.enableEnhancedConversions &&
      options.userData &&
      typeof window.gtag === "function"
    ) {
      const userDataPayload: Record<string, unknown> = {};
      if (options.userData.email) {
        userDataPayload.email = options.userData.email.trim().toLowerCase();
      }
      if (options.userData.phone) {
        const digits = options.userData.phone.replace(/\D/g, "");
        if (digits) {
          userDataPayload.phone_number = `+${digits}`;
        }
      }
      if (Object.keys(userDataPayload).length > 0) {
        window.gtag("set", "user_data", userDataPayload);
      }
    }

    // 2. Registrar en bitácora del servidor si corresponde
    if (eventSetting?.logServer || eventSetting?.isCritical) {
      fetch("/api/google-ads/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body: JSON.stringify({
          eventName: event,
          sendTo,
          transactionId,
          eventData: {
            ...params,
            value: resolvedValue,
            currency: resolvedCurrency,
          },
          eventSourceUrl: window.location.href,
          userData: options.userData,
        }),
      }).catch((err) => {
        if (config.debugMode) {
          console.error("[Google Ads Track API Error]", err);
        }
      });
    }

    // 3. Disparar conversión en navegador con timeout de seguridad de 800 ms
    if (typeof window.gtag === "function" && conversionLabel) {
      const timeoutId = setTimeout(() => {
        finish();
      }, 800);

      try {
        window.gtag("event", "conversion", {
          send_to: sendTo,
          value: resolvedValue,
          currency: resolvedCurrency,
          transaction_id: transactionId,
          event_callback: () => {
            clearTimeout(timeoutId);
            finish();
          },
        });
      } catch (err) {
        if (config.debugMode) {
          console.warn("[Google Ads] Error al emitir gtag conversion:", err);
        }
        clearTimeout(timeoutId);
        finish();
      }
    } else {
      finish();
    }

    if (config.debugMode) {
      console.info(
        `[Google Ads] ${event} -> ${sendTo}`,
        { value: resolvedValue, currency: resolvedCurrency, transactionId }
      );
    }

    return transactionId;
  },
};
