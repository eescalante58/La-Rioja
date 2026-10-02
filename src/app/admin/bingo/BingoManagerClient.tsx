"use client";

import { useState, useEffect } from "react";
import {
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Title,
  Text,
} from "@tremor/react";
import {
  Calendar,
  Ticket,
  TrendingUp,
  Users,
  Dices,
  BookOpen,
} from "lucide-react";
import { callAction } from "@/lib/action-client";
import dynamic from "next/dynamic";
import Link from "next/link";

// Dynamic imports for sub-components
const EventsTab = dynamic(() => import("@/components/admin/bingo/EventsTab"), {
  loading: () => (
    <div className="h-96 w-full bg-slate-900/5 animate-pulse rounded-2xl" />
  ),
});
const InventoryTab = dynamic(
  () => import("@/components/admin/bingo/InventoryTab"),
  {
    loading: () => (
      <div className="h-96 w-full bg-slate-900/5 animate-pulse rounded-2xl" />
    ),
  },
);
const SalesTab = dynamic(() => import("@/components/admin/bingo/SalesTab"), {
  loading: () => (
    <div className="h-96 w-full bg-slate-900/5 animate-pulse rounded-2xl" />
  ),
});
const PromotionalTab = dynamic(
  () => import("@/components/admin/bingo/PromotionalTab"),
  {
    loading: () => (
      <div className="h-96 w-full bg-slate-900/5 animate-pulse rounded-2xl" />
    ),
  },
);
const WheelTab = dynamic(() => import("@/components/admin/bingo/WheelTab"), {
  loading: () => (
    <div className="h-96 w-full bg-slate-900/5 animate-pulse rounded-2xl" />
  ),
});
const EventDialog = dynamic(
  () => import("@/components/admin/bingo/EventDialog"),
);
const GenerateCardsDialog = dynamic(
  () => import("@/components/admin/bingo/GenerateCardsDialog"),
);
const UploadCardsDialog = dynamic(
  () => import("@/components/admin/bingo/UploadCardsDialog"),
);

interface Event {
  id: number;
  company_id: number;
  event_id: string;
  event_name: string;
  event_date: string;
  card_value: number;
  status: string;
  event_cartons_number?: number;
  event_start_promotion_date?: string;
  event_manager?: string;
  event_goal?: number;
}

interface Company {
  company_id: number;
  company_name: string;
  /** Evento por defecto de la empresa (companies.def_dash_event_id). */
  def_dash_event_id?: string | null;
}

interface Country {
  name: string;
  phone_code: string;
  flag_emoji: string;
  iso2: string;
}

