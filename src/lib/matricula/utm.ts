"use client";

import type { AttributionObject, MatriculaUtmConfig } from "@/lib/validation/matricula";

const UTM_STORAGE_KEY = "lr_matricula_utm_session";

interface StoredUtmSession {
  attribution: AttributionObject;
  capturedAt: number;
  ttlMinutes: number;
}

/**
 * Lee los parámetros de la URL actual y gestiona la persistencia de atribución UTM en sesión.
 * Cumple con el modelo last_explicit_utm_in_session:
 * - Si llega una nueva campaña explícita válida, reemplaza el conjunto completo.
 * - Respeta el TTL configurado (por defecto 30 minutos).
 * - No altera ni elimina los parámetros publicitarios automáticos (gclid, gbraid, wbraid).
 */
export function captureAndStoreUtm(config?: Partial<MatriculaUtmConfig>): AttributionObject {
  if (typeof window === "undefined") {
    return null;
  }

  const ttlMinutes = config?.ttl_minutes || 30;
  const now = Date.now();

  try {
    const urlParams = new URLSearchParams(window.location.search);
    const source = urlParams.get("utm_source")?.trim();
    const medium = urlParams.get("utm_medium")?.trim();
    const campaign = urlParams.get("utm_campaign")?.trim();

    // ¿Hay parámetros explícitos de campaña en la URL actual?
    if (source || campaign) {
      const approvedSources = config?.approved_sources || ["google"];
      const approvedCampaigns = config?.approved_campaigns || ["matricula_2027"];

      const isSourceApproved = !source || approvedSources.includes(source);
      const isCampaignApproved = !campaign || approvedCampaigns.includes(campaign);

      if (isSourceApproved && isCampaignApproved) {
        const newAttribution: AttributionObject = {
          schema_version: 1,
          utm_source: source ? source.substring(0, 100) : undefined,
          utm_medium: medium ? medium.substring(0, 100) : undefined,
          utm_campaign: campaign ? campaign.substring(0, 100) : undefined,
          utm_id: urlParams.get("utm_id")?.trim().substring(0, 100) || undefined,
          utm_content: urlParams.get("utm_content")?.trim().substring(0, 100) || undefined,
          utm_term: urlParams.get("utm_term")?.trim().substring(0, 100) || undefined,
          entry_path: window.location.pathname,
          capture_model: "last_explicit_utm_in_session",
          captured_at: new Date().toISOString(),
        };

        const sessionPayload: StoredUtmSession = {
          attribution: newAttribution,
          capturedAt: now,
          ttlMinutes,
        };

        sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(sessionPayload));
        return newAttribution;
      }
    }

    // Si no hay nuevos parámetros en la URL, comprobar sesión previa existente
    const rawStored = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (rawStored) {
      const parsed = JSON.parse(rawStored) as StoredUtmSession;
      const ageMs = now - parsed.capturedAt;
      const maxAgeMs = (parsed.ttlMinutes || ttlMinutes) * 60 * 1000;

      if (ageMs <= maxAgeMs) {
        return parsed.attribution;
      } else {
        // Expiró el TTL
        sessionStorage.removeItem(UTM_STORAGE_KEY);
      }
    }
  } catch (err) {
    console.warn("No se pudo procesar la atribución UTM en sessionStorage:", err);
  }

  return null;
}

/**
 * Obtiene el objeto de atribución actualmente almacenado si sigue vigente.
 */
export function getStoredAttribution(): AttributionObject {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const rawStored = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!rawStored) return null;

    const parsed = JSON.parse(rawStored) as StoredUtmSession;
    const now = Date.now();
    const maxAgeMs = (parsed.ttlMinutes || 30) * 60 * 1000;

    if (now - parsed.capturedAt <= maxAgeMs) {
      return parsed.attribution;
    } else {
      sessionStorage.removeItem(UTM_STORAGE_KEY);
      return null;
    }
  } catch {
    return null;
  }
}

/**
 * Elimina la atribución almacenada (por ejemplo al revocar consentimiento).
 */
export function clearStoredAttribution(): void {
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem(UTM_STORAGE_KEY);
    } catch {}
  }
}
