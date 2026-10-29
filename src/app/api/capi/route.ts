import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { decryptToken } from "@/lib/encryption";
import {
  getRawMetaTrackingConfig,
  recordMetaCapiLog,
} from "@/lib/tracking/meta-config-server";
import type { MetaCapiRequestPayload } from "@/types/meta-tracking";

/**
 * Rate limiter en memoria por IP: máximo 60 solicitudes por minuto por IP.
 */
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const current = ipHits.get(ip);
  if (!current || now > current.resetAt) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (current.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  current.count += 1;
  return true;
}

/**
 * Hashea un valor con SHA-256 después de aplicar trim y lowercase, según especificación de Meta.
 */
function hashSHA256(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

/**
 * Normaliza y hashea un número de teléfono (solo dígitos) con SHA-256.
 */
function hashPhoneSHA256(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined;
  const digitsOnly = phone.replace(/\D/g, "");
  if (!digitsOnly) return undefined;
  return crypto.createHash("sha256").update(digitsOnly).digest("hex");
}

/**
 * Verifica si la URL de origen está permitida según `allowed_domains`.
 */
function isDomainAllowed(
  eventSourceUrl: string | undefined,
  allowedDomains: string[]
): boolean {
  if (!allowedDomains || allowedDomains.length === 0) return true;
  if (!eventSourceUrl) return true;

  try {
    const parsed = new URL(eventSourceUrl);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return true;
    }
    return allowedDomains.some((domain) => {
      const cleanDomain = domain.trim().toLowerCase().replace(/^https?:\/\//, "");
      return hostname === cleanDomain || hostname.endsWith(`.${cleanDomain}`);
    });
  } catch {
    return true;
  }
}

/**
 * POST /api/capi
 * Route Handler de Conversions API (Graph API v21.0) administrado por CMS.
 * Nunca interrumpe flujos del cliente (retorna 200 aún en errores de red con Meta).
 */
export async function POST(req: NextRequest) {
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (!checkRateLimit(clientIp)) {
    return NextResponse.json(
      { skipped: true, reason: "rate_limited" },
      { status: 429 }
    );
  }

  let eventName = "Unknown";
  let eventId = `srv_${Date.now()}`;

  try {
    const body = (await req.json()) as Partial<MetaCapiRequestPayload>;
    eventName = String(body.eventName || "").trim();
    eventId =
      body.eventId && String(body.eventId).trim() !== ""
        ? String(body.eventId).trim()
        : `srv_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    if (!eventName) {
      return NextResponse.json(
        { skipped: true, reason: "missing_event_name" },
        { status: 200 }
      );
    }

    const config = await getRawMetaTrackingConfig();

    // 1. Verificar Kill Switch Global
    if (!config.is_enabled) {
      return NextResponse.json(
        { skipped: true, reason: "kill_switch_off" },
        { status: 200 }
      );
    }

    // 2. Verificar que el evento esté activo en la matriz de eventos
    const eventSetting = config.events_config[eventName];
    if (eventSetting && (!eventSetting.enabled || !eventSetting.sendCAPI)) {
      return NextResponse.json(
        { skipped: true, reason: "event_capi_disabled" },
        { status: 200 }
      );
    }

    // 3. Validar dominios permitidos
    const eventSourceUrl =
      body.eventSourceUrl || req.headers.get("referer") || undefined;
    if (!isDomainAllowed(eventSourceUrl, config.allowed_domains)) {
      await recordMetaCapiLog({
        eventName,
        eventId,
        status: "skipped",
        errorMessage: `Dominio no autorizado: ${eventSourceUrl || "desconocido"}`,
      });
      return NextResponse.json(
        { skipped: true, reason: "domain_not_allowed" },
        { status: 200 }
      );
    }

    // 4. Desencriptar credenciales en servidor
    const capiPixelId = (config.capi_pixel_id || config.pixel_id || "").trim();
    const accessToken = decryptToken(config.capi_access_token);

    if (!capiPixelId || !accessToken) {
      await recordMetaCapiLog({
        eventName,
        eventId,
        status: "skipped",
        errorMessage: "Falta configurar CAPI Pixel ID o CAPI Access Token en el CMS.",
      });
      return NextResponse.json(
        { skipped: true, reason: "missing_capi_credentials" },
        { status: 200 }
      );
    }

    // 5. Obtener _fbc y _fbp desde cookies o fallback del body
    const fbc = req.cookies.get("_fbc")?.value || body.fbc || undefined;
    const fbp = req.cookies.get("_fbp")?.value || body.fbp || undefined;
    const userAgent = req.headers.get("user-agent") || undefined;

    // 6. Advanced Matching con SHA-256 en servidor
    const userData = body.userData;
    const hashedUserData: Record<string, unknown> = {
      fbc,
      fbp,
      client_ip_address: clientIp !== "unknown" ? clientIp : undefined,
      client_user_agent: userAgent,
    };

    if (config.enable_advanced_matching && userData) {
      const em = hashSHA256(userData.email);
      const ph = hashPhoneSHA256(userData.phone);
      const fn = hashSHA256(userData.firstName);
      const ln = hashSHA256(userData.lastName);
      const ct = hashSHA256(userData.city);
      const country = hashSHA256(userData.country);
      const externalId = hashSHA256(userData.externalId);

      if (em) hashedUserData.em = [em];
      if (ph) hashedUserData.ph = [ph];
      if (fn) hashedUserData.fn = [fn];
      if (ln) hashedUserData.ln = [ln];
      if (ct) hashedUserData.ct = [ct];
      if (country) hashedUserData.country = [country];
      if (externalId) hashedUserData.external_id = [externalId];
    }

    // 7. Construir custom_data con moneda por defecto del CMS
    const eventData = body.eventData || {};
    const customData: Record<string, unknown> = {
      ...eventData,
      currency: String(eventData.currency || config.currency || "USD").toUpperCase(),
    };

    // 8. Construir payload para Graph API v21.0
    const graphPayload: Record<string, unknown> = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          event_source_url: eventSourceUrl,
          action_source: "website",
          user_data: hashedUserData,
          custom_data: customData,
        },
      ],
    };

    if (config.test_event_code && config.test_event_code.trim() !== "") {
      graphPayload.test_event_code = config.test_event_code.trim();
    }

    const endpoint = `https://graph.facebook.com/v21.0/${encodeURIComponent(
      capiPixelId
    )}/events?access_token=${encodeURIComponent(accessToken)}`;

    const metaResponse = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(graphPayload),
    });

    const metaResult = (await metaResponse.json()) as Record<string, unknown>;
    const isOk = metaResponse.ok && !metaResult.error;

    await recordMetaCapiLog({
      eventName,
      eventId,
      status: isOk ? "ok" : "error",
      payload: graphPayload,
      response: metaResult,
      errorMessage: isOk
        ? null
        : JSON.stringify(metaResult.error || "Error devuelto por Meta Graph API"),
    });

    return NextResponse.json(
      {
        success: isOk,
        eventId,
        result: metaResult,
      },
      { status: 200 }
    );
  } catch (error) {
    const errMsg =
      error instanceof Error ? error.message : "Error desconocido en CAPI";
    console.error("[CAPI Route Error]", error);

    await recordMetaCapiLog({
      eventName,
      eventId,
      status: "error",
      errorMessage: errMsg,
    });

    // No romper checkout ni experiencia del cliente si CAPI falla
    return NextResponse.json(
      {
        success: false,
        eventId,
        error: "CAPI internal error logged",
      },
      { status: 200 }
    );
  }
}
