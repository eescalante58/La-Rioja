import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireRoleLevel } from "@/lib/auth/authorization";
import { decryptToken } from "@/lib/encryption";
import {
  getRawMetaTrackingConfig,
  recordMetaCapiLog,
} from "@/lib/tracking/meta-config-server";

/**
 * POST /api/capi/test
 * Herramienta del panel CMS para probar en tiempo real la conexión con Meta Graph API v21.0.
 * Protegido para administradores (nivel >= 8).
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
    const config = await getRawMetaTrackingConfig();

    const capiPixelId = String(
      body.capiPixelId || config.capi_pixel_id || config.pixel_id || ""
    ).trim();

    const rawCandidateToken =
      typeof body.capiAccessToken === "string" &&
      body.capiAccessToken.trim() !== "" &&
      !body.capiAccessToken.includes("••••")
        ? body.capiAccessToken.trim()
        : decryptToken(config.capi_access_token);

    if (!capiPixelId || !rawCandidateToken) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Configura y guarda primero el Pixel ID y el CAPI Access Token antes de enviar un evento de prueba.",
        },
        { status: 400 }
      );
    }

    const testEventCode =
      typeof body.testEventCode === "string" && body.testEventCode.trim() !== ""
        ? body.testEventCode.trim()
        : config.test_event_code;

    const eventName = String(body.eventName || "PageView");
    const eventId = `test_${Date.now()}_${crypto.randomUUID().slice(0, 6)}`;
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Meta-CMS-Test-Agent";

    const testEmailHash = crypto
      .createHash("sha256")
      .update(auth.user.email?.trim().toLowerCase() || "test@lariojacflsv.site")
      .digest("hex");

    const graphPayload: Record<string, unknown> = {
      data: [
        {
          event_name: eventName,
          event_time: Math.floor(Date.now() / 1000),
          event_id: eventId,
          event_source_url:
            req.headers.get("referer") || "https://lariojacflsv.site",
          action_source: "website",
          user_data: {
            client_ip_address: clientIp,
            client_user_agent: userAgent,
            em: [testEmailHash],
          },
          custom_data: {
            currency: config.currency || "USD",
            value: 10.0,
            content_name: "Evento de Prueba CMS La Rioja",
          },
        },
      ],
    };

    if (testEventCode) {
      graphPayload.test_event_code = testEventCode;
    }

    const endpoint = `https://graph.facebook.com/v21.0/${encodeURIComponent(
      capiPixelId
    )}/events?access_token=${encodeURIComponent(rawCandidateToken)}`;

    const metaRes = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(graphPayload),
    });

    const metaData = (await metaRes.json()) as Record<string, unknown>;
    const isOk = metaRes.ok && !metaData.error;

    await recordMetaCapiLog({
      eventName: `${eventName} (Test CMS)`,
      eventId,
      status: isOk ? "ok" : "error",
      payload: graphPayload,
      response: metaData,
      errorMessage: isOk
        ? null
        : JSON.stringify(metaData.error || "Error en prueba CAPI"),
    });

    return NextResponse.json({
      success: isOk,
      eventId,
      testEventCode: testEventCode || null,
      response: metaData,
      error: isOk
        ? null
        : (metaData.error as Record<string, unknown>)?.message ||
          "Meta Graph API rechazó el evento de prueba.",
    });
  } catch (error) {
    console.error("[POST /api/capi/test] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Error al ejecutar la prueba de CAPI.",
      },
      { status: 500 }
    );
  }
}
