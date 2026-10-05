"use client";

import { useEffect, useState } from "react";
import InventoryDetailsDialog from "./InventoryDetailsDialog";
import ReassignCardDialog from "./ReassignCardDialog";
import RangeReassignDialog from "./RangeReassignDialog";
import RangePlayerReassignDialog from "./RangePlayerReassignDialog";
import EditCardDialog from "./EditCardDialog";

interface InventoryDialogsProps {
  /** Controla la visibilidad del diálogo principal de inventario. */
  isOpen: boolean;
  onClose: () => void;
  /** Evento cuyo inventario se muestra (company_id, event_id, event_name…). */
  event: any;
  countries: any[];
}

/**
 * Paquete reutilizable del diálogo "Inventario de Cartones" y sus
 * sub-diálogos (reasignar tipo, reasignar por rango, reasignar jugador
 * por rango, editar cartón). Encapsula la carga de cartones vía
 * `/api/bingo/cards` para que pueda abrirse desde varias pestañas
 * (Inventario de Cartones, Ventas y Facturación) sin duplicar lógica;
 * al cerrarse, el usuario vuelve a la pestaña que lo invocó.
 */
export default function InventoryDialogs({
  isOpen,
  onClose,
  event,
  countries,
}: InventoryDialogsProps) {
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Sub-dialog states
  const [isReassignOpen, setIsReassignOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [isRangeOpen, setIsRangeOpen] = useState(false);
  const [isRangePlayerOpen, setIsRangePlayerOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  /**
   * Inventario del evento vía /api/bingo/cards (JSON puro; la Server
   * Action equivalente re-renderizaba /admin/bingo completo).
   */
  const loadCards = async () => {
    if (!event) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/bingo/cards?companyId=${event.company_id}&eventId=${encodeURIComponent(event.event_id)}`,
      );
      const result = await res.json();
      if (typeof result === "object" && "data" in result) {
        setCards(result.data || []);
      }
    } catch (error) {
      console.error("Error loading cards:", error);
    } finally {
      setLoading(false);
    }
  };

  // Carga el inventario cada vez que se abre el diálogo.
  useEffect(() => {
    if (isOpen && event) void loadCards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, event?.event_id]);

  return (
    <>
      <InventoryDetailsDialog
        isOpen={isOpen}
        onClose={onClose}
        event={event}
        cards={cards}
        loading={loading}
        onReassignType={(card) => {
          setSelectedCard(card);
          setIsReassignOpen(true);
        }}
        onRangeReassign={() => setIsRangeOpen(true)}
        onRangePlayerReassign={() => setIsRangePlayerOpen(true)}
        onEditCard={(card) => {
          setSelectedCard(card);
          setIsEditOpen(true);
        }}
      />

      <ReassignCardDialog
        isOpen={isReassignOpen}
        onClose={() => setIsReassignOpen(false)}
        card={selectedCard}
        event={event}
        onSuccess={() => void loadCards()}
      />

      <RangeReassignDialog
        isOpen={isRangeOpen}
        onClose={() => setIsRangeOpen(false)}
        event={event}
        onSuccess={() => void loadCards()}
      />

      <RangePlayerReassignDialog
        isOpen={isRangePlayerOpen}
        onClose={() => setIsRangePlayerOpen(false)}
        event={event}
        cards={cards}
        countries={countries}
        onSuccess={() => void loadCards()}
      />

      <EditCardDialog
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        card={selectedCard}
        event={event}
        countries={countries}
        onSuccess={() => void loadCards()}
      />
    </>
  );
}
