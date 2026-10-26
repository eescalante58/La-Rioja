import { NextResponse } from "next/server";
import { isMatriculaActive } from "@/lib/matricula/matricula-service";
import { createStaticClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const active = await isMatriculaActive();

    let adsEnabled = false;
    let conversionEnabled = false;

    if (active) {
      const supabase = createStaticClient();
      const { data } = await supabase
        .from("site_content")
        .select("metadata, is_active")
        .eq("page", "matricula")
        .eq("section_key", "matricula_ads")
        .maybeSingle();

      if (data && data.is_active) {
        const meta = (data.metadata || {}) as Record<string, unknown>;
        adsEnabled = meta.enabled === true;
        conversionEnabled = meta.conversion_enabled === true;
      }
    }

    const response = NextResponse.json({
      success: true,
      active,
      ads_enabled: adsEnabled,
      conversion_enabled: conversionEnabled,
    });

    // Límite estricto de 60 segundos conforme a la especificación v1.7
    response.headers.set("Cache-Control", "public, max-age=60, must-revalidate");
    return response;
  } catch {
    return NextResponse.json(
      { success: false, active: false, ads_enabled: false, conversion_enabled: false },
      { status: 500 }
    );
  }
}
