import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireRoleLevel } from "@/lib/auth/authorization";
import {
  getCachedPublicGoogleAdsConfig,
  getRawGoogleAdsConfig,
  normalizeGoogleAdsEventsConfig,
  saveGoogleAdsConfig,
  toAdminGoogleAdsConfig,
} from "@/lib/tracking/google-ads-config-server";
import type { GoogleAdsConsentMode } from "@/types/google-ads-tracking";

/**
 * GET /api/cms/google-ads-config
 * - Público por defecto: retorna `GoogleAdsPublicConfig` cacheado (ISR 60s, tag `google-ads-config`).
 * - Si incluye `?admin=1`, verifica rol Admin (`level >= 8`) y retorna `GoogleAdsAdminConfig`.
 */
export async function GET(request: NextRequest) {
  try {
    const isAdminQuery = request.nextUrl.searchParams.get("admin") === "1";

    if (isAdminQuery) {
      const auth = await requireRoleLevel(8);
      if (auth.error || !auth.user) {
        return NextResponse.json(
          { success: false, error: auth.error || "No autorizado" },
          { status: 403 }
        );
      }

      const raw = await getRawGoogleAdsConfig();
      return NextResponse.json(
        { success: true, data: toAdminGoogleAdsConfig(raw) },
        { headers: { "Cache-Control": "no-store, must-revalidate" } }
      );
    }

    const publicConfig = await getCachedPublicGoogleAdsConfig();
    return NextResponse.json(publicConfig, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[GET /api/cms/google-ads-config] Error:", error);
    return NextResponse.json(
      {
        isEnabled: false,
        tagId: "",
        ga4MeasurementId: "",
        currency: "USD",
        enableEnhancedConversions: false,
        enableAutoGclid: false,
        allowAdPersonalization: false,
        restrictedDataProcessing: true,
        productionOnly: false,
        allowedDomains: [],
        eventsConfig: {},
        consentMode: "disabled",
        debugMode: false,
      },
      { status: 200 }
    );
  }
}

/**
 * PUT /api/cms/google-ads-config
 * Guarda la configuración de Google Ads desde el panel CMS (solo Admin / SuperAdmin, nivel >= 8)
 * e invalida inmediatamente la caché `google-ads-config`.
 */
export async function PUT(request: NextRequest) {
  try {
    const auth = await requireRoleLevel(8);
    if (auth.error || !auth.user) {
      return NextResponse.json(
        {
          success: false,
          error:
            auth.error ||
            "Acceso denegado. Se requiere rol de Administrador para editar Google Ads.",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const tagId = String(body.tagId || "").trim().toUpperCase();
    if (tagId && !/^AW-\d{6,15}$/.test(tagId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "El ID de Google Ads (Tag ID) debe tener el formato AW- seguido de dígitos (ej. AW-18533492300).",
        },
        { status: 400 }
      );
    }

    const ga4MeasurementId = String(body.ga4MeasurementId || "")
      .trim()
      .toUpperCase();
    if (ga4MeasurementId && !/^G-[A-Z0-9]{6,15}$/.test(ga4MeasurementId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "El ID de Google Analytics 4 debe tener el formato G-XXXXXXXXXX (o dejarse vacío).",
        },
        { status: 400 }
      );
    }

    const consentRaw = String(body.consentMode || "disabled");
    const consentMode: GoogleAdsConsentMode = (
      ["disabled", "basic", "advanced"].includes(consentRaw)
        ? consentRaw
        : "disabled"
    ) as GoogleAdsConsentMode;

    const allowedDomains = Array.isArray(body.allowedDomains)
      ? body.allowedDomains
          .map((d) => String(d).trim().toLowerCase())
          .filter(Boolean)
      : [];

    const savedConfig = await saveGoogleAdsConfig({
      isEnabled: Boolean(body.isEnabled),
      tagId,
      ga4MeasurementId,
      currency: String(body.currency || "USD").trim().toUpperCase(),
      enableEnhancedConversions: Boolean(body.enableEnhancedConversions),
      enableAutoGclid:
        body.enableAutoGclid !== undefined
          ? Boolean(body.enableAutoGclid)
          : true,
      allowAdPersonalization: Boolean(body.allowAdPersonalization),
      restrictedDataProcessing:
        body.restrictedDataProcessing !== undefined
          ? Boolean(body.restrictedDataProcessing)
          : true,
      productionOnly: Boolean(body.productionOnly),
      allowedDomains,
      eventsConfig: normalizeGoogleAdsEventsConfig(body.eventsConfig),
      consentMode,
      debugMode: Boolean(body.debugMode),
      updatedBy: auth.user.id,
    });

    revalidateTag("google-ads-config", { expire: 0 });
    revalidatePath("/admin/cms");

    return NextResponse.json({
      success: true,
      data: savedConfig,
    });
  } catch (error) {
    console.error("[PUT /api/cms/google-ads-config] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error interno al guardar la configuración de Google Ads.",
      },
      { status: 500 }
    );
  }
}
