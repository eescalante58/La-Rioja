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
import dynamic from "next/dynamic";

// Importaciones dinámicas bajo demanda con esqueletos ligeros
const FAQTabLazy = dynamic(() => import("./FAQTabLazy"), {
  loading: () => <div className="h-96 w-full bg-slate-900/5 animate-pulse rounded-2xl" />,
});
const GalleryTabLazy = dynamic(() => import("./GalleryTabLazy"), {
  loading: () => <div className="h-96 w-full bg-slate-900/5 animate-pulse rounded-2xl" />,
});
const MetaPixelTabLazy = dynamic(() => import("./MetaPixelTabLazy"), {
  loading: () => <div className="h-96 w-full bg-slate-900/5 animate-pulse rounded-2xl" />,
});
const GoogleAdsTabLazy = dynamic(() => import("./GoogleAdsTabLazy"), {
  loading: () => <div className="h-96 w-full bg-slate-900/5 animate-pulse rounded-2xl" />,
});

interface CMSTabsContainerProps {
  contentPanel: React.ReactNode;
  faqPanel?: React.ReactNode;
  galleryPanel?: React.ReactNode;
  metaPixelPanel?: React.ReactNode;
  googleAdsPanel?: React.ReactNode;
}

/**
 * Contenedor de pestañas del CMS con persistencia de pestaña activa y carga diferida (lazy loading).
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
  const [visitedTabs, setVisitedTabs] = useState<Set<number>>(() => new Set([0]));

  useEffect(() => {
    // 1. Prioridad: parámetro en URL (?tab=faq, ?tab=galeria, ?tab=contenido, ?tab=meta-pixel, ?tab=google-ads)
    const tabParam = searchParams.get("tab")?.toLowerCase();
    let initialIndex = 0;

    if (tabParam === "faq" || tabParam === "1") {
      initialIndex = 1;
    } else if (tabParam === "gallery" || tabParam === "galeria" || tabParam === "2") {
      initialIndex = 2;
    } else if (
      tabParam === "meta-pixel" ||
      tabParam === "metapixel" ||
      tabParam === "pixel" ||
      tabParam === "3"
    ) {
      initialIndex = 3;
    } else if (
      tabParam === "google-ads" ||
      tabParam === "googleads" ||
      tabParam === "gads" ||
      tabParam === "4"
    ) {
      initialIndex = 4;
    } else if (tabParam === "content" || tabParam === "contenido" || tabParam === "0") {
      initialIndex = 0;
    } else {
      // 2. Persistencia en sessionStorage tras recargas de formulario
      const saved = sessionStorage.getItem("cms_selected_tab");
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (!isNaN(idx) && idx >= 0 && idx <= 4) {
          initialIndex = idx;
        }
        sessionStorage.removeItem("cms_selected_tab");
      }
    }

    setSelectedTab(initialIndex);
    setVisitedTabs((prev) => {
      const next = new Set(prev);
      next.add(initialIndex);
      return next;
    });
  }, [searchParams]);

  const handleTabChange = (index: number) => {
    setSelectedTab(index);
    setVisitedTabs((prev) => {
      const next = new Set(prev);
      next.add(index);
      return next;
    });
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
          <div className="mt-6">
            {faqPanel || ((selectedTab === 1 || visitedTabs.has(1)) && <FAQTabLazy />)}
          </div>
        </TabPanel>
        <TabPanel>
          <div className="mt-6">
            {galleryPanel || ((selectedTab === 2 || visitedTabs.has(2)) && <GalleryTabLazy />)}
          </div>
        </TabPanel>
        <TabPanel>
          <div className="mt-6">
            {metaPixelPanel || ((selectedTab === 3 || visitedTabs.has(3)) && <MetaPixelTabLazy />)}
          </div>
        </TabPanel>
        <TabPanel>
          <div className="mt-6">
            {googleAdsPanel || ((selectedTab === 4 || visitedTabs.has(4)) && <GoogleAdsTabLazy />)}
          </div>
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
}
