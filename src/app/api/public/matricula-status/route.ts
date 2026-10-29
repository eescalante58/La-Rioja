import { NextResponse } from "next/server";
import { isMatriculaActive } from "@/lib/matricula/matricula-service";
import { getCachedPublicGoogleAdsConfig } from "@/lib/tracking/google-ads-config-server";

export async function GET() {
  try {
    const [active, googleAdsConfig] = await Promise.all([
      isMatriculaActive(),
      getCachedPublicGoogleAdsConfig(),
    ]);

    const adsEnabled = Boolean(active && googleAdsConfig.isEnabled && googleAdsConfig.tagId);
    const conversionEnabled = Boolean(
      adsEnabled &&
        googleAdsConfig.eventsConfig?.Lead?.enabled &&
        googleAdsConfig.eventsConfig?.Lead?.conversionLabel
    );

    const response = NextResponse.json({
      success: true,
      active,
      ads_enabled: adsEnabled,
      conversion_enabled: conversionEnabled,
    });

    response.headers.set("Cache-Control", "public, max-age=60, must-revalidate");
    return response;
  } catch {
    return NextResponse.json(
      { success: false, active: false, ads_enabled: false, conversion_enabled: false },
      { status: 500 }
    );
  }
}
