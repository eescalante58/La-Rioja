"use client";

import {
  Card,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Text,
  Title,
  Button,
  Badge,
} from "@tremor/react";
import {
  Plus,
  Ticket,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

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

interface EventsTabProps {
  events: Event[];
  onNewEvent: () => void;
  onEditEvent: (event: Event) => void;
  onDeleteEvent: (id: number) => void;
  onGenerateCards: (event: Event) => void;
}

export default function EventsTab({
  events,
  onNewEvent,
  onEditEvent,
  onDeleteEvent,
  onGenerateCards,
}: EventsTabProps) {
  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <Card className="mt-4 shadow-sm sm:shadow-md border-gray-200 dark:border-gray-800 transition-all duration-300">
      <div className="flex justify-between items-center mb-6">
        <Title>Listado de Eventos</Title>
        <Button icon={Plus} onClick={onNewEvent} className="bg-larioja-azul">
          Nuevo Evento
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Evento</TableHeaderCell>
              <TableHeaderCell>Fecha</TableHeaderCell>
              <TableHeaderCell>Valor Cartón</TableHeaderCell>
              <TableHeaderCell>Cartones</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <Text className="font-bold">{event.event_name}</Text>
                    <Text className="text-xs opacity-60">
                      ID: {event.event_id}
                    </Text>
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(event.event_date).toLocaleDateString()}
                </TableCell>
                <TableCell>{formatCurrency(event.card_value)}</TableCell>
                <TableCell>
                  <Text className="font-medium">
                    {event.event_cartons_number
                      ? new Intl.NumberFormat("en-US").format(
                          event.event_cartons_number,
                        )
                      : "0"}
                  </Text>
                </TableCell>
                <TableCell>
                  <Badge
                    color={
                      event.status === "Activo"
                        ? "emerald"
                        : event.status === "Realizado"
                          ? "blue"
                          : event.status === "Cancelado"
                            ? "rose"
                            : "gray"
                    }
                    icon={
                      event.status === "Activo"
                        ? CheckCircle
                        : event.status === "Realizado"
                          ? CheckCircle
                          : AlertCircle
                    }
                  >
                    {event.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="light"
                      icon={Ticket}
                      size="xs"
                      onClick={() => onGenerateCards(event)}
                      tooltip="Generar Cartones"
                    />
                    <Button
                      variant="light"
                      icon={Edit}
                      size="xs"
                      onClick={() => onEditEvent(event)}
                    />
                    <Button
                      variant="light"
                      icon={Trash2}
                      size="xs"
                      color="rose"
                      onClick={() => onDeleteEvent(event.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
