import { NextRequest, NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { requireRoleLevel } from "@/lib/auth/authorization";
import {
  getCachedPublicMetaConfig,
  getRawMetaTrackingConfig,
  normalizeEventsConfig,
  saveMetaTrackingConfig,
  toAdminConfig,
} from "@/lib/tracking/meta-config-server";
import type { MetaConsentMode } from "@/types/meta-tracking";

/**
 * GET /api/cms/meta-config
 * - Público por defecto: retorna `MetaPublicConfig` cacheado (ISR 60s, tag `meta-config`) sin exponer el token.
 * - Si incluye `?admin=1`, verifica rol Admin (nivel >= 8) y retorna `MetaAdminConfig` con token enmascarado.
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

      const raw = await getRawMetaTrackingConfig();
      return NextResponse.json(
        { success: true, data: toAdminConfig(raw) },
        {
          headers: {
            "Cache-Control": "no-store, must-revalidate",
          },
        }
      );
    }

    const publicConfig = await getCachedPublicMetaConfig();
    return NextResponse.json(publicConfig, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[GET /api/cms/meta-config] Error:", error);
    return NextResponse.json(
      {
        isEnabled: false,
        pixelId: "",
        currency: "USD",
        enableAdvancedMatching: false,
        enableAutoFbcFbp: false,
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
 * PUT /api/cms/meta-config
 * Guarda la configuración desde el panel CMS (solo Admin / SuperAdmin, nivel >= 8),
 * encripta el token con AES-256-GCM e invalida la caché `meta-config`.
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
            "Acceso denegado. Se requiere rol de Administrador para editar Meta Pixel & CAPI.",
        },
        { status: 403 }
      );
    }

    const body = (await request.json()) as Record<string, unknown>;

    const pixelId = String(body.pixelId || "").trim();
    if (pixelId && !/^\d{10,20}$/.test(pixelId)) {
      return NextResponse.json(
        {
          success: false,
          error: "El Meta Pixel ID debe contener únicamente dígitos (10 a 20 dígitos).",
        },
        { status: 400 }
      );
    }

    const capiPixelId = String(body.capiPixelId || pixelId).trim();
    if (capiPixelId && !/^\d{10,20}$/.test(capiPixelId)) {
      return NextResponse.json(
        {
          success: false,
          error: "El CAPI Pixel ID debe contener únicamente dígitos.",
        },
        { status: 400 }
      );
    }

    const consentRaw = String(body.consentMode || "basic");
    const consentMode: MetaConsentMode = (
      ["disabled", "basic", "advanced"].includes(consentRaw)
        ? consentRaw
        : "basic"
    ) as MetaConsentMode;

    const allowedDomains = Array.isArray(body.allowedDomains)
      ? body.allowedDomains.map((d) => String(d).trim().toLowerCase()).filter(Boolean)
      : [];

    const savedConfig = await saveMetaTrackingConfig({
      isEnabled: Boolean(body.isEnabled),
      pixelId,
      capiPixelId,
      capiAccessToken:
        typeof body.capiAccessToken === "string"
          ? body.capiAccessToken
          : undefined,
      clearAccessToken: Boolean(body.clearAccessToken),
      currency: String(body.currency || "USD").trim().toUpperCase(),
      testEventCode: body.testEventCode
        ? String(body.testEventCode).trim()
        : null,
      enableAdvancedMatching: Boolean(body.enableAdvancedMatching),
      enableAutoFbcFbp:
        body.enableAutoFbcFbp !== undefined
          ? Boolean(body.enableAutoFbcFbp)
          : true,
      allowedDomains,
      eventsConfig: normalizeEventsConfig(body.eventsConfig),
      consentMode,
      debugMode: Boolean(body.debugMode),
      updatedBy: auth.user.id,
    });

    // Invalidación inmediata de la caché ISR del endpoint público
    revalidateTag("meta-config", { expire: 0 });
    revalidatePath("/admin/cms");

    return NextResponse.json({
      success: true,
      data: savedConfig,
    });
  } catch (error) {
    console.error("[PUT /api/cms/meta-config] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error interno al guardar la configuración de Meta Pixel.",
      },
      { status: 500 }
    );
  }
}
