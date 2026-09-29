import { NextResponse } from "next/server";
import { getSessionTimeoutCore } from "@/app/admin/dashboard-core";

/**
 * GET /api/auth/session-config
 * 
 * Devuelve la configuración de sesión (como el timeout) para la 
 * empresa actualmente seleccionada (basado en la cookie).
 */
export async function GET() {
  const result = await getSessionTimeoutCore();
  
  if (!result.success) {
    return NextResponse.json(result, { status: result.error === "No company selected" ? 200 : 500 });
  }
  
  return NextResponse.json(result);
}
