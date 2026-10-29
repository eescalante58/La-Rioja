"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { googleAds } from "@/components/tracking/google-ads-service";
import type { MatriculaAdsConfig } from "@/lib/validation/matricula";
import type { GoogleAdsUserData } from "@/types/google-ads-tracking";

interface MatriculaGoogleAdsProps {
  config: MatriculaAdsConfig | null;
}

// Bandera global en memoria para impedir emisión de conversiones de matrícula fuera de la ruta
let canEmitMatriculaConversion = false;

export function triggerMatriculaConversion(params: {
  config: MatriculaAdsConfig | null;
  targetUrl: string;
  userData?: GoogleAdsUserData;
  onNavigate?: () => void;
}) {
  const { config, targetUrl, userData, onNavigate } = params;

  let hasNavigated = false;
  const navigate = () => {
    if (hasNavigated) return;
    hasNavigated = true;
    if (onNavigate) {
      onNavigate();
    } else {
      window.location.href = targetUrl;
    }
  };

  // 1. Si el módulo global "Google Ads" del CMS está activo, delegar en él
  if (googleAds.isGlobalActive()) {
    void googleAds.track(
      "Lead",
      {
        value: config?.conversion_value ?? undefined,
        currency: config?.currency || "USD",
        content_name: "Matrícula Lead",
      },
      {
        userData,
        onComplete: navigate,
      }
    );
    return;
  }

  // 2. Fallback a la sección individual matricula_ads si el módulo global está apagado
  if (
    !canEmitMatriculaConversion ||
    !config ||
    !config.enabled ||
    !config.conversion_enabled ||
    !config.tag_id ||
    !config.conversion_label ||
    typeof window === "undefined" ||
    typeof window.gtag !== "function"
  ) {
    // Si la medición está deshabilitada, apagada en CMS o en entorno no permitido, continuar a WhatsApp sin error
    navigate();
    return;
  }

  const sendTo = `${config.tag_id}/${config.conversion_label}`;

  // Timeout de seguridad estricto de 800 ms por si gtag está bloqueado por adblocker o tarda
  const timeoutId = setTimeout(() => {
    navigate();
  }, 800);

  try {
    window.gtag("event", "conversion", {
      send_to: sendTo,
      value: config.conversion_value ?? undefined,
      currency: config.currency || "USD",
      event_callback: () => {
        clearTimeout(timeoutId);
        navigate();
      },
    });
  } catch (err) {
    console.warn("Fallo al emitir evento de conversión de Google Ads:", err);
    clearTimeout(timeoutId);
    navigate();
  }
}

/**
 * Componente cliente para la carga aislada y declarativa de Google Ads en /matricula.
 * Si el proveedor global `GoogleAdsProvider` ya está activo en el CMS, evita inyectar `gtag.js` por duplicado.
 */
export function MatriculaGoogleAds({ config }: MatriculaGoogleAdsProps) {
  const pathname = usePathname();
  const isMountedRef = useRef(false);

  const isAllowedPath = pathname === (config?.allowed_path || "/matricula");
  const isProduction = process.env.NODE_ENV === "production";
  const shouldLoad = Boolean(
    config?.enabled &&
      config?.page_tag_enabled &&
      isAllowedPath &&
      (!config.production_only || isProduction)
  );

  useEffect(() => {
    isMountedRef.current = true;
    canEmitMatriculaConversion = isAllowedPath && Boolean(config?.enabled);

    return () => {
      isMountedRef.current = false;
      // Al salir de la ruta de matrícula (navegación SPA a /admin, /auth, etc.), invalidar conversiones
      canEmitMatriculaConversion = false;
    };
  }, [isAllowedPath, config?.enabled]);

  if (!shouldLoad || !config?.tag_id || googleAds.isGlobalActive()) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${config.tag_id}`}
        strategy="afterInteractive"
      />
      <Script
        id="matricula-ads-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('set', 'allow_ad_personalization_signals', ${config.allow_ad_personalization_signals});
            gtag('set', 'restricted_data_processing', ${config.restricted_data_processing});
            gtag('config', '${config.tag_id}', {
              page_location: window.location.origin + window.location.pathname,
              allow_ad_personalization_signals: ${config.allow_ad_personalization_signals},
              restricted_data_processing: ${config.restricted_data_processing},
              allow_enhanced_conversions: ${config.allow_enhanced_conversions}
            });
          `,
        }}
      />
    </>
  );
}
