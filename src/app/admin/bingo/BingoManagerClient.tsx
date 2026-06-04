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
import { Calendar, Ticket, TrendingUp, Users } from "lucide-react";
import { deleteEvent } from "./actions";
import dynamic from "next/dynamic";

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
}: {
  initialEvents: Event[];
  companies: Company[];
  countries: Country[];
}) {
  const [events] = useState(initialEvents);
  const [selectedTab, setSelectedTab] = useState(0);
  const [isEventDialogOpen, setIsEventEventDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEventForCards, setSelectedEventForCards] =
    useState<Event | null>(null);

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
      const result = await deleteEvent(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert("Error: " + result.error);
      }
    }
  };

  return (
    <div className="space-y-6 px-6">
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
      </div>

      <TabGroup index={selectedTab} onIndexChange={setSelectedTab}>
        <TabList className="mt-8">
          <Tab icon={Calendar}>Eventos</Tab>
          <Tab icon={Ticket}>Inventario de Cartones</Tab>
          <Tab icon={TrendingUp}>Ventas y Facturación</Tab>
          <Tab icon={Users}>Mensajes Promocionales</Tab>
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
            <SalesTab events={events} countries={countries} />
          </TabPanel>

          <TabPanel>
            <PromotionalTab companyId={companies[0]?.company_id} />
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
        onOpenUpload={() => {
          setIsGenerateDialogOpen(false);
          setIsUploadDialogOpen(true);
        }}
      />

      <UploadCardsDialog
        isOpen={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        event={selectedEventForCards}
      />
    </div>
  );
}