export default function BingoManagerClient({
  initialEvents,
  companies,
  countries,
  selectedCompanyId,
}: {
  initialEvents: Event[];
  companies: Company[];
  countries: Country[];
  selectedCompanyId?: number;
}) {
  const [events] = useState(initialEvents);

  /**
   * Evento por defecto de la empresa activa (companies.def_dash_event_id).
   * Las pestañas con selector de evento (Ventas, Sorteos/Juegos) lo
   * preseleccionan al entrar; el usuario puede cambiarlo manualmente.
   */
  const defaultEvent = (() => {
    const target = selectedCompanyId
      ? companies.filter((c) => c.company_id === selectedCompanyId)
      : companies;
    for (const c of target) {
      if (!c.def_dash_event_id) continue;
      const ev = events.find(
        (e) =>
          e.company_id === c.company_id &&
          e.event_id === c.def_dash_event_id,
      );
      if (ev) return ev;
    }
    return null;
  })();
  const [selectedTab, setSelectedTab] = useState(0);
  const [isEventDialogOpen, setIsEventEventDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEventForCards, setSelectedEventForCards] =
    useState<Event | null>(null);
  const [uploadConfig, setUploadConfig] = useState<{
    start: number;
    end: number;
    price: number;
    cardType: "Virtual" | "Fisico";
    deleteExisting: boolean;
  } | null>(null);

  // Persistence for the selected tab
  useEffect(() => {
    const savedTab = sessionStorage.getItem("bingo_selected_tab");
    if (savedTab !== null) {
      setSelectedTab(parseInt(savedTab));
      sessionStorage.removeItem("bingo_selected_tab");
    }
  }, []);

  const handleOpenDialog = (event?: Event) => {
    setEditingEvent(event || null);
    setIsEventEventDialogOpen(true);
  };

  const handleDeleteEvent = async (id: number) => {
    if (
      confirm(
        "¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.",
      )
    ) {
      const result = await callAction<{ success?: boolean; error?: string }>(
        "bingo.deleteEvent",
        [id],
      );
      if (result.success) {
        window.location.reload();
      } else {
        alert("Error: " + result.error);
      }
    }
  };

  return (
    <div className="space-y-6 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
          <Title className="text-2xl font-black text-larioja-azul dark:text-white uppercase tracking-tight">
            Gestión de Bingo
          </Title>
          <Text className="text-sm mt-1 text-gray-500 dark:text-gray-400">
            Administra eventos de bingo, inventario de cartones y facturación de
            ventas del sistema.
          </Text>
        </div>
        {/* Manual de usuario del módulo: pestaña nueva para no perder el
            estado de la pestaña activa de Gestión de Bingo. */}
        <Link
          href="/admin/bingo/manual"
          target="_blank"
          className="inline-flex items-center gap-2 rounded-lg border border-larioja-azul/30 px-4 py-2 text-sm font-bold text-larioja-azul transition-colors hover:bg-larioja-azul/10 dark:border-larioja-amarillo/40 dark:text-larioja-amarillo dark:hover:bg-larioja-amarillo/10"
        >
          <BookOpen size={18} />
          Manual de Usuario
        </Link>
      </div>

      <TabGroup index={selectedTab} onIndexChange={setSelectedTab}>
        {/* En móvil la barra de pestañas desborda el viewport: scroll
            horizontal con desplazamiento por deslizamiento. */}
        <TabList className="mt-8 overflow-x-auto whitespace-nowrap custom-scrollbar">
          <Tab icon={Calendar} className="text-sm sm:text-lg whitespace-nowrap">
            Eventos
          </Tab>
          <Tab icon={Ticket} className="text-sm sm:text-lg whitespace-nowrap">
            Inventario de Cartones
          </Tab>
          <Tab icon={TrendingUp} className="text-sm sm:text-lg whitespace-nowrap">
            Ventas y Facturación
          </Tab>
          <Tab icon={Users} className="text-sm sm:text-lg whitespace-nowrap">
            Mensajes Promocionales
          </Tab>
          <Tab icon={Dices} className="text-sm sm:text-lg whitespace-nowrap">
            Sorteos/Juegos
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <EventsTab
              events={events}
              onNewEvent={() => handleOpenDialog()}
              onEditEvent={handleOpenDialog}
              onDeleteEvent={handleDeleteEvent}
              onGenerateCards={(event) => {
                setSelectedEventForCards(event);
                setIsGenerateDialogOpen(true);
              }}
            />
          </TabPanel>

          <TabPanel>
            <InventoryTab
              events={events}
              countries={countries}
              onGenerateCards={(event) => {
                setSelectedEventForCards(event);
                setIsGenerateDialogOpen(true);
              }}
            />
          </TabPanel>

          <TabPanel>
            <SalesTab
              events={events}
              countries={countries}
              defaultEvent={defaultEvent}
            />
          </TabPanel>

          <TabPanel>
            <PromotionalTab
              companyId={selectedCompanyId ?? companies[0]?.company_id}
            />
          </TabPanel>

          <TabPanel>
            <WheelTab events={events} defaultEvent={defaultEvent} />
          </TabPanel>
        </TabPanels>
      </TabGroup>

      <EventDialog
        isOpen={isEventDialogOpen}
        onClose={() => setIsEventEventDialogOpen(false)}
        event={editingEvent}
        companies={companies}
      />

      <GenerateCardsDialog
        isOpen={isGenerateDialogOpen}
        onClose={() => setIsGenerateDialogOpen(false)}
        event={selectedEventForCards}
        onOpenUpload={(config) => {
          setUploadConfig(config);
          setIsGenerateDialogOpen(false);
          setIsUploadDialogOpen(true);
        }}
      />

      <UploadCardsDialog
        isOpen={isUploadDialogOpen}
        onClose={() => {
          setIsUploadDialogOpen(false);
          setUploadConfig(null);
        }}
        event={selectedEventForCards}
        initialConfig={uploadConfig}
      />
    </div>
  );
}
