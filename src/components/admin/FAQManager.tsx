"use client";

import React, { useState } from "react";
import {
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Title,
  Text,
  Button,
} from "@tremor/react";
import {
  Plus,
  HelpCircle,
  LayoutGrid,
} from "lucide-react";
import {
  deleteFAQ,
  deleteFAQSection,
} from "@/app/admin/cms/actions";
import dynamic from "next/dynamic";

// Dynamic imports for sub-components to improve performance
const FAQTable = dynamic(() => import("./faq/FAQTable"), {
  loading: () => <div className="h-96 w-full bg-slate-900/5 animate-pulse rounded-2xl" />,
});
const FAQSectionTable = dynamic(() => import("./faq/FAQSectionTable"), {
  loading: () => <div className="h-64 w-full bg-slate-900/5 animate-pulse rounded-2xl" />,
});
const FAQModal = dynamic(() => import("./faq/FAQModal"));
const FAQSectionModal = dynamic(() => import("./faq/FAQSectionModal"));

interface FAQSection {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  content_order: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  section_id: string | null;
  is_active: boolean;
  content_order: number;
  faq_sections?: { title: string };
}

interface FAQManagerProps {
  initialFaqs: FAQ[];
  faqSections: FAQSection[];
}

export default function FAQManager({
  initialFaqs,
  faqSections,
}: FAQManagerProps) {
  const [faqs] = useState<FAQ[]>(initialFaqs);
  const [sections] = useState<FAQSection[]>(faqSections);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<FAQSection | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const handleDelete = async (faq: FAQ) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta pregunta?")) return;
    try {
      const result = await deleteFAQ(faq.id);
      if (result.success) window.location.reload();
      else alert("Error al eliminar FAQ: " + result.error);
    } catch (error) {
      alert("Error inesperado al eliminar FAQ.");
    }
  };

  const handleSectionDelete = async (section: FAQSection) => {
    if (!confirm("¿Estás seguro de eliminar esta sección? Se verán afectadas las preguntas asociadas.")) return;
    try {
      const result = await deleteFAQSection(section.id);
      if (result.success) window.location.reload();
      else alert("Error al eliminar sección: " + result.error);
    } catch (error) {
      alert("Error inesperado al eliminar sección.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6 px-4 sm:px-0">
        <div>
          <Title className="text-xl sm:text-2xl font-black text-larioja-azul dark:text-white uppercase tracking-tight">
            Gestión de Preguntas (FAQ)
          </Title>
          <Text className="text-xs sm:text-sm mt-1 text-gray-500 dark:text-gray-400">
            Administra las preguntas y respuestas frecuentes del sitio público.
          </Text>
        </div>
      </div>

      <TabGroup>
        <TabList variant="solid" color="zinc" className="mb-4">
          <Tab icon={HelpCircle}>Preguntas</Tab>
          <Tab icon={LayoutGrid}>Secciones</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6 px-4 sm:px-0">
                <Title className="text-lg font-bold text-larioja-azul dark:text-white uppercase">
                  Listado de Preguntas
                </Title>
                <Button
                  icon={Plus}
                  color="blue"
                  size="sm"
                  onClick={() => { setSelectedFaq(null); setIsModalOpen(true); }}
                >
                  Nueva Pregunta
                </Button>
              </div>

              <FAQTable
                faqs={faqs}
                openFaqId={openFaqId}
                onToggle={(id) => setOpenFaqId(openFaqId === id ? null : id)}
                onEdit={(faq) => { setSelectedFaq(faq); setIsModalOpen(true); }}
                onDelete={handleDelete}
              />
            </div>
          </TabPanel>

          <TabPanel>
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-6 px-4 sm:px-0">
                <Title className="text-lg font-bold text-larioja-azul dark:text-white uppercase">
                  Secciones de FAQ
                </Title>
                <Button
                  icon={Plus}
                  color="blue"
                  size="sm"
                  onClick={() => { setSelectedSection(null); setIsSectionModalOpen(true); }}
                >
                  Nueva Sección
                </Button>
              </div>

              <FAQSectionTable
                sections={sections}
                onEdit={(section) => { setSelectedSection(section); setIsSectionModalOpen(true); }}
                onDelete={handleSectionDelete}
              />
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>

      <FAQModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        faq={selectedFaq}
        sections={sections}
        totalFaqs={faqs.length}
      />

      <FAQSectionModal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        section={selectedSection}
        totalSections={sections.length}
      />
    </div>
  );
}
