"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@tremor/react";
import {
  List,
  HelpCircle,
  Image as ImageIcon,
  Activity,
  Target,
} from "lucide-react";

interface CMSTabsContainerProps {
  contentPanel: React.ReactNode;
  faqPanel: React.ReactNode;
  galleryPanel: React.ReactNode;
  metaPixelPanel: React.ReactNode;
  googleAdsPanel: React.ReactNode;
}

/**
 * Contenedor de pestañas del CMS con persistencia de pestaña activa.
 * Soporta navegación directa por URL (?tab=contenido, ?tab=faq, ?tab=galeria, ?tab=meta-pixel, ?tab=google-ads).
 */
export default function CMSTabsContainer({
  contentPanel,
  faqPanel,
  galleryPanel,
  metaPixelPanel,
  googleAdsPanel,
}: CMSTabsContainerProps) {
  const searchParams = useSearchParams();
  const [selectedTab, setSelectedTab] = useState(0);

  useEffect(() => {
    // 1. Prioridad: parámetro en URL (?tab=faq, ?tab=galeria, ?tab=contenido, ?tab=meta-pixel, ?tab=google-ads)
    const tabParam = searchParams.get("tab")?.toLowerCase();
    if (tabParam === "faq" || tabParam === "1") {
      setSelectedTab(1);
      return;
    }
    if (tabParam === "gallery" || tabParam === "galeria" || tabParam === "2") {
      setSelectedTab(2);
      return;
    }
    if (
      tabParam === "meta-pixel" ||
      tabParam === "metapixel" ||
      tabParam === "pixel" ||
      tabParam === "3"
    ) {
      setSelectedTab(3);
      return;
    }
    if (
      tabParam === "google-ads" ||
      tabParam === "googleads" ||
      tabParam === "gads" ||
      tabParam === "4"
    ) {
      setSelectedTab(4);
      return;
    }
    if (tabParam === "content" || tabParam === "contenido" || tabParam === "0") {
      setSelectedTab(0);
      return;
    }

    // 2. Persistencia en sessionStorage tras recargas de formulario
    const saved = sessionStorage.getItem("cms_selected_tab");
    if (saved !== null) {
      const idx = parseInt(saved, 10);
      if (!isNaN(idx) && idx >= 0 && idx <= 4) {
        setSelectedTab(idx);
      }
      sessionStorage.removeItem("cms_selected_tab");
    }
  }, [searchParams]);

  const handleTabChange = (index: number) => {
    setSelectedTab(index);
    sessionStorage.setItem("cms_selected_tab", String(index));
    try {
      const url = new URL(window.location.href);
      const tabName =
        index === 1
          ? "faq"
          : index === 2
          ? "galeria"
          : index === 3
          ? "meta-pixel"
          : index === 4
          ? "google-ads"
          : "contenido";
      url.searchParams.set("tab", tabName);
      window.history.replaceState({}, "", url.toString());
    } catch {
      // Ignorar errores en entornos donde window.history no esté disponible
    }
  };

  return (
    <TabGroup index={selectedTab} onIndexChange={handleTabChange}>
      <TabList className="mt-2 flex-wrap">
        <Tab className="text-base sm:text-lg">
          <div className="flex items-center gap-2">
            <List size={20} />
            <span>Contenido General</span>
          </div>
        </Tab>
        <Tab className="text-base sm:text-lg">
          <div className="flex items-center gap-2">
            <HelpCircle size={20} />
            <span>Preguntas Frecuentes (FAQ)</span>
          </div>
        </Tab>
        <Tab className="text-base sm:text-lg">
          <div className="flex items-center gap-2">
            <ImageIcon size={20} />
            <span>Galería de Fotos</span>
          </div>
        </Tab>
        <Tab className="text-base sm:text-lg">
          <div className="flex items-center gap-2">
            <Activity size={20} />
            <span>Meta Pixel</span>
          </div>
        </Tab>
        <Tab className="text-base sm:text-lg">
          <div className="flex items-center gap-2">
            <Target size={20} />
            <span>Google Ads</span>
          </div>
        </Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <div className="mt-6">{contentPanel}</div>
        </TabPanel>
        <TabPanel>
          <div className="mt-6">{faqPanel}</div>
        </TabPanel>
        <TabPanel>
          <div className="mt-6">{galleryPanel}</div>
        </TabPanel>
        <TabPanel>
          <div className="mt-6">{metaPixelPanel}</div>
        </TabPanel>
        <TabPanel>
          <div className="mt-6">{googleAdsPanel}</div>
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
}
