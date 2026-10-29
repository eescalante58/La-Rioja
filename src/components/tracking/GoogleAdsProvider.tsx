"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  hasMarketingConsent,
  isCurrentDomainAllowed,
} from "./meta-pixel-service";
import { setGoogleAdsClientConfig } from "./google-ads-service";
import type { GoogleAdsPublicConfig } from "@/types/google-ads-tracking";

/**
 * Proveedor cliente global de Google Ads (`gtag.js` + Google Consent Mode v2).
 * Lee su configuración dinámicamente desde `GET /api/cms/google-ads-config`
 * y opera de forma 100% independiente de Meta Pixel + CAPI.
 */
export function GoogleAdsProvider() {
  const pathname = usePathname();
  const [config, setConfig] = useState<GoogleAdsPublicConfig | null>(null);
  const [consentGranted, setConsentGranted] = useState<boolean>(false);

  useEffect(() => {
    let active = true;

    if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) {
      return;
    }

    fetch("/api/cms/google-ads-config")
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as GoogleAdsPublicConfig;
      })
      .then((data) => {
        if (!active || !data) return;
        setGoogleAdsClientConfig(data);
        setConfig(data);

        const granted = hasMarketingConsent(data.consentMode);
        setConsentGranted(granted);
      })
      .catch(() => {
        // Fallo silencioso: nunca afectar la navegación pública
      });

    const handleConsentChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ granted: boolean }>;
      const granted = Boolean(customEvent.detail?.granted);
      setConsentGranted(granted);

      if (typeof window !== "undefined" && typeof window.gtag === "function") {
        const consentState = granted ? "granted" : "denied";
        window.gtag("consent", "update", {
          ad_storage: consentState,
          ad_user_data: consentState,
          ad_personalization: consentState,
          analytics_storage: consentState,
        });
      }
    };

    window.addEventListener("meta-consent-updated", handleConsentChange);
    return () => {
      active = false;
      window.removeEventListener("meta-consent-updated", handleConsentChange);
    };
  }, [pathname]);

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) {
    return null;
  }

  if (!config || !config.isEnabled || !config.tagId) {
    return null;
  }

  if (
    config.productionOnly &&
    process.env.NODE_ENV !== "production" &&
    !config.debugMode
  ) {
    return null;
  }

  if (!isCurrentDomainAllowed(config.allowedDomains)) {
    return null;
  }

  if (!consentGranted) {
    return null;
  }

  const sanitizedTagId = config.tagId.replace(/[^A-Z0-9-]/gi, "");
  if (!sanitizedTagId.startsWith("AW-")) {
    return null;
  }

  const sanitizedGa4 = config.ga4MeasurementId
    ? config.ga4MeasurementId.replace(/[^A-Z0-9-]/gi, "")
    : "";

  return (
    <>
      <Script
        id="google-ads-gtag-src"
        src={`https://www.googletagmanager.com/gtag/js?id=${sanitizedTagId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-ads-gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('consent', 'default', {
              'ad_storage': 'granted',
              'ad_user_data': 'granted',
              'ad_personalization': '${config.allowAdPersonalization ? "granted" : "denied"}',
              'analytics_storage': 'granted'
            });
            gtag('set', 'allow_ad_personalization_signals', ${config.allowAdPersonalization});
            gtag('set', 'restricted_data_processing', ${config.restrictedDataProcessing});
            gtag('config', '${sanitizedTagId}', {
              'allow_enhanced_conversions': ${config.enableEnhancedConversions},
              'send_page_view': ${Boolean(config.eventsConfig?.PageView?.enabled ?? true)}
            });
            ${
              sanitizedGa4.startsWith("G-")
                ? `gtag('config', '${sanitizedGa4}');`
                : ""
            }
          `,
        }}
      />
    </>
  );
}
