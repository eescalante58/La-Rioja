import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import CMSManagerClient from "./CMSManagerClient";
import { BookUser } from "lucide-react";
import FAQManager from "@/components/admin/FAQManager";
import GalleryManagement from "@/components/admin/cms/GalleryManagement";
import CMSTabsContainer from "@/components/admin/cms/CMSTabsContainer";
import MetaPixelConfigManager from "@/components/admin/cms/MetaPixelConfigManager";
import GoogleAdsConfigManager from "@/components/admin/cms/GoogleAdsConfigManager";
import {
  getRawMetaTrackingConfig,
  toAdminConfig,
} from "@/lib/tracking/meta-config-server";
import {
  getRawGoogleAdsConfig,
  toAdminGoogleAdsConfig,
} from "@/lib/tracking/google-ads-config-server";
import { requireRoleLevel } from "@/lib/auth/authorization";

// Force dynamic rendering to avoid build-time RLS issues
export const dynamic = "force-dynamic";

/**
 * CMS Management page for administrators.
 * @returns {Promise<JSX.Element>} The CMS management interface.
 */
export default async function CMSManager() {
  const supabase = createAdminClient();

  // Consultas con manejo de errores silencioso para diagnóstico
  const { data: content, error: contentError } = await supabase
    .from("site_content")
    .select("*")
    .neq("section_key", "__meta_tracking_config__")
    .neq("section_key", "__meta_tracking_logs__")
    .neq("section_key", "__google_ads_tracking_config__")
    .neq("section_key", "__google_ads_tracking_logs__")
    .neq("section_key", "matricula_ads")
    .order("page", { ascending: true })
    .order("section_key", { ascending: true })
    .order("content_order", { ascending: true });

  const { data: faqs } = await supabase
    .from("faqs")
    .select("*, faq_sections(title)")
    .order("content_order", { ascending: true });

  const { data: faqSections } = await supabase
    .from("faq_sections")
    .select("*")
    .order("content_order", { ascending: true });

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: galleryImages, error: galleryError } = await supabase
    .from("event_gallery")
    .select("*")
    .order("created_at", { ascending: false });

  const [rawMetaConfig, rawGoogleConfig, adminRoleCheck] = await Promise.all([
    getRawMetaTrackingConfig(),
    getRawGoogleAdsConfig(),
    requireRoleLevel(8),
  ]);

  const metaAdminConfig = toAdminConfig(rawMetaConfig);
  const googleAdsAdminConfig = toAdminGoogleAdsConfig(rawGoogleConfig);
  const canEditTracking = !adminRoleCheck.error && adminRoleCheck.level >= 8;

  // Si hay errores críticos de conexión, mostrar mensaje simple
  if (contentError && contentError.message.includes("fetch")) {
    return (
      <div className="p-10 text-red-500">
        Error de conexión con la base de datos.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end pt-2">
        <Link
          href="/admin/cms/manual"
          className="flex items-center gap-2 text-sm font-semibold text-larioja-azul dark:text-larioja-amarillo hover:underline"
        >
          <BookUser size={18} />
          Manual de Usuario
        </Link>
      </div>
      <CMSTabsContainer
        contentPanel={<CMSManagerClient initialContent={content || []} />}
        faqPanel={
          <FAQManager
            initialFaqs={faqs || []}
            faqSections={faqSections || []}
          />
        }
        galleryPanel={
          galleryError ? (
            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-100 text-sm">
              La tabla de galería no parece estar lista aún:{" "}
              {galleryError.message}
            </div>
          ) : (
            <GalleryManagement
              events={events || []}
              initialImages={galleryImages || []}
            />
          )
        }
        metaPixelPanel={
          <MetaPixelConfigManager
            initialConfig={metaAdminConfig}
            canEdit={canEditTracking}
          />
        }
        googleAdsPanel={
          <GoogleAdsConfigManager
            initialConfig={googleAdsAdminConfig}
            canEdit={canEditTracking}
          />
        }
      />
    </div>
  );
}
