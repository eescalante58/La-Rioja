import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireRoleLevel } from "@/lib/auth/authorization";
import {
  getRawGoogleAdsConfig,
  recordGoogleAdsLog,
} from "@/lib/tracking/google-ads-config-server";

/**
 * POST /api/google-ads/test
 * Herramienta del panel CMS para validar la configuración de Google Ads y registrar
 * un evento de prueba en `cms_google_ads_logs`.
 * Protegido para administradores (`level >= 8`).
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await requireRoleLevel(8);
    if (auth.error || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "No autorizado" },
        { status: 403 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const config = await getRawGoogleAdsConfig();

    const tagId = String(body.tagId || config.tag_id || "")
      .trim()
      .toUpperCase();
    if (!tagId || !/^AW-\d{6,15}$/.test(tagId)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Configura primero un Google Ads Tag ID válido (ej. AW-18533492300) antes de probar.",
        },
        { status: 400 }
      );
    }

    const leadSetting = config.events_config["Lead"];
    const conversionLabel = String(
      body.conversionLabel || leadSetting?.conversionLabel || ""
    ).trim();

    const sendTo = conversionLabel ? `${tagId}/${conversionLabel}` : tagId;
    const transactionId = `test_gads_${Date.now()}_${crypto
      .randomUUID()
      .slice(0, 6)}`;

    const testEmailHash = crypto
      .createHash("sha256")
      .update(auth.user.email?.trim().toLowerCase() || "test@lariojacflsv.site")
      .digest("hex");

    const testPayload: Record<string, unknown> = {
      event_name: "Lead (Test CMS)",
      send_to: sendTo,
      transaction_id: transactionId,
      currency: config.currency || "USD",
      value: leadSetting?.defaultValue ?? 10.0,
      enhanced_conversions: {
        sha256_email_address: testEmailHash,
      },
      verified_by: auth.user.email,
    };

    await recordGoogleAdsLog({
      eventName: "Lead (Test CMS)",
      sendTo,
      transactionId,
      gclid: "TEST_GCLID_CMS",
      status: "ok",
      payload: testPayload,
    });

    return NextResponse.json({
      success: true,
      transactionId,
      sendTo,
      payload: testPayload,
    });
  } catch (error) {
    console.error("[POST /api/google-ads/test] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al ejecutar la prueba de Google Ads.",
      },
      { status: 500 }
    );
  }
}
