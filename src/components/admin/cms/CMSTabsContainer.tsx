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
  Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { prefetchCmsTabs } from "@/lib/cms/tabs-prefetch";

// Indicador de carga con ruedita continua (spinner) para componentes dinámicos
function TabSpinnerFallback() {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500 dark:text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-larioja-azul dark:text-larioja-amarillo" />
      <span className="text-xs font-medium">Cargando contenido...</span>
    </div>
  );
}

// Importaciones dinámicas bajo demanda con spinner continuo
const FAQTabLazy = dynamic(() => import("./FAQTabLazy"), {
  loading: TabSpinnerFallback,
});
const GalleryTabLazy = dynamic(() => import("./GalleryTabLazy"), {
  loading: TabSpinnerFallback,
});
const MetaPixelTabLazy = dynamic(() => import("./MetaPixelTabLazy"), {
  loading: TabSpinnerFallback,
});
const GoogleAdsTabLazy = dynamic(() => import("./GoogleAdsTabLazy"), {
  loading: TabSpinnerFallback,
});

interface CMSTabsContainerProps {
  contentPanel: React.ReactNode;
  faqPanel?: React.ReactNode;
  galleryPanel?: React.ReactNode;
  metaPixelPanel?: React.ReactNode;
  googleAdsPanel?: React.ReactNode;
}

/**
 * Resuelve síncronamente el índice de la pestaña inicial a partir de los searchParams
 * o del almacenamiento de sesión si existiese.
 */
function resolveInitialTab(searchParams: ReturnType<typeof useSearchParams>): number {
  const tabParam = searchParams.get("tab")?.toLowerCase();

  if (tabParam === "faq" || tabParam === "1") {
    return 1;
  }
  if (tabParam === "gallery" || tabParam === "galeria" || tabParam === "2") {
    return 2;
  }
  if (
    tabParam === "meta-pixel" ||
    tabParam === "metapixel" ||
    tabParam === "pixel" ||
    tabParam === "3"
  ) {
    return 3;
  }
  if (
    tabParam === "google-ads" ||
    tabParam === "googleads" ||
    tabParam === "gads" ||
    tabParam === "4"
  ) {
    return 4;
  }
  if (tabParam === "content" || tabParam === "contenido" || tabParam === "0") {
    return 0;
  }

  // 2. Persistencia en sessionStorage tras recargas de formulario
  if (typeof window !== "undefined") {
    try {
      const saved = sessionStorage.getItem("cms_selected_tab");
      if (saved !== null) {
        const idx = parseInt(saved, 10);
        if (!isNaN(idx) && idx >= 0 && idx <= 4) {
          sessionStorage.removeItem("cms_selected_tab");
          return idx;
        }
      }
    } catch {
      // sessionStorage no disponible o restringido
    }
  }

  return 0;
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
  const [selectedTab, setSelectedTab] = useState<number>(() => resolveInitialTab(searchParams));
  const [visitedTabs, setVisitedTabs] = useState<Set<number>>(
    () => new Set([resolveInitialTab(searchParams)])
  );

  useEffect(() => {
    const currentTab = resolveInitialTab(searchParams);
    setSelectedTab(currentTab);
    setVisitedTabs((prev) => {
      if (prev.has(currentTab)) return prev;
      const next = new Set(prev);
      next.add(currentTab);
      return next;
    });
  }, [searchParams]);

  // Pre-carga en segundo plano de datos y componentes de pestañas secundarias en tiempo ocioso
  useEffect(() => {
    prefetchCmsTabs();

    if (typeof window !== "undefined") {
      const timer = setTimeout(() => {
        // Carga diferida de los chunks JS para 0 ms de latencia al hacer clic
        import("./FAQTabLazy");
        import("./GalleryTabLazy");
        import("./MetaPixelTabLazy");
        import("./GoogleAdsTabLazy");
      }, 200);
      return () => clearTimeout(timer);
    }
  }, []);

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
