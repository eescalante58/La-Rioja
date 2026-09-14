import { createClient } from "@/lib/supabase/server";
import CMSManagerClient from "./CMSManagerClient";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@tremor/react";
import { List, HelpCircle, Image as ImageIcon } from "lucide-react";
import FAQManager from "@/components/admin/FAQManager";
import GalleryManagement from "@/components/admin/cms/GalleryManagement";

// Force dynamic rendering to avoid build-time RLS issues
export const dynamic = "force-dynamic";

/**
 * CMS Management page for administrators.
 * @returns {Promise<JSX.Element>} The CMS management interface.
 */
export default async function CMSManager() {
  const supabase = await createClient();

  // Consultas con manejo de errores silencioso para diagnóstico
  const { data: content, error: contentError } = await supabase
    .from("site_content")
    .select("*")
    .order("page", { ascending: true })
    .order("section_key", { ascending: true })
    .order("content_order", { ascending: true });

  const { data: faqs, error: faqsError } = await supabase
    .from("faqs")
    .select("*, faq_sections(title)")
    .order("content_order", { ascending: true });

  const { data: faqSections, error: sectionsError } = await supabase
    .from("faq_sections")
    .select("*")
    .order("content_order", { ascending: true });

  const { data: events, error: eventsError } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  const { data: galleryImages, error: galleryError } = await supabase
    .from("event_gallery")
    .select("*")
    .order("created_at", { ascending: false });

  // Si hay errores críticos de conexión, mostrar mensaje simple
  if (contentError && contentError.message.includes("fetch")) {
    return <div className="p-10 text-red-500">Error de conexión con la base de datos.</div>;
  }

  return (
    <div className="space-y-6">
      <TabGroup defaultValue="1">
        <TabList variant="line" color="blue">
          <Tab value="1">Contenido General</Tab>
          <Tab value="2">Preguntas Frecuentes (FAQ)</Tab>
          <Tab value="3">Galería de Fotos</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <div className="mt-6">
              <CMSManagerClient initialContent={content || []} />
            </div>
          </TabPanel>
          <TabPanel>
            <div className="mt-6">
              <FAQManager
                initialFaqs={faqs || []}
                faqSections={faqSections || []}
              />
            </div>
          </TabPanel>
          <TabPanel>
            <div className="mt-6">
              {galleryError ? (
                <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-100 text-sm">
                  La tabla de galería no parece estar lista aún: {galleryError.message}
                </div>
              ) : (
                <GalleryManagement 
                  events={events || []} 
                  initialImages={galleryImages || []} 
                />
              )}
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}

