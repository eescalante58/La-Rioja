"use client";

import { useState } from "react";
import {
  Card,
  Title,
  Text,
  Button,
  Select,
  SelectItem,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
} from "@tremor/react";
import { Plus, TrendingUp, Eye } from "lucide-react";
import { getInvoices, deleteInvoice } from "@/app/admin/bingo/actions";
import InvoiceDetailsDialog from "./InvoiceDetailsDialog";
import NewInvoiceDialog from "./NewInvoiceDialog";
import WhatsAppPopup from "./WhatsAppPopup";

interface Event {
  id: number;
  company_id: number;
  event_id: string;
  event_name: string;
  card_value: number;
}

interface SalesTabProps {
  events: Event[];
  countries: any[];
}

export default function SalesTab({ events, countries }: SalesTabProps) {
  const [currentEventInfo, setCurrentEventInfo] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog states
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  const loadInvoices = async (companyId: number, eventId: string) => {
    setLoading(true);
    try {
      const result = await getInvoices(companyId, eventId);
      if (result.success) {
        setInvoices(result.data || []);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta factura?")) return;
    const result = await deleteInvoice(id);
    if (result.success) {
      alert("Factura eliminada");
      setIsDetailsOpen(false);
      if (currentEventInfo)
        loadInvoices(currentEventInfo.companyId, currentEventInfo.eventId);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <>
      <Card className="mt-4 shadow-sm sm:shadow-md border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <Title>Ventas y Facturación</Title>
          {currentEventInfo && (
            <Button
              icon={Plus}
              onClick={() => {
                setSelectedInvoice(null);
                setIsNewInvoiceOpen(true);
              }}
              className="bg-larioja-azul"
            >
              Nueva Factura
            </Button>
          )}
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">
                Filtrar por Evento
              </Text>
              <Select
                placeholder="Selecciona un evento..."
                onValueChange={(val) => {
                  const [cId, eId] = val.split("|");
                  const event = events.find(
                    (e) => e.company_id === parseInt(cId) && e.event_id === eId,
                  );
                  if (event) {
                    setCurrentEventInfo({
                      companyId: event.company_id,
                      eventId: event.event_id,
                      cardValue: event.card_value,
                    });
                    loadInvoices(event.company_id, event.event_id);
                  }
                }}
              >
                {events.map((ev) => (
                  <SelectItem
                    key={`${ev.company_id}-${ev.event_id}`}
                    value={`${ev.company_id}|${ev.event_id}`}
                  >
                    {ev.event_id} - {ev.event_name}
                  </SelectItem>
                ))}
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-larioja-azul mx-auto mb-4"></div>
              <Text>Cargando facturas...</Text>
            </div>
          ) : invoices.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>N° Factura</TableHeaderCell>
                    <TableHeaderCell>Fecha</TableHeaderCell>
                    <TableHeaderCell>Cliente</TableHeaderCell>
                    <TableHeaderCell>Pago</TableHeaderCell>
                    <TableHeaderCell>Total</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell className="text-right">
                      Acciones
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((inv) => (
                    <TableRow
                      key={inv.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                      onClick={() => {
                        setSelectedInvoice(inv);
                        setIsDetailsOpen(true);
                      }}
                    >
                      <TableCell className="font-bold text-larioja-azul">
                        {inv.invoice_number}
                      </TableCell>
                      <TableCell>
                        {new Date(inv.invoice_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{inv.customer_name}</TableCell>
                      <TableCell className="capitalize">
                        {inv.payment_method}
                      </TableCell>
                      <TableCell className="font-bold">
                        {formatCurrency(inv.total_amount)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          color={inv.status === "pagada" ? "emerald" : "amber"}
                          size="xs"
                        >
                          {inv.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="light" icon={Eye} size="xs" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-20 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
              <TrendingUp size={48} className="mx-auto text-gray-300 mb-4" />
              <Text className="text-gray-500">
                No hay facturas o selecciona un evento.
              </Text>
            </div>
          )}
        </div>
      </Card>

      <InvoiceDetailsDialog
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        invoice={selectedInvoice}
        onEdit={(inv) => {
          setSelectedInvoice(inv);
          setIsDetailsOpen(false);
          setIsNewInvoiceOpen(true);
        }}
        onDelete={handleDelete}
        onWhatsApp={(inv) => {
          setSelectedInvoice(inv);
          setIsWhatsAppOpen(true);
        }}
      />

      <NewInvoiceDialog
        isOpen={isNewInvoiceOpen}
        onClose={() => setIsNewInvoiceOpen(false)}
        invoice={selectedInvoice}
        currentEvent={currentEventInfo}
        countries={countries}
        onSuccess={() =>
          currentEventInfo &&
          loadInvoices(currentEventInfo.companyId, currentEventInfo.eventId)
        }
        onWhatsApp={(inv) => {
          setSelectedInvoice(inv);
          setIsWhatsAppOpen(true);
        }}
      />

      <WhatsAppPopup
        isOpen={isWhatsAppOpen}
        onClose={() => setIsWhatsAppOpen(false)}
        invoice={selectedInvoice}
      />
    </>
  );
}
