"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  TextInput,
  Button,
  Badge,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from "@tremor/react";
import {
  Search,
  RefreshCw,
  Ticket,
  Eye,
  Edit,
  UserCheck,
  FileText,
} from "lucide-react";
import CardStatusReportDialog from "./CardStatusReportDialog";

interface InventoryDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  cards: any[];
  loading: boolean;
  onReassignType: (card: any) => void;
  onRangeReassign: () => void;
  onRangePlayerReassign: () => void;
  onEditCard: (card: any) => void;
}

export default function InventoryDetailsDialog({
  isOpen,
  onClose,
  event,
  cards,
  loading,
  onReassignType,
  onRangeReassign,
  onRangePlayerReassign,
  onEditCard,
}: InventoryDetailsDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isReportOpen, setIsReportOpen] = useState(false);

  /**
   * Buscador multi-campo del inventario. Si el query es numérico corto
   * (<8 dígitos) solo se busca en N° Cartón y N° Factura: los teléfonos
   * con código de área tienen 11 dígitos y un número corto producía
   * falsos positivos por subcadena (ej. "368" dentro de 50368807991).
   * Con 8+ dígitos el query vuelve a considerar el teléfono.
   */
  const filteredCards = useMemo(() => {
    if (!searchQuery) return cards;
    const query = searchQuery.toLowerCase();
    const shortNumeric = /^\d{1,7}$/.test(query);
    return cards.filter((card) => {
      const cardNum = card.card_number.toString();
      const invoiceNum = (card.invoice_number || "").toLowerCase();
      if (shortNumeric) {
        return cardNum.includes(query) || invoiceNum.includes(query);
      }
      const cardType = (card.card_type || "").toLowerCase();
      const cardStatus = (card.card_status || "").toLowerCase();
      const soldBy = (card.sold_by || "").toLowerCase();
      const playerName = (card.player_name || "").toLowerCase();
      const playerPhone = (card.player_phone_number || "").toLowerCase();
      return (
        cardNum.includes(query) ||
        cardType.includes(query) ||
        cardStatus.includes(query) ||
        soldBy.includes(query) ||
        invoiceNum.includes(query) ||
        playerName.includes(query) ||
        playerPhone.includes(query)
      );
    });
  }, [cards, searchQuery]);

  return (
    <Dialog
      open={isOpen}
      onClose={() => {
        onClose();
        setSearchQuery("");
      }}
      static={true}
    >
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel className="max-w-7xl w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <Title className="text-larioja-azul dark:text-larioja-amarillo">
                  Inventario de Cartones
                </Title>
                <Text className="text-sm font-medium">Evento: {event?.event_name}</Text>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button
                  size="xs"
                  variant="secondary"
                  icon={FileText}
                  color="indigo"
                  onClick={() => setIsReportOpen(true)}
                  tooltip="Informe de cartones por estado en un rango (CSV/PDF)"
                >
                  Informe
                </Button>
                <Button size="xs" variant="secondary" icon={UserCheck} onClick={onRangePlayerReassign}>
                  Reasignar Jugador
                </Button>
                <Button size="xs" variant="secondary" icon={RefreshCw} onClick={onRangeReassign}>
                  Cambio en Rango
                </Button>
                <Badge color="blue" icon={Ticket}>
                  {cards.length} Totales
                </Badge>
              </div>
            </div>

            <TextInput
              placeholder="Buscar por N° Cartón, Factura, Estado, Jugador, Teléfono o Vendedor... (números cortos solo buscan cartón/factura)"
              icon={Search}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-larioja-azul"></div>
              <Text>Cargando inventario...</Text>
            </div>
          ) : filteredCards.length > 0 ? (
            <div className="max-h-[60vh] overflow-auto pr-2 custom-scrollbar">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>N° Cartón</TableHeaderCell>
                    <TableHeaderCell>Tipo</TableHeaderCell>
                    <TableHeaderCell>N° Factura</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell>Jugador</TableHeaderCell>
                    <TableHeaderCell>Teléfono</TableHeaderCell>
                    <TableHeaderCell>Vendido por</TableHeaderCell>
                    <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCards.map((card, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-bold text-larioja-azul dark:text-larioja-amarillo">
                        {card.card_number}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge size="xs" color={card.card_type === "Virtual" ? "blue" : "purple"}>
                            {card.card_type}
                          </Badge>
                          <Button
                            variant="light"
                            icon={RefreshCw}
                            size="xs"
                            onClick={() => onReassignType(card)}
                            tooltip={`Cambiar a ${card.card_type === "Virtual" ? "Fisico" : "Virtual"}`}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Text className="text-xs">{card.invoice_number || "—"}</Text>
                      </TableCell>
                      <TableCell>
                        <Badge
                          color={
                            card.card_status === "Vendido"
                              ? "emerald"
                              : card.card_status === "Asignado"
                                ? "blue"
                                : "gray"
                          }
                          size="xs"
                        >
                          {card.card_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Text className="text-xs">{card.player_name || "—"}</Text>
                      </TableCell>
                      <TableCell>
                        <Text className="text-xs">{card.player_phone_number || "—"}</Text>
                      </TableCell>
                      <TableCell>
                        <Text className="text-xs">{card.sold_by || "N/A"}</Text>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {card.image_url && (
                            <Button
                              variant="light"
                              icon={Eye}
                              size="xs"
                              onClick={() => window.open(card.image_url, "_blank")}
                              tooltip="Ver PDF"
                            />
                          )}
                          <Button
                            variant="light"
                            icon={Edit}
                            size="xs"
                            onClick={() => onEditCard(card)}
                            tooltip="Editar Cartón"
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-20 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
              <Ticket size={48} className="text-gray-200" />
              <Text className="text-gray-400 italic">
                {searchQuery
                  ? "No se encontraron cartones que coincidan con la búsqueda."
                  : "No hay cartones generados para este evento."}
              </Text>
            </div>
          )}

          <div className="flex justify-end mt-8">
            <Button
              variant="secondary"
              onClick={() => {
                onClose();
                setSearchQuery("");
              }}
            >
              Cerrar
            </Button>
          </div>
        </DialogPanel>
      </div>

      {/* Informe de cartones por estado en un rango (CSV/PDF) */}
      <CardStatusReportDialog
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        event={event}
      />
    </Dialog>
  );
}
