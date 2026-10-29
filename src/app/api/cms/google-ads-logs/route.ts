import { NextResponse } from "next/server";
import { requireRoleLevel } from "@/lib/auth/authorization";
import { getGoogleAdsLogs } from "@/lib/tracking/google-ads-config-server";

/**
 * GET /api/cms/google-ads-logs
 * Retorna los últimos 50 registros de conversiones de Google Ads desde `cms_google_ads_logs`.
 * Acceso restringido a administradores (`level >= 8`).
 */
export async function GET() {
  try {
    const auth = await requireRoleLevel(8);
    if (auth.error || !auth.user) {
      return NextResponse.json(
        { success: false, error: auth.error || "No autorizado" },
        { status: 403 }
      );
    }

    const logs = await getGoogleAdsLogs(50);
    return NextResponse.json(
      { success: true, data: logs },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[GET /api/cms/google-ads-logs] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al cargar los logs de Google Ads.",
      },
      { status: 500 }
    );
  }
}
