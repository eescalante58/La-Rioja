"use client";

import { useState } from "react";
import { Card, Title, Text, Button, Badge } from "@tremor/react";
import InventoryDialogs from "./InventoryDialogs";
import type { CountryCode } from "@/types/bingo";

interface Event {
  id: number;
  company_id: number;
  event_id: string;
  event_name: string;
  event_date: string;
  card_value: number;
  status: string;
  event_cartons_number?: number;
}

interface InventoryTabProps {
  events: Event[];
  countries: CountryCode[];
  onGenerateCards: (event: Event) => void;
}

export default function InventoryTab({
  events,
  countries,
  onGenerateCards,
}: InventoryTabProps) {
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleViewDetails = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailsOpen(true);
  };

  return (
    <>
      <Card className="mt-4 shadow-sm sm:shadow-md border-gray-200 dark:border-gray-800 transition-all duration-300">
        <Title>Inventario por Evento</Title>
        <Text className="mb-6">
          Selecciona un evento para gestionar sus cartones.
        </Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {events.map((ev) => (
            <Card
              key={ev.id}
              className="hover:shadow-md transition-all duration-300 cursor-pointer bg-white dark:bg-black border border-gray-100 dark:border-gray-800"
            >
              <div className="flex justify-between items-start">
                <div>
                  <Text className="font-bold text-larioja-azul">
                    {ev.event_name}
                  </Text>
                  <Text className="text-xs">Fecha: {ev.event_date}</Text>
                </div>
                <Badge size="xs" color="blue">
                  Cartones: {ev.event_cartons_number || 0}
                </Badge>
              </div>
              <div className="mt-4 flex flex-col gap-2">
                <Button
                  size="xs"
                  variant="secondary"
                  className="w-full"
                  onClick={() => handleViewDetails(ev)}
                >
                  Ver Detalles
                </Button>
                <Button
                  size="sm"
                  className="w-full bg-larioja-verde hover:bg-emerald-600 border-none shadow-sm"
                  onClick={() => onGenerateCards(ev)}
                >
                  Cargar Cartones
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {/* Diálogo de inventario + sub-diálogos (compartido con SalesTab) */}
      <InventoryDialogs
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        event={selectedEvent}
        countries={countries}
      />
    </>
  );
}
