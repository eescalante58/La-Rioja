"use client";

import { useState } from "react";
import {
  Card,
  Title,
  Text,
  Button,
  Select,
  SelectItem,
  TextInput,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
} from "@tremor/react";
import { Plus, TrendingUp, Eye, Edit, Trash2, PlusSquare, Search } from "lucide-react";
import { getInvoices, deleteInvoice } from "@/app/admin/bingo/actions";
import InvoiceDetailsDialog from "./InvoiceDetailsDialog";
import NewInvoiceDialog from "./NewInvoiceDialog";
import NewInvoicePlusDialog from "./NewInvoicePlusDialog";
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
  const [invoiceSearch, setInvoiceSearch] = useState("");

  // Dialog states
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [isNewInvoicePlusOpen, setIsNewInvoicePlusOpen] = useState(false);
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
    if (
      !confirm(
        "¿Eliminar esta factura? Los cartones asociados serán liberados.",
      )
    )
      return;
    const result = await deleteInvoice(id);
    if (result.success) {
      alert("Factura eliminada");
      setIsDetailsOpen(false);
      if (currentEventInfo)
        loadInvoices(currentEventInfo.companyId, currentEventInfo.eventId);
    } else {
      alert("Error al eliminar: " + (result.error || "desconocido"));
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  /**
   * Normaliza un valor para comparación de búsqueda (minúsculas, sin espacios extra).
   * @param value Valor a normalizar.
   * @returns Cadena normalizada.
   */
  const normalize = (value: any) => String(value ?? "").toLowerCase().trim();

  /**
   * Facturas filtradas por el término de búsqueda. Coincide contra:
   * número de factura, cliente, gestor, teléfono, WhatsApp, email y monto
   * (tanto en formato numérico como en formato monetario).
   */
  const searchTerm = normalize(invoiceSearch).replace(/[$,\s]/g, "");
  const filteredInvoices = invoices.filter((inv) => {
    if (!searchTerm) return true;
    const amountRaw = inv.total_amount != null ? String(Number(inv.total_amount)) : "";
    const amountFormatted =
      inv.total_amount != null ? formatCurrency(Number(inv.total_amount)) : "";
    const haystack = [
      inv.invoice_number,
      inv.customer_name,
      inv.manager_name,
      inv.phone_number,
      `${inv.phone_area || ""}${inv.phone_number || ""}`,
      inv.whatsapp_number,
      inv.customer_email,
      amountRaw,
      amountFormatted,
    ];
    return haystack.some((field) =>
      normalize(field).replace(/[$,\s]/g, "").includes(searchTerm),
    );
  });

  return (
    <>
      <Card className="mt-4 shadow-sm sm:shadow-md border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <Title>Ventas y Facturación</Title>
          {currentEventInfo && (
            <div className="flex flex-col gap-2">
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
              <Button
                icon={PlusSquare}
                onClick={() => {
                  setSelectedInvoice(null);
                  setIsNewInvoicePlusOpen(true);
                }}
                className="bg-larioja-azul"
              >
                Nueva Factura Plus
              </Button>
            </div>
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
                    setInvoiceSearch("");
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
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">
                Buscar Factura
              </Text>
              <TextInput
                icon={Search}
                placeholder="N° factura, cliente, gestor, teléfono, email o monto..."
                value={invoiceSearch}
                onValueChange={setInvoiceSearch}
                disabled={invoices.length === 0}
              />
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
                  {filteredInvoices.length > 0 ? (
                    filteredInvoices.map((inv) => (
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
                        {/* "YYYY-MM-DD" se interpreta como UTC; se fuerza
                            hora local para no mostrar el día anterior */}
                        {new Date(`${inv.invoice_date}T12:00:00`).toLocaleDateString("es-SV")}
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
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="light"
                            icon={Eye}
                            size="xs"
                            tooltip="Ver detalles"
                          />
                          <Button
                            variant="light"
                            icon={Edit}
                            size="xs"
                            tooltip="Editar factura"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedInvoice(inv);
                              setIsNewInvoiceOpen(true);
                            }}
                          />
                          <Button
                            variant="light"
                            icon={Trash2}
                            size="xs"
                            color="rose"
                            tooltip="Eliminar factura"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(inv.id);
                            }}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center italic py-8 text-gray-400"
                      >
                        Sin resultados para "{invoiceSearch}".
                      </TableCell>
                    </TableRow>
                  )}
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

      <NewInvoicePlusDialog
        isOpen={isNewInvoicePlusOpen}
        onClose={() => setIsNewInvoicePlusOpen(false)}
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
