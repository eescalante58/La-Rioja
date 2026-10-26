"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Title,
  Text,
  Button,
  TextInput,
} from "@tremor/react";
import {
  Plus,
  HelpCircle,
  LayoutGrid,
  Search,
} from "lucide-react";
import { callAction } from "@/lib/action-client";
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
  faq_sections?: { title?: string | null } | null;
}

interface FAQManagerProps {
  initialFaqs: FAQ[];
  faqSections: FAQSection[];
}

export default function FAQManager({
  initialFaqs,
  faqSections,
}: FAQManagerProps) {
  const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs);
  const [sections, setSections] = useState<FAQSection[]>(faqSections);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setFaqs(initialFaqs);
  }, [initialFaqs]);

  useEffect(() => {
    setSections(faqSections);
  }, [faqSections]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<FAQSection | null>(null);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [subTabIndex, setSubTabIndex] = useState(0);

  const sectionMap = useMemo(() => {
    return new Map(sections.map((s) => [s.id, s]));
  }, [sections]);

  // Ordenar primero por sección (orden de la sección o alfabético), luego por orden de la pregunta
  const sortedFaqs = useMemo(() => {
    return [...faqs].sort((a, b) => {
      const secA = a.section_id ? sectionMap.get(a.section_id) : undefined;
      const secB = b.section_id ? sectionMap.get(b.section_id) : undefined;

      const secOrderA = secA?.content_order ?? 9999;
      const secOrderB = secB?.content_order ?? 9999;

      if (secOrderA !== secOrderB) {
        return secOrderA - secOrderB;
      }

      const secTitleA = (secA?.title || a.faq_sections?.title || "").toLowerCase();
      const secTitleB = (secB?.title || b.faq_sections?.title || "").toLowerCase();
      const titleCompare = secTitleA.localeCompare(secTitleB);
      if (titleCompare !== 0) {
        return titleCompare;
      }

      return (a.content_order ?? 0) - (b.content_order ?? 0);
    });
  }, [faqs, sectionMap]);

  // Filtrar preguntas por contenido en pregunta o respuesta
  const filteredFaqs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = q
      ? sortedFaqs.filter((faq) => {
          const matchQuestion = faq.question.toLowerCase().includes(q);
          const matchAnswer = faq.answer.toLowerCase().includes(q);
          const matchSection =
            (faq.section_id && sectionMap.get(faq.section_id)?.title.toLowerCase().includes(q)) ||
            (faq.faq_sections?.title && faq.faq_sections.title.toLowerCase().includes(q));
          return matchQuestion || matchAnswer || Boolean(matchSection);
        })
      : sortedFaqs;

    return list.map((faq) => ({
      ...faq,
      faq_sections: {
        title:
          faq.faq_sections?.title ||
          (faq.section_id ? sectionMap.get(faq.section_id)?.title : null) ||
          "Sin sección",
      },
    }));
  }, [sortedFaqs, searchQuery, sectionMap]);

  useEffect(() => {
    const saved = sessionStorage.getItem("faq_sub_tab");
    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (!isNaN(idx) && (idx === 0 || idx === 1)) {
        setSubTabIndex(idx);
      }
      sessionStorage.removeItem("faq_sub_tab");
    }
  }, []);

  const handleSubTabChange = (index: number) => {
    setSubTabIndex(index);
    sessionStorage.setItem("faq_sub_tab", String(index));
  };

  const handleDelete = async (faq: FAQ) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta pregunta?")) return;
    try {
      sessionStorage.setItem("cms_selected_tab", "1");
      sessionStorage.setItem("faq_sub_tab", "0");
      const result = await callAction<{ success?: boolean; error?: string }>(
        "cms.deleteFAQ",
        [faq.id],
      );
      if (result.success) window.location.reload();
      else alert("Error al eliminar FAQ: " + result.error);
    } catch (error) {
      alert("Error inesperado al eliminar FAQ.");
    }
  };

  const handleSectionDelete = async (section: FAQSection) => {
    if (!confirm("¿Estás seguro de eliminar esta sección? Se verán afectadas las preguntas asociadas.")) return;
    try {
      sessionStorage.setItem("cms_selected_tab", "1");
      sessionStorage.setItem("faq_sub_tab", "1");
      const result = await callAction<{ success?: boolean; error?: string }>(
        "cms.deleteFAQSection",
        [section.id],
      );
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

      <TabGroup index={subTabIndex} onIndexChange={handleSubTabChange}>
        <TabList variant="solid" color="zinc" className="mb-4">
          <Tab icon={HelpCircle}>Preguntas</Tab>
          <Tab icon={LayoutGrid}>Secciones</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 px-4 sm:px-0">
                <div>
                  <Title className="text-lg font-bold text-larioja-azul dark:text-white uppercase">
                    Listado de Preguntas
                  </Title>
                  <Text className="text-xs text-gray-500 dark:text-gray-400">
                    Ordenado por sección y orden de pregunta
                  </Text>
                </div>
                <Button
                  icon={Plus}
                  color="blue"
                  size="sm"
                  onClick={() => { setSelectedFaq(null); setIsModalOpen(true); }}
                >
                  Nueva Pregunta
                </Button>
              </div>

              {/* Barra de búsqueda para contenido en pregunta o respuesta */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex-1 max-w-md">
                  <TextInput
                    icon={Search}
                    placeholder="Buscar en pregunta o respuesta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <Text className="text-xs text-gray-500 dark:text-gray-400 italic">
                    {searchQuery.trim()
                      ? `Mostrando ${filteredFaqs.length} de ${faqs.length} preguntas`
                      : `${faqs.length} preguntas`}
                  </Text>
                  {searchQuery && (
                    <Button
                      variant="light"
                      size="xs"
                      color="gray"
                      onClick={() => setSearchQuery("")}
                    >
                      Limpiar
                    </Button>
                  )}
                </div>
              </div>

              <FAQTable
                faqs={filteredFaqs}
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
