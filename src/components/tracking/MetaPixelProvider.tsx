"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import {
  flushBrowserQueue,
  hasMarketingConsent,
  isCurrentDomainAllowed,
  metaPixel,
  setMarketingConsent,
  setMetaClientConfig,
} from "./meta-pixel-service";
import type { MetaPublicConfig } from "@/types/meta-tracking";

const CONSENT_STORAGE_KEY = "la_rioja_meta_consent";

/**
 * Proveedor cliente de Meta Pixel + Conversions API (CAPI).
 * Lee su configuración dinámicamente desde `GET /api/cms/meta-config` (sin depender de `.env`),
 * gestiona el modo de consentimiento y dispara `PageView` con `eventID` para deduplicación.
 */
export function MetaPixelProvider() {
  const pathname = usePathname();
  const [config, setConfig] = useState<MetaPublicConfig | null>(null);
  const [consentGranted, setConsentGranted] = useState<boolean>(false);
  const [showConsentBanner, setShowConsentBanner] = useState<boolean>(false);
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const lastTrackedPathRef = useRef<string | null>(null);

  // 1. Cargar configuración pública desde el endpoint cacheado del CMS
  useEffect(() => {
    let active = true;

    // Excluir rutas administrativas del disparo del pixel público
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) {
      return;
    }

    fetch("/api/cms/meta-config")
      .then(async (res) => {
        if (!res.ok) return null;
        return (await res.json()) as MetaPublicConfig;
      })
      .then((data) => {
        if (!active || !data) return;
        setMetaClientConfig(data);
        setConfig(data);

        const granted = hasMarketingConsent(data.consentMode);
        setConsentGranted(granted);

        if (data.consentMode !== "disabled" && !granted) {
          try {
            const savedDecision = window.localStorage.getItem(
              CONSENT_STORAGE_KEY
            );
            if (!savedDecision) {
              setShowConsentBanner(true);
            }
          } catch {
            setShowConsentBanner(true);
          }
        }
      })
      .catch(() => {
        // Fallo silencioso: nunca afectar la navegación pública
      });

    const handleConsentChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ granted: boolean }>;
      setConsentGranted(Boolean(customEvent.detail?.granted));
      setShowConsentBanner(false);
    };

    window.addEventListener("meta-consent-updated", handleConsentChange);
    return () => {
      active = false;
      window.removeEventListener("meta-consent-updated", handleConsentChange);
    };
  }, [pathname]);

  // 2. Disparar PageView deduplicado cuando la ruta cambia y el Pixel está listo
  useEffect(() => {
    if (!config || !config.isEnabled || !config.pixelId) return;
    if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) return;
    if (!consentGranted) return;
    if (!isCurrentDomainAllowed(config.allowedDomains)) return;

    if (lastTrackedPathRef.current === pathname) return;
    lastTrackedPathRef.current = pathname;

    void metaPixel.track("PageView");
  }, [config, consentGranted, pathname, scriptLoaded]);

  if (pathname?.startsWith("/admin") || pathname?.startsWith("/login")) {
    return null;
  }

  if (!config || !config.isEnabled || !config.pixelId) {
    return null;
  }

  if (!isCurrentDomainAllowed(config.allowedDomains)) {
    return null;
  }

  const sanitizedPixelId = config.pixelId.replace(/\D/g, "");
  if (!sanitizedPixelId) {
    return null;
  }

  return (
    <>
      {consentGranted && (
        <>
          <Script
            id="meta-pixel-base"
            strategy="afterInteractive"
            onLoad={() => {
              setScriptLoaded(true);
              flushBrowserQueue();
            }}
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${sanitizedPixelId}');
              `,
            }}
          />
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${sanitizedPixelId}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}

      {showConsentBanner && config.consentMode !== "disabled" && (
        <div
          role="dialog"
          aria-label="Preferencias de privacidad y cookies"
          className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-2xl rounded-xl border border-slate-200 bg-white/95 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-200">
              <p className="font-semibold text-slate-900 dark:text-white">
                Uso de cookies para medición de campañas
              </p>
              <p className="mt-0.5 text-slate-600 dark:text-slate-300">
                Utilizamos cookies propias y de Meta para medir el impacto de
                nuestras campañas institucionales y mejorar tu experiencia.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2 self-end sm:self-center">
              <button
                type="button"
                onClick={() => setMarketingConsent(false)}
                className="min-h-[44px] sm:min-h-0 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Rechazar
              </button>
              <button
                type="button"
                onClick={() => setMarketingConsent(true)}
                className="min-h-[44px] sm:min-h-0 rounded-lg bg-larioja-azul px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700"
              >
                Aceptar cookies
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
