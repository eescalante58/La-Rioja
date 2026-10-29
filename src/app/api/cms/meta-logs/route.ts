import { NextResponse } from "next/server";
import { requireRoleLevel } from "@/lib/auth/authorization";
import { getMetaCapiLogs } from "@/lib/tracking/meta-config-server";

/**
 * GET /api/cms/meta-logs
 * Retorna los últimos 50 envíos a Meta CAPI registrados en `cms_meta_logs`.
 * Acceso restringido a administradores (nivel >= 8).
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

    const logs = await getMetaCapiLogs(50);
    return NextResponse.json(
      { success: true, data: logs },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[GET /api/cms/meta-logs] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al cargar los logs de Meta CAPI.",
      },
      { status: 500 }
    );
  }
}
