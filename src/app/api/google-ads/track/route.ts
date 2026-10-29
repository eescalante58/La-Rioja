import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  getRawGoogleAdsConfig,
  recordGoogleAdsLog,
} from "@/lib/tracking/google-ads-config-server";
import { extractGclidFromCookie } from "@/lib/tracking/google-cookies";
import type { GoogleAdsTrackRequestPayload } from "@/types/google-ads-tracking";

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

function hashSHA256(value: string | undefined | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return undefined;
  return crypto.createHash("sha256").update(normalized).digest("hex");
}

function hashPhoneSHA256(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined;
  const digits = phone.replace(/\D/g, "");
  if (!digits) return undefined;
  return crypto.createHash("sha256").update(`+${digits}`).digest("hex");
}

function isDomainAllowed(
  eventSourceUrl: string | undefined,
  allowedDomains: string[]
): boolean {
  if (!allowedDomains || allowedDomains.length === 0) return true;
  if (!eventSourceUrl) return true;

  try {
    const parsed = new URL(eventSourceUrl);
    const hostname = parsed.hostname.toLowerCase();
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    return allowedDomains.some((domain) => {
      const cleanDomain = domain
        .trim()
        .toLowerCase()
        .replace(/^https?:\/\//, "");
      return hostname === cleanDomain || hostname.endsWith(`.${cleanDomain}`);
    });
  } catch {
    return true;
  }
}

/**
 * POST /api/google-ads/track
 * Registra en bitácora del servidor (`cms_google_ads_logs`) las conversiones disparadas
 * hacia Google Ads con su `transaction_id`, `send_to`, `gclid` y Enhanced Conversions (SHA-256).
 * Resiliente: nunca interrumpe el flujo del visitante.
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
  let sendTo = "unknown";
  let transactionId = `gads_${Date.now()}`;

  try {
    const body = (await req.json()) as Partial<GoogleAdsTrackRequestPayload>;
    eventName = String(body.eventName || "").trim();
    sendTo = String(body.sendTo || "").trim();
    transactionId =
      body.transactionId && String(body.transactionId).trim() !== ""
        ? String(body.transactionId).trim()
        : `gads_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    if (!eventName) {
      return NextResponse.json(
        { skipped: true, reason: "missing_event_name" },
        { status: 200 }
      );
    }

    const config = await getRawGoogleAdsConfig();

    if (!config.is_enabled) {
      return NextResponse.json(
        { skipped: true, reason: "kill_switch_off" },
        { status: 200 }
      );
    }

    const eventSetting = config.events_config[eventName];
    if (eventSetting && !eventSetting.enabled) {
      return NextResponse.json(
        { skipped: true, reason: "event_disabled" },
        { status: 200 }
      );
    }

    const eventSourceUrl =
      body.eventSourceUrl || req.headers.get("referer") || undefined;
    if (!isDomainAllowed(eventSourceUrl, config.allowed_domains)) {
      await recordGoogleAdsLog({
        eventName,
        sendTo: sendTo || config.tag_id,
        transactionId,
        status: "skipped",
        errorMessage: `Dominio no autorizado: ${eventSourceUrl || "desconocido"}`,
      });
      return NextResponse.json(
        { skipped: true, reason: "domain_not_allowed" },
        { status: 200 }
      );
    }

    const gclCookie = req.cookies.get("_gcl_aw")?.value;
    const gclid = body.gclid || extractGclidFromCookie(gclCookie) || null;

    const enhancedUserData: Record<string, string | undefined> = {};
    if (config.enable_enhanced_conversions && body.userData) {
      enhancedUserData.sha256_email_address = hashSHA256(body.userData.email);
      enhancedUserData.sha256_phone_number = hashPhoneSHA256(
        body.userData.phone
      );
      enhancedUserData.sha256_first_name = hashSHA256(body.userData.firstName);
      enhancedUserData.sha256_last_name = hashSHA256(body.userData.lastName);
    }

    const resolvedSendTo =
      sendTo ||
      (eventSetting?.conversionLabel
        ? `${config.tag_id}/${eventSetting.conversionLabel}`
        : config.tag_id);

    const auditPayload: Record<string, unknown> = {
      event_name: eventName,
      send_to: resolvedSendTo,
      transaction_id: transactionId,
      gclid,
      event_source_url: eventSourceUrl,
      custom_data: {
        ...(body.eventData || {}),
        currency: String(
          body.eventData?.currency || config.currency || "USD"
        ).toUpperCase(),
      },
      enhanced_conversions: enhancedUserData,
    };

    await recordGoogleAdsLog({
      eventName,
      sendTo: resolvedSendTo,
      transactionId,
      gclid,
      status: "ok",
      payload: auditPayload,
    });

    return NextResponse.json(
      {
        success: true,
        transactionId,
        sendTo: resolvedSendTo,
        gclid,
      },
      { status: 200 }
    );
  } catch (error) {
    const errMsg =
      error instanceof Error
        ? error.message
        : "Error interno al registrar conversión de Google Ads";
    console.error("[POST /api/google-ads/track] Error:", error);

    await recordGoogleAdsLog({
      eventName,
      sendTo,
      transactionId,
      status: "error",
      errorMessage: errMsg,
    });

    return NextResponse.json(
      {
        success: false,
        transactionId,
        error: "Google Ads log error recorded",
      },
      { status: 200 }
    );
  }
}
