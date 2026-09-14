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

  const { data: content, error } = await supabase
    .from("site_content")
    .select("*")
    .order("page", { ascending: true })
    .order("section_key", { ascending: true })
    .order("content_order", { ascending: true });

  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600 rounded-xl">
        Error al cargar el CMS: {error.message}
      </div>
    );
  }

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
    .select("event_id, event_name")
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
}

