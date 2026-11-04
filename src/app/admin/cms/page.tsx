import { createAdminClient } from "@/lib/supabase/server";
import Link from "next/link";
import CMSManagerClient from "./CMSManagerClient";
import { BookUser } from "lucide-react";
import CMSTabsContainer from "@/components/admin/cms/CMSTabsContainer";

// Force dynamic rendering to avoid build-time RLS issues
export const dynamic = "force-dynamic";

/**
 * CMS Management page for administrators.
 * Optimizado para alto rendimiento: solo carga en SSR los datos de la pestaña inicial
 * activa ("Contenido General"), delegando pestañas secundarias a carga diferida bajo demanda.
 * @returns {Promise<JSX.Element>} The CMS management interface.
 */
export default async function CMSManager() {
  const supabase = createAdminClient();

  // Consulta optimizada para la pestaña inicial de Contenido General
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
      />
    </div>
  );
}
