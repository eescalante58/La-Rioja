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
  try {
    const supabase = await createClient();

    const { data: content, error } = await supabase
      .from("site_content")
      .select("*")
      .order("page", { ascending: true })
      .order("section_key", { ascending: true })
      .order("content_order", { ascending: true });

    if (error) throw error;

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

    const { data: galleryImages } = await supabase
      .from("event_gallery")
      .select("*")
      .order("created_at", { ascending: false });

    return (
      <div className="space-y-6">
        <TabGroup defaultValue="1">
          <TabList variant="line" color="blue">
            <Tab value="1" icon={List}>Contenido General</Tab>
            <Tab value="2" icon={HelpCircle}>Preguntas Frecuentes (FAQ)</Tab>
            <Tab value="3" icon={ImageIcon}>Galería de Fotos</Tab>
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
                <GalleryManagement 
                  events={events || []} 
                  initialImages={galleryImages || []} 
                />
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>
    );
  } catch (err: any) {
    console.error("Critical error in CMS Manager:", err);
    return (
      <div className="p-10 text-center">
        <div className="bg-red-50 text-red-700 p-6 rounded-2xl border border-red-100 max-w-2xl mx-auto">
          <h2 className="text-lg font-bold mb-2">Error de Carga</h2>
          <p className="text-sm opacity-80 mb-4">
            No se pudo cargar el panel de administración debido a un problema técnico.
          </p>
          <code className="text-xs bg-red-100/50 p-2 rounded block text-left overflow-auto">
            {err.message || "Error desconocido"}
          </code>
        </div>
      </div>
    );
  }
}

