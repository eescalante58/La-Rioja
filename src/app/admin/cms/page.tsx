import { createClient } from "@/lib/supabase/server";
import CMSManagerClient from "./CMSManagerClient";
import { Tabs, TabsList, Tab, TabPanels, TabPanel } from "@tremor/react";
import { List, HelpCircle } from "lucide-react";
import FAQManager from "@/components/admin/FAQManager";

/**
 * CMS Management page for administrators.
 * @returns {Promise<JSX.Element>} The CMS management interface.
 */
export default async function CMSManager() {
  const supabase = createClient();

  const { data: content, error } = await supabase
    .from("site_content")
    .select("*")
    .order("page", { ascending: true })
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
    .select("*")
    .order("content_order", { ascending: true });

  return (
    <div className="space-y-6">
      <Tabs defaultValue="1">
        <TabsList variant="line" color="blue">
          <Tab value="1" icon={List}>
            Contenido General
          </Tab>
          <Tab value="2" icon={HelpCircle}>
            Preguntas Frecuentes (FAQ)
          </Tab>
        </TabsList>
        <TabPanels>
          <TabPanel>
            <div className="mt-6">
              <CMSManagerClient initialContent={content || []} />
            </div>
          </TabPanel>
          <TabPanel>
            <div className="mt-6">
              <FAQManager initialFaqs={faqs || []} />
            </div>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
}
