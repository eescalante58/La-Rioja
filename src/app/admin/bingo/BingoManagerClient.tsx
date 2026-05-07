"use client";

import { useState, useMemo, useEffect } from "react";
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
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  TextInput,
  Select,
  SelectItem,
  Dialog,
  DialogPanel,
} from "@tremor/react";
import {
  Plus,
  Edit,
  Trash2,
  Ticket,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Hash,
  DollarSign,
  Eye,
  Upload,
  FileIcon,
  RefreshCw,
  Search,
  ExternalLink,
} from "lucide-react";
import {
  saveEvent,
  generateCards,
  getEventCards,
  deleteEvent,
  getInvoices,
  saveInvoice,
  updateInvoice,
  deleteInvoice,
  uploadCardImages,
  updateCardType,
  updateCardRangeType,
  updateSingleCard,
} from "./actions";

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

/**
 * Helper to format currency values.
 */
const formatCurrency = (value: number | undefined | null) => {
  if (value === undefined || value === null) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

/**
 * Main Client Component for Bingo Management.
 */
export default function BingoManagerClient({
  initialEvents,
  companies,
  countries,
}: {
  initialEvents: Event[];
  companies: Company[];
  countries: Country[];
}) {
  const [events, setEvents] = useState(initialEvents);
  const [statusValue, setStatusValue] = useState<string>("Inactivo");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [isEventDialogOpen, setIsEventEventDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<FileList | null>(null);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEventForCards, setSelectedEventForCards] =
    useState<Event | null>(null);
  const [isInventoryDetailsDialogOpen, setIsInventoryDetailsDialogOpen] =
    useState(false);
  const [eventCards, setEventCards] = useState<any[]>([]);
  const [loadingEventCards, setLoadingEventCards] = useState(false);
  const [loading, setLoading] = useState(false);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isNewInvoiceDialogOpen, setIsNewInvoiceDialogOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<any>(null);
  const [isReassignDialogOpen, setIsReassignDialogOpen] = useState(false);
  const [selectedCardForReassign, setSelectedCardForReassign] =
    useState<any>(null);
  const [officialName, setOfficialName] = useState("");
  const [selectedTab, setSelectedTab] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [isRangeReassignDialogOpen, setIsRangeReassignDialogOpen] =
    useState(false);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(1);
  const [rangeNewType, setRangeNewType] = useState("Virtual");
  const [isEditCardDialogOpen, setIsEditCardDialogOpen] = useState(false);
  const [selectedCardForEdit, setSelectedCardForEdit] = useState<any>(null);
  const [editCardPhoneArea, setEditCardPhoneArea] = useState("+503");
  const [editCardPhoneNumber, setEditCardPhoneNumber] = useState("");

  // Persistence for the selected tab
  useEffect(() => {
    const savedTab = sessionStorage.getItem("bingo_selected_tab");
    if (savedTab !== null) {
      setSelectedTab(parseInt(savedTab));
      sessionStorage.removeItem("bingo_selected_tab");
    }
  }, []);

  const [cardsNumber, setCardsNumber] = useState<number>(1);
  const [cardPrice, setCardPrice] = useState<number>(0);
  const [currentEventInfo, setCurrentEventInfo] = useState<{
    companyId: number;
    eventId: string;
    cardValue: number;
  } | null>(null);

  // Formatting helpers for inputs
  const [cardValueStr, setCardValueStr] = useState("");
  const [eventGoalStr, setEventGoalStr] = useState("");

  const formatInputCurrency = (value: string) => {
    // Remove everything except numbers
    const numeric = value.replace(/\D/g, "");

    // If empty or just zeros, return formatted zero or empty to allow backspace
    if (!numeric || parseInt(numeric) === 0) return "";

    // Format as currency
    const amount = parseFloat(numeric) / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleCurrencyChange = (value: string, setter: (v: string) => void) => {
    // If the user cleared the input, allow it
    if (!value) {
      setter("");
      return;
    }
    setter(formatInputCurrency(value));
  };

  const handleFetchInvoices = async (companyId: number, eventId: string) => {
    setLoadingInvoices(true);
    try {
      const result = await getInvoices(companyId, eventId);
      if (result.success) {
        setInvoices(result.data || []);
      } else {
        console.error("Error fetching invoices:", result.error);
      }
    } catch (error) {
      console.error("Error fetching invoices:", error);
    } finally {
      setLoadingInvoices(false);
    }
  };

  const handleViewInvoiceDetails = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsInvoiceDialogOpen(true);
  };

  const handleViewInventoryDetails = async (event: Event) => {
    setSelectedEventForCards(event);
    setIsInventoryDetailsDialogOpen(true);
    setLoadingEventCards(true);
    try {
      const result = await getEventCards(event.company_id, event.event_id);
      if (typeof result === "object" && "data" in result) {
        setEventCards(result.data || []);
      } else if (typeof result === "object" && "error" in result) {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      alert("Error al cargar el inventario.");
    } finally {
      setLoadingEventCards(false);
    }
  };

  const handleOpenNewInvoice = () => {
    setEditingInvoice(null);
    if (currentEventInfo) {
      setCardPrice(currentEventInfo.cardValue);
      setCardsNumber(1);
    }
    setIsNewInvoiceDialogOpen(true);
  };

  const handleEditInvoice = (invoice: any) => {
    setEditingInvoice(invoice);
    setCardPrice(invoice.card_price);
    setCardsNumber(invoice.cards_number);
    setIsInvoiceDialogOpen(false);
    setIsNewInvoiceDialogOpen(true);
  };

  const handleDeleteInvoice = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta factura?")) {
      setLoading(true);
      const result = await deleteInvoice(id);
      if (result.success) {
        if (currentEventInfo) {
          handleFetchInvoices(
            currentEventInfo.companyId,
            currentEventInfo.eventId,
          );
        }
        setIsInvoiceDialogOpen(false);
        alert("Factura eliminada exitosamente");
      } else {
        alert("Error: " + result.error);
      }
      setLoading(false);
    }
  };

  const filteredCards = useMemo(() => {
    if (!searchQuery) return eventCards;
    const query = searchQuery.toLowerCase();
    return eventCards.filter((card) => {
      const cardNum = card.card_number.toString();
      const cardType = (card.card_type || "").toLowerCase();
      const cardStatus = (card.card_status || "").toLowerCase();
      const soldBy = (card.sold_by || "").toLowerCase();
      return (
        cardNum.includes(query) ||
        cardType.includes(query) ||
        cardStatus.includes(query) ||
        soldBy.includes(query)
      );
    });
  }, [eventCards, searchQuery]);

  const handleReassignType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedCardForReassign || !selectedEventForCards) return;

    setLoading(true);
    const newType =
      selectedCardForReassign.card_type === "Virtual" ? "Fisico" : "Virtual";

    const result = await updateCardType(
      selectedEventForCards.company_id,
      selectedEventForCards.event_id,
      selectedCardForReassign.card_number,
      newType,
      officialName,
    );

    if (result.success) {
      alert(`Tipo de cartón cambiado a ${newType} exitosamente.`);
      setIsReassignDialogOpen(false);
      setOfficialName("");
      // Refresh the card list in the details dialog
      handleViewInventoryDetails(selectedEventForCards);
    } else {
      alert("Error: " + result.error);
    }
    setLoading(false);
  };

  const handleRangeReassignType = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (!selectedEventForCards) return;

    setLoading(true);
    const result = await updateCardRangeType(
      selectedEventForCards.company_id,
      selectedEventForCards.event_id,
      rangeStart,
      rangeEnd,
      rangeNewType,
      officialName,
    );

    if (result.success) {
      alert(
        `Se actualizaron ${result.updated_count} cartones a ${rangeNewType} exitosamente.`,
      );
      setIsRangeReassignDialogOpen(false);
      setOfficialName("");
      handleViewInventoryDetails(selectedEventForCards);
    } else {
      alert("Error: " + result.error);
    }
    setLoading(false);
  };

  const handleUpdateSingleCard = async (
    e: React.FormEvent<HTMLFormElement>,
  ) => {
    e.preventDefault();
    if (!selectedCardForEdit || !selectedEventForCards) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await updateSingleCard(
      selectedEventForCards.company_id,
      selectedEventForCards.event_id,
      selectedCardForEdit.card_number,
      formData,
    );

    if (result.success) {
      alert("Cartón actualizado exitosamente.");
      setIsEditCardDialogOpen(false);
      setSelectedCardForEdit(null);
      handleViewInventoryDetails(selectedEventForCards);
    } else {
      alert("Error: " + result.error);
    }
    setLoading(false);
  };

  const handleSaveInvoice = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = editingInvoice
      ? await updateInvoice(formData)
      : await saveInvoice(formData);

    if (result.success) {
      if (currentEventInfo) {
        handleFetchInvoices(
          currentEventInfo.companyId,
          currentEventInfo.eventId,
        );
      }
      setIsNewInvoiceDialogOpen(false);
      setEditingInvoice(null);
      alert(
        editingInvoice
          ? "Factura actualizada exitosamente"
          : "Factura guardada exitosamente",
      );
    } else {
      alert("Error: " + result.error);
    }
    setLoading(false);
  };

  const handleOpenDialog = (event?: Event) => {
    if (event) {
      setEditingEvent(event);
      setStatusValue(event.status || "Inactivo");
      setSelectedCompany(event.company_id.toString());
      setCardValueStr(formatCurrency(event.card_value));
      setEventGoalStr(formatCurrency(event.event_goal));
    } else {
      setEditingEvent(null);
      setStatusValue("Inactivo");
      setSelectedCompany(companies[0]?.company_id.toString() || "");
      setCardValueStr("");
      setEventGoalStr("");
    }
    setIsEventEventDialogOpen(true);
  };

  const handleDeleteEvent = async (id: number) => {
    if (
      confirm(
        "¿Estás seguro de eliminar este evento? Esta acción no se puede deshacer.",
      )
    ) {
      setLoading(true);
      const result = await deleteEvent(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert("Error: " + result.error);
        setLoading(false);
      }
    }
  };

  const handleSaveEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await saveEvent(formData);

    if (result.success) {
      window.location.reload();
    } else {
      alert("Error: " + result.error);
      setLoading(false);
    }
  };

  const handleGenerateCards = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEventForCards) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const start = parseInt(formData.get("start") as string);
    const end = parseInt(formData.get("end") as string);
    const price = parseFloat(formData.get("price") as string);
    const deleteExisting = formData.get("delete_existing") === "on";

    if (end - start + 1 > 5000) {
      alert("Por seguridad, no puedes generar más de 5,000 cartones por lote.");
      setLoading(false);
      return;
    }

    const message = deleteExisting
      ? `¿Estás seguro de ELIMINAR TODOS los cartones existentes de este evento y generar ${end - start + 1} cartones nuevos? Esta acción no se puede deshacer.`
      : `¿Estás seguro de generar ${end - start + 1} cartones? Si ya existen en este rango, sus valores se actualizarán.`;

    if (confirm(message)) {
      const result = await generateCards(
        selectedEventForCards.company_id,
        selectedEventForCards.event_id,
        start,
        end,
        price,
        deleteExisting,
      );

      if (result.success) {
        alert("Cartones generados exitosamente");
        setIsGenerateDialogOpen(false);
        sessionStorage.setItem("bingo_selected_tab", "1");
        window.location.reload();
      } else {
        alert("Error: " + result.error);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  const handleUploadCards = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (
      !selectedEventForCards ||
      !uploadingFiles ||
      uploadingFiles.length === 0
    ) {
      alert("Por favor selecciona los archivos PDF.");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    // Add files to the same formData to include the checkbox value
    for (let i = 0; i < uploadingFiles.length; i++) {
      formData.append("files", uploadingFiles[i]);
    }

    const price = parseFloat(
      (e.currentTarget.elements.namedItem("card_price") as HTMLInputElement)
        .value,
    );
    const deleteExisting = formData.get("delete_existing_upload") === "on";

    const confirmMessage = deleteExisting
      ? `¿Estás seguro de ELIMINAR los cartones disponibles existentes y subir estos ${uploadingFiles.length} nuevos?`
      : `¿Deseas subir estos ${uploadingFiles.length} cartones?`;

    if (!confirm(confirmMessage)) {
      setLoading(false);
      return;
    }

    const result = await uploadCardImages(
      selectedEventForCards.company_id,
      selectedEventForCards.event_id,
      price,
      formData,
    );

    if ("success_count" in result && result.success_count > 0) {
      let message = `Se cargaron exitosamente ${result.success_count} cartones.`;
      if (result.error_count > 0) {
        message +=
          `\nHubo ${result.error_count} errores:\n` +
          result.errors.slice(0, 5).join("\n");
      }
      alert(message);
      setIsUploadDialogOpen(false);
      setIsGenerateDialogOpen(false);
      setUploadingFiles(null);
      // We use reload to refresh all server data, but we could also use router.refresh()
      // To persist the tab, we can use sessionStorage
      sessionStorage.setItem("bingo_selected_tab", "1");
      window.location.reload();
    } else if ("errors" in result) {
      alert("Error al cargar cartones:\n" + result.errors.join("\n"));
    } else if ("error" in result) {
      alert("Error: " + result.error);
    }
    setLoading(false);
  };

  console.log("BingoManagerClient rendered - Version check 2");

  return (
    <div className="space-y-6 px-6">
      <div className="flex items-center justify-between">
        <div>
          <Title className="text-lg font-bold text-larioja-azul/80 dark:text-larioja-amarillo/80">
            Gestión de Bingo
          </Title>
          <Text className="text-xs">
            Administra eventos, cartones y ventas del sistema.
          </Text>
        </div>
      </div>

      <TabGroup index={selectedTab} onIndexChange={setSelectedTab}>
        <TabList className="mt-8">
          <Tab icon={Calendar}>Eventos</Tab>
          <Tab icon={Ticket}>Inventario de Cartones</Tab>
          <Tab icon={TrendingUp}>Ventas y Facturación</Tab>
        </TabList>
        <TabPanels>
          {/* Tab 1: Eventos */}
          <TabPanel>
            <Card className="mt-4">
              <div className="flex justify-between items-center mb-6">
                <Title>Listado de Eventos</Title>
                <Button
                  icon={Plus}
                  onClick={() => handleOpenDialog()}
                  className="bg-larioja-azul"
                >
                  Nuevo Evento
                </Button>
              </div>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Evento</TableHeaderCell>
                    <TableHeaderCell>Fecha</TableHeaderCell>
                    <TableHeaderCell>Valor Cartón</TableHeaderCell>
                    <TableHeaderCell>Cartones</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                    <TableHeaderCell className="text-right">
                      Acciones
                    </TableHeaderCell>
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
                            onClick={() => {
                              setSelectedEventForCards(event);
                              setIsGenerateDialogOpen(true);
                            }}
                            tooltip="Generar Cartones"
                          />
                          <Button
                            variant="light"
                            icon={Edit}
                            size="xs"
                            onClick={() => handleOpenDialog(event)}
                          />
                          <Button
                            variant="light"
                            icon={Trash2}
                            size="xs"
                            color="rose"
                            onClick={() => handleDeleteEvent(event.id)}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabPanel>

          {/* Tab 2: Inventario (Resumen rápido) */}
          <TabPanel>
            <Card className="mt-4">
              <Title>Inventario por Evento</Title>
              <Text className="mb-6">
                Selecciona un evento para gestionar sus cartones.
              </Text>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {events.map((ev) => (
                  <Card
                    key={ev.id}
                    className="hover:shadow-lg transition-all duration-300 cursor-pointer bg-gradient-to-br from-larioja-azul/[0.08] via-larioja-verde/[0.08] to-larioja-amarillo/[0.15] border-gray-100 dark:border-gray-800"
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
                        onClick={() => handleViewInventoryDetails(ev)}
                      >
                        Ver Detalles
                      </Button>
                      <Button
                        size="sm"
                        className="w-full bg-larioja-verde hover:bg-emerald-600 border-none shadow-sm"
                        onClick={() => {
                          setSelectedEventForCards(ev);
                          setIsGenerateDialogOpen(true);
                        }}
                      >
                        Cargar Cartones
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabPanel>

          {/* Tab 3: Ventas y Facturación */}
          <TabPanel>
            <Card className="mt-4">
              <div className="flex justify-between items-center mb-6">
                <Title>Ventas y Facturación</Title>
                {currentEventInfo && (
                  <Button
                    icon={Plus}
                    onClick={handleOpenNewInvoice}
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
                      placeholder="Selecciona un evento para ver facturas..."
                      onValueChange={(val) => {
                        const [cId, eId] = val.split("|");
                        const companyId = parseInt(cId);
                        const eventId = eId;
                        const event = events.find(
                          (e) =>
                            e.company_id === companyId &&
                            e.event_id === eventId,
                        );
                        const cardValue = event?.card_value || 0;
                        setCurrentEventInfo({ companyId, eventId, cardValue });
                        handleFetchInvoices(companyId, eventId);
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

                {loadingInvoices ? (
                  <div className="py-20 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-larioja-azul mx-auto mb-4"></div>
                    <Text>Cargando facturas...</Text>
                  </div>
                ) : invoices.length > 0 ? (
                  <Table className="mt-6">
                    <TableHead>
                      <TableRow>
                        <TableHeaderCell>N° Factura</TableHeaderCell>
                        <TableHeaderCell>Fecha</TableHeaderCell>
                        <TableHeaderCell>Cliente</TableHeaderCell>
                        <TableHeaderCell>Método Pago</TableHeaderCell>
                        <TableHeaderCell>Total</TableHeaderCell>
                        <TableHeaderCell>Estado</TableHeaderCell>
                        <TableHeaderCell className="text-right">
                          Detalle
                        </TableHeaderCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {invoices.map((inv) => (
                        <TableRow
                          key={inv.id}
                          className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                          onClick={() => handleViewInvoiceDetails(inv)}
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
                              color={
                                inv.status === "pagada" ? "emerald" : "amber"
                              }
                              size="xs"
                              className="capitalize"
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
                ) : (
                  <div className="py-20 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                    <TrendingUp
                      size={48}
                      className="mx-auto text-gray-300 mb-4"
                    />
                    <Text className="text-gray-500">
                      No hay facturas registradas para el evento seleccionado o
                      aún no has seleccionado uno.
                    </Text>
                  </div>
                )}
              </div>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>

      {/* Dialog: Detalles de Inventario */}
      <Dialog
        open={isInventoryDetailsDialogOpen}
        onClose={() => {
          setIsInventoryDetailsDialogOpen(false);
          setSearchQuery("");
        }}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <Title className="text-larioja-azul dark:text-larioja-amarillo">
                    Inventario de Cartones
                  </Title>
                  <Text className="text-sm font-medium">
                    Evento: {selectedEventForCards?.event_name}
                  </Text>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    variant="secondary"
                    icon={RefreshCw}
                    onClick={() => setIsRangeReassignDialogOpen(true)}
                  >
                    Cambio en Rango
                  </Button>
                  <Badge color="blue" icon={Ticket}>
                    {eventCards.length} Totales
                  </Badge>
                </div>
              </div>

              <TextInput
                placeholder="Buscar por N° Cartón, Tipo, Estado o Vendedor..."
                icon={Search}
                value={searchQuery}
                onValueChange={setSearchQuery}
              />
            </div>

            {loadingEventCards ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-larioja-azul"></div>
                <Text>Cargando inventario...</Text>
              </div>
            ) : filteredCards.length > 0 ? (
              <div className="max-h-[60vh] overflow-y-auto pr-2">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>N° Cartón</TableHeaderCell>
                      <TableHeaderCell>Tipo</TableHeaderCell>
                      <TableHeaderCell>Estado</TableHeaderCell>
                      <TableHeaderCell>Vendido por</TableHeaderCell>
                      <TableHeaderCell className="text-right">
                        Acciones
                      </TableHeaderCell>
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
                            <Badge
                              size="xs"
                              color={
                                card.card_type === "Virtual" ? "blue" : "purple"
                              }
                            >
                              {card.card_type}
                            </Badge>
                            <Button
                              variant="light"
                              icon={RefreshCw}
                              size="xs"
                              onClick={() => {
                                setSelectedCardForReassign(card);
                                setIsReassignDialogOpen(true);
                              }}
                              tooltip={`Cambiar a ${card.card_type === "Virtual" ? "Fisico" : "Virtual"}`}
                            />
                          </div>
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
                          <Text className="text-xs">
                            {card.sold_by || "N/A"}
                          </Text>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {card.image_url && (
                              <Button
                                variant="light"
                                icon={Eye}
                                size="xs"
                                onClick={() =>
                                  window.open(card.image_url, "_blank")
                                }
                                tooltip="Ver PDF"
                              />
                            )}
                            <Button
                              variant="light"
                              icon={Edit}
                              size="xs"
                              onClick={() => {
                                setSelectedCardForEdit(card);
                                const existingArea = countries.find((c) =>
                                  card.player_phone_number?.startsWith(
                                    c.phone_code,
                                  ),
                                )?.phone_code;
                                const area = existingArea || "+503";
                                setEditCardPhoneArea(area);
                                setEditCardPhoneNumber(
                                  card.player_phone_number
                                    ? card.player_phone_number.replace(area, "")
                                    : "",
                                );
                                setIsEditCardDialogOpen(true);
                              }}
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
                  setIsInventoryDetailsDialogOpen(false);
                  setSearchQuery("");
                }}
              >
                Cerrar
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Dialog: Reasignar Tipo de Cartón */}
      <Dialog
        open={isReassignDialogOpen}
        onClose={() => setIsReassignDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-[60]" />
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-larioja-azul/10 p-2 rounded-lg text-larioja-azul">
                <RefreshCw size={24} />
              </div>
              <Title>Cambiar Tipo de Cartón</Title>
            </div>

            <Text className="mb-6 text-sm">
              Estás por cambiar el tipo del cartón{" "}
              <span className="font-bold">
                #{selectedCardForReassign?.card_number}
              </span>{" "}
              de{" "}
              <span className="font-bold">
                {selectedCardForReassign?.card_type}
              </span>{" "}
              a{" "}
              <span className="font-bold">
                {selectedCardForReassign?.card_type === "Virtual"
                  ? "Fisico"
                  : "Virtual"}
              </span>
              .
            </Text>

            <form onSubmit={handleReassignType} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Nombre del Funcionario Solicitante
                </label>
                <TextInput
                  placeholder="Ej: Juan Pérez"
                  value={officialName}
                  onChange={(e) => setOfficialName(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setIsReassignDialogOpen(false)}
                  disabled={loading}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="bg-larioja-azul"
                >
                  Confirmar Cambio
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Dialog: Subir Imágenes de Cartones */}
      <Dialog
        open={isUploadDialogOpen}
        onClose={() => setIsUploadDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-larioja-azul/10 p-2 rounded-lg text-larioja-azul">
                <Upload size={24} />
              </div>
              <Title>Subir Imágenes de Cartones</Title>
            </div>

            <Text className="mb-6 text-sm">
              Evento:{" "}
              <span className="font-bold">
                {selectedEventForCards?.event_name}
              </span>
              <br />
              <span className="text-xs text-gray-500 italic">
                Patrón: SERIAL_{selectedEventForCards?.event_id}_Carton_#.pdf
              </span>
            </Text>

            <form onSubmit={handleUploadCards} className="space-y-4">
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">
                  Precio por Cartón
                </Text>
                <TextInput
                  name="card_price"
                  type="number"
                  step="0.01"
                  icon={DollarSign}
                  defaultValue={selectedEventForCards?.card_value?.toString()}
                  required
                />
              </div>

              <div className="space-y-2">
                <Text className="text-xs font-bold uppercase text-gray-500">
                  Seleccionar archivos PDF
                </Text>
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl p-6 text-center hover:border-larioja-azul transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => setUploadingFiles(e.target.files)}
                  />
                  <FileIcon className="mx-auto text-gray-400 mb-2" size={32} />
                  <Text className="text-sm">
                    {uploadingFiles
                      ? `${uploadingFiles.length} archivos seleccionados`
                      : "Haz clic o arrastra los PDFs aquí"}
                  </Text>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="delete_existing_upload"
                  name="delete_existing_upload"
                  className="h-4 w-4 text-larioja-azul border-gray-300 rounded focus:ring-larioja-azul"
                />
                <label
                  htmlFor="delete_existing_upload"
                  className="text-sm text-gray-600 font-medium cursor-pointer"
                >
                  Limpiar cartones existentes antes de subir
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsUploadDialogOpen(false);
                    setUploadingFiles(null);
                  }}
                  disabled={loading}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="bg-larioja-azul"
                  disabled={!uploadingFiles || uploadingFiles.length === 0}
                >
                  Subir Cartones
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Dialog: Generar Cartones */}
      <Dialog
        open={isGenerateDialogOpen}
        onClose={() => setIsGenerateDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <Title className="mb-4 text-larioja-azul dark:text-larioja-amarillo">
              Generar Cartones
            </Title>
            <Text className="mb-6 text-sm">
              Evento:{" "}
              <span className="font-bold">
                {selectedEventForCards?.event_name}
              </span>
            </Text>

            <form onSubmit={handleGenerateCards} className="space-y-4">
              <div className="bg-red-500 text-white p-2 text-center font-bold rounded-lg mb-4">
                MODO GENERACIÓN ACTIVO
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Número Inicial
                  </Text>
                  <TextInput
                    name="start"
                    type="number"
                    placeholder="1"
                    defaultValue="1"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Número Final
                  </Text>
                  <TextInput
                    name="end"
                    type="number"
                    placeholder="1000"
                    defaultValue={selectedEventForCards?.event_cartons_number?.toString()}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">
                  Precio por Cartón
                </Text>
                <TextInput
                  name="price"
                  type="number"
                  step="0.01"
                  icon={DollarSign}
                  defaultValue={selectedEventForCards?.card_value?.toString()}
                  required
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="delete_existing"
                  name="delete_existing"
                  className="h-4 w-4 text-larioja-azul border-gray-300 rounded focus:ring-larioja-azul"
                />
                <label
                  htmlFor="delete_existing"
                  className="text-sm text-gray-600 font-medium cursor-pointer"
                >
                  Limpiar cartones existentes antes de generar
                </label>
              </div>

              <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <Text className="text-sm font-medium text-gray-500">
                    ¿Tienes los archivos PDF?
                  </Text>
                  <Button
                    variant="secondary"
                    icon={Upload}
                    onClick={() => {
                      setIsGenerateDialogOpen(false);
                      setIsUploadDialogOpen(true);
                    }}
                    type="button"
                    className="bg-larioja-azul text-white hover:bg-blue-800"
                  >
                    Subir PDFs
                  </Button>
                </div>

                <div className="flex justify-end gap-3 mt-2">
                  <Button
                    variant="secondary"
                    onClick={() => setIsGenerateDialogOpen(false)}
                    disabled={loading}
                    type="button"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    className="bg-larioja-verde"
                  >
                    Generar
                  </Button>
                </div>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
      <Dialog
        open={isEventDialogOpen}
        onClose={() => setIsEventEventDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <Title className="mb-4 text-larioja-azul dark:text-larioja-amarillo">
              {editingEvent ? "Editar Evento" : "Nuevo Evento de Bingo"}
            </Title>
            <form onSubmit={handleSaveEvent} className="space-y-4">
              {editingEvent && (
                <input type="hidden" name="id" value={editingEvent.id} />
              )}

              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">
                  Empresa Organizadora
                </Text>
                <input
                  type="hidden"
                  name="company_id"
                  value={selectedCompany}
                />
                <Select
                  value={selectedCompany}
                  onValueChange={setSelectedCompany}
                  enableClear={false}
                >
                  {companies.map((c) => (
                    <SelectItem
                      key={c.company_id}
                      value={c.company_id.toString()}
                    >
                      {c.company_name}
                    </SelectItem>
                  ))}
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    ID Evento (Slug)
                  </Text>
                  <TextInput
                    name="event_id"
                    placeholder="BINGO-2024"
                    defaultValue={editingEvent?.event_id}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Valor Cartón
                  </Text>
                  <TextInput
                    name="card_value_display"
                    placeholder="$0.00"
                    icon={DollarSign}
                    value={cardValueStr}
                    onValueChange={(v) =>
                      handleCurrencyChange(v, setCardValueStr)
                    }
                    required
                  />
                  <input
                    type="hidden"
                    name="card_value"
                    value={cardValueStr.replace(/[$,]/g, "")}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">
                  Nombre del Evento
                </Text>
                <TextInput
                  name="event_name"
                  placeholder="Gran Bingo Anual"
                  defaultValue={editingEvent?.event_name}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Responsable
                  </Text>
                  <TextInput
                    name="event_manager"
                    placeholder="Nombre del encargado"
                    defaultValue={editingEvent?.event_manager}
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Meta del Evento
                  </Text>
                  <TextInput
                    name="event_goal_display"
                    icon={TrendingUp}
                    placeholder="$0.00"
                    value={eventGoalStr}
                    onValueChange={(v) =>
                      handleCurrencyChange(v, setEventGoalStr)
                    }
                  />
                  <input
                    type="hidden"
                    name="event_goal"
                    value={eventGoalStr.replace(/[$,]/g, "")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Número de Cartones
                  </Text>
                  <TextInput
                    name="event_cartons_number"
                    type="number"
                    icon={Hash}
                    placeholder="Ej: 1000"
                    defaultValue={editingEvent?.event_cartons_number?.toString()}
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Inicio Promoción
                  </Text>
                  <input
                    name="event_start_promotion_date"
                    type="date"
                    defaultValue={editingEvent?.event_start_promotion_date}
                    className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Fecha
                  </Text>
                  <input
                    name="event_date"
                    type="date"
                    defaultValue={editingEvent?.event_date}
                    className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Estado
                  </Text>
                  <input type="hidden" name="status" value={statusValue} />
                  <Select
                    value={statusValue}
                    onValueChange={setStatusValue}
                    enableClear={false}
                  >
                    <SelectItem value="Inactivo">Inactivo</SelectItem>
                    <SelectItem value="Activo">Activo</SelectItem>
                    <SelectItem value="Realizado">Realizado</SelectItem>
                    <SelectItem value="Cancelado">Cancelado</SelectItem>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setIsEventEventDialogOpen(false)}
                  disabled={loading}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="bg-larioja-azul"
                >
                  Guardar
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Dialog: Detalle de Factura */}
      <Dialog
        open={isInvoiceDialogOpen}
        onClose={() => setIsInvoiceDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <Title className="mb-6 text-larioja-azul dark:text-larioja-amarillo">
              Detalle de Factura
            </Title>

            {selectedInvoice && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Text className="text-[10px] font-bold uppercase text-gray-400">
                      N° Factura
                    </Text>
                    <Text className="font-bold text-larioja-azul">
                      {selectedInvoice.invoice_number}
                    </Text>
                  </div>
                  <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <Text className="text-[10px] font-bold uppercase text-gray-400">
                      Fecha
                    </Text>
                    <Text className="font-medium">
                      {new Date(
                        selectedInvoice.invoice_date,
                      ).toLocaleDateString()}
                    </Text>
                  </div>
                </div>

                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-3">
                  <div>
                    <Text className="text-[10px] font-bold uppercase text-gray-400">
                      Cliente
                    </Text>
                    <Text className="font-bold">
                      {selectedInvoice.customer_name}
                    </Text>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Text className="text-[10px] font-bold uppercase text-gray-400">
                        Teléfono
                      </Text>
                      <Text className="text-sm">
                        {selectedInvoice.phone_area
                          ? `(${selectedInvoice.phone_area}) `
                          : ""}
                        {selectedInvoice.phone_number || "N/A"}
                      </Text>
                    </div>
                    <div>
                      <Text className="text-[10px] font-bold uppercase text-gray-400">
                        Email
                      </Text>
                      <Text className="text-sm truncate">
                        {selectedInvoice.customer_email || "N/A"}
                      </Text>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-larioja-azul dark:bg-blue-900 rounded-xl text-white flex justify-between items-center shadow-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign size={20} />
                    <span className="font-bold">Total Facturado</span>
                  </div>
                  <span className="text-2xl font-black">
                    {formatCurrency(selectedInvoice.total_amount)}
                  </span>
                </div>

                <div className="flex justify-between items-center mt-6">
                  <div className="flex gap-3">
                    <Button
                      variant="secondary"
                      icon={Edit}
                      onClick={() => handleEditInvoice(selectedInvoice)}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="light"
                      color="rose"
                      icon={Trash2}
                      onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setIsInvoiceDialogOpen(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </DialogPanel>
        </div>
      </Dialog>

      {/* Dialog: Nueva Factura */}
      <Dialog
        open={isNewInvoiceDialogOpen}
        onClose={() => setIsNewInvoiceDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <Title className="mb-4 text-larioja-azul dark:text-larioja-amarillo">
              {editingInvoice ? "Editar Factura" : "Nueva Factura"}
            </Title>
            <form onSubmit={handleSaveInvoice} className="space-y-4">
              {editingInvoice && (
                <input type="hidden" name="id" value={editingInvoice.id} />
              )}
              <input
                type="hidden"
                name="company_id"
                value={currentEventInfo?.companyId}
              />
              <input
                type="hidden"
                name="event_id"
                value={currentEventInfo?.eventId}
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    N° Factura
                  </Text>
                  <TextInput
                    name="invoice_number"
                    placeholder="F001-000001"
                    defaultValue={editingInvoice?.invoice_number}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Fecha
                  </Text>
                  <input
                    name="invoice_date"
                    type="date"
                    defaultValue={editingInvoice?.invoice_date}
                    required
                    className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">
                  Nombre del Cliente
                </Text>
                <TextInput
                  name="customer_name"
                  placeholder="Juan Pérez"
                  defaultValue={editingInvoice?.customer_name}
                  required
                />
              </div>

              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">
                  Email del Cliente
                </Text>
                <TextInput
                  name="customer_email"
                  type="email"
                  placeholder="juan@ejemplo.com"
                  defaultValue={editingInvoice?.customer_email}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Área
                  </Text>
                  <Select
                    name="phone_area"
                    defaultValue={editingInvoice?.phone_area || "503"}
                    enableClear={false}
                  >
                    {countries.map((country) => (
                      <SelectItem
                        key={`${country.name}-${country.phone_code}`}
                        value={country.phone_code}
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://flagcdn.com/w20/${country.iso2.toLowerCase()}.png`}
                            width="20"
                            alt={country.name}
                            className="rounded-sm"
                          />
                          <span>
                            {country.name} (+{country.phone_code})
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Teléfono
                  </Text>
                  <TextInput
                    name="phone_number"
                    placeholder="1234567"
                    defaultValue={editingInvoice?.phone_number}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Número de Cartones
                  </Text>
                  <TextInput
                    name="cards_number"
                    type="number"
                    value={cardsNumber.toString()}
                    onValueChange={(v) => setCardsNumber(parseInt(v) || 0)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Valor por Cartón
                  </Text>
                  <TextInput
                    name="card_price"
                    type="number"
                    step="0.01"
                    icon={DollarSign}
                    value={cardPrice.toString()}
                    onValueChange={(v) => setCardPrice(parseFloat(v) || 0)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Monto Total
                  </Text>
                  <TextInput
                    name="total_amount_display"
                    icon={DollarSign}
                    value={formatCurrency(cardsNumber * cardPrice)}
                    disabled
                  />
                  <input
                    type="hidden"
                    name="total_amount"
                    value={cardsNumber * cardPrice}
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Estado
                  </Text>
                  <Select
                    name="status"
                    defaultValue={editingInvoice?.status || "pagada"}
                    enableClear={false}
                  >
                    <SelectItem value="pagada">Pagada</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">
                  Método de Pago
                </Text>
                <Select
                  name="payment_method"
                  defaultValue={editingInvoice?.payment_method || "efectivo"}
                  enableClear={false}
                >
                  <SelectItem value="efectivo">Efectivo</SelectItem>
                  <SelectItem value="transferencia">Transferencia</SelectItem>
                  <SelectItem value="tarjeta">Tarjeta</SelectItem>
                </Select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsNewInvoiceDialogOpen(false);
                    setEditingInvoice(null);
                  }}
                  disabled={loading}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="bg-larioja-azul"
                >
                  {editingInvoice ? "Actualizar Factura" : "Guardar Factura"}
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Dialog: Cambiar Tipo en Rango */}
      <Dialog
        open={isRangeReassignDialogOpen}
        onClose={() => setIsRangeReassignDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-[70]" />
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-larioja-azul/10 p-2 rounded-lg text-larioja-azul">
                <RefreshCw size={24} />
              </div>
              <Title>Cambio de Tipo en Rango</Title>
            </div>

            <form onSubmit={handleRangeReassignType} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-500">
                    Desde N°
                  </label>
                  <TextInput
                    type="number"
                    value={rangeStart.toString()}
                    onValueChange={(v) => setRangeStart(parseInt(v) || 1)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-500">
                    Hasta N°
                  </label>
                  <TextInput
                    type="number"
                    value={rangeEnd.toString()}
                    onValueChange={(v) => setRangeEnd(parseInt(v) || 1)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Nuevo Tipo
                </label>
                <Select value={rangeNewType} onValueChange={setRangeNewType}>
                  <SelectItem value="Virtual">Virtual</SelectItem>
                  <SelectItem value="Fisico">Físico</SelectItem>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Funcionario Solicitante
                </label>
                <TextInput
                  placeholder="Ej: Juan Pérez"
                  value={officialName}
                  onChange={(e) => setOfficialName(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setIsRangeReassignDialogOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="bg-larioja-azul"
                >
                  Confirmar Cambio Masivo
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Dialog: Editar Cartón Individual */}
      <Dialog
        open={isEditCardDialogOpen}
        onClose={() => setIsEditCardDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-[70]" />
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-larioja-azul/[0.04] via-larioja-verde/[0.04] to-larioja-amarillo/[0.08] hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="bg-larioja-azul/10 p-2 rounded-lg text-larioja-azul">
                  <Edit size={24} />
                </div>
                <div>
                  <Title className="text-larioja-azul">
                    Editar Cartón #{selectedCardForEdit?.card_number}
                  </Title>
                  <Text className="text-xs">
                    ID Evento: {selectedEventForCards?.event_id} (No editable)
                  </Text>
                </div>
              </div>
              <Badge color="blue" icon={Ticket}>
                Cartón #{selectedCardForEdit?.card_number}
              </Badge>
            </div>

            <form
              onSubmit={handleUpdateSingleCard}
              className="flex flex-col flex-grow overflow-hidden"
            >
              <div className="p-6 overflow-y-auto space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Primera Columna */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                          Tipo
                        </label>
                        <Select
                          name="card_type"
                          defaultValue={
                            selectedCardForEdit?.card_type || "Virtual"
                          }
                        >
                          <SelectItem value="Virtual">Virtual</SelectItem>
                          <SelectItem value="Fisico">Físico</SelectItem>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                          Estado
                        </label>
                        <Select
                          name="card_status"
                          defaultValue={
                            selectedCardForEdit?.card_status || "Disponible"
                          }
                        >
                          <SelectItem value="Disponible">Disponible</SelectItem>
                          <SelectItem value="Vendido">Vendido</SelectItem>
                          <SelectItem value="Asignado">Asignado</SelectItem>
                          <SelectItem value="Cancelado">Cancelado</SelectItem>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                          Precio Base
                        </label>
                        <TextInput
                          name="card_price"
                          icon={DollarSign}
                          placeholder="0.00"
                          defaultValue={selectedCardForEdit?.card_price?.toString()}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                          Precio Venta
                        </label>
                        <TextInput
                          name="sales_price"
                          icon={DollarSign}
                          placeholder="0.00"
                          defaultValue={selectedCardForEdit?.sales_price?.toString()}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                        Vendido por
                      </label>
                      <TextInput
                        name="sold_by"
                        placeholder="Nombre del vendedor"
                        defaultValue={selectedCardForEdit?.sold_by}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                        Factura Relacionada
                      </label>
                      <div className="flex gap-2">
                        <TextInput
                          name="invoice_number"
                          placeholder="N° Factura"
                          defaultValue={selectedCardForEdit?.invoice_number}
                          className="flex-1"
                        />
                        {selectedCardForEdit?.invoice_number && (
                          <Button
                            type="button"
                            variant="light"
                            icon={ExternalLink}
                            tooltip="Ver Factura"
                            onClick={() => {
                              const inv = invoices.find(
                                (i) =>
                                  i.invoice_number ===
                                  selectedCardForEdit.invoice_number,
                              );
                              if (inv) {
                                handleViewInvoiceDetails(inv);
                              } else {
                                alert(
                                  "No se encontró la factura en los registros actuales de este evento.",
                                );
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                        Imagen / PDF
                      </label>
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="file"
                            name="file"
                            accept=".pdf"
                            className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-larioja-azul/10 file:text-larioja-azul hover:file:bg-larioja-azul/20"
                          />
                          {selectedCardForEdit?.image_url && (
                            <Button
                              type="button"
                              variant="light"
                              icon={Eye}
                              onClick={() =>
                                window.open(
                                  selectedCardForEdit.image_url,
                                  "_blank",
                                )
                              }
                              tooltip="Ver actual"
                            />
                          )}
                        </div>
                        {selectedCardForEdit?.image_url && (
                          <Text className="text-[10px] text-gray-400">
                            Ya existe un archivo cargado. Subir uno nuevo lo
                            reemplazará.
                          </Text>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Segunda Columna */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                        Nombre del Jugador
                      </label>
                      <TextInput
                        name="player_name"
                        placeholder="Nombre completo"
                        defaultValue={selectedCardForEdit?.player_name}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                        Teléfono del Jugador
                      </label>
                      <div className="flex gap-2">
                        <Select
                          className="w-32"
                          value={editCardPhoneArea}
                          onValueChange={setEditCardPhoneArea}
                        >
                          {countries.map((c) => (
                            <SelectItem key={c.iso2} value={c.phone_code}>
                              {c.flag_emoji} {c.phone_code}
                            </SelectItem>
                          ))}
                        </Select>
                        <TextInput
                          name="player_phone_number_only"
                          placeholder="7000-0000"
                          value={editCardPhoneNumber}
                          onValueChange={setEditCardPhoneNumber}
                        />
                        <input
                          type="hidden"
                          name="player_phone_number"
                          value={`${editCardPhoneArea}${editCardPhoneNumber}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                        Email del Jugador
                      </label>
                      <TextInput
                        name="player_email"
                        type="email"
                        placeholder="correo@ejemplo.com"
                        defaultValue={selectedCardForEdit?.player_email}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                        Premio
                      </label>
                      <TextInput
                        name="prize"
                        placeholder="Descripción del premio"
                        defaultValue={selectedCardForEdit?.prize}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                        Observaciones
                      </label>
                      <textarea
                        name="comment"
                        className="w-full text-sm border-gray-300 rounded-lg focus:ring-larioja-azul focus:border-larioja-azul dark:bg-gray-800 dark:border-gray-700 p-2 h-20"
                        placeholder="Añadir notas..."
                        defaultValue={selectedCardForEdit?.comment}
                      ></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-400">
                      <div>
                        <span className="font-bold uppercase">Creado:</span>
                        <p>
                          {selectedCardForEdit?.created_at
                            ? new Date(
                                selectedCardForEdit.created_at,
                              ).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                      <div>
                        <span className="font-bold uppercase">
                          Actualizado:
                        </span>
                        <p>
                          {selectedCardForEdit?.updated_at
                            ? new Date(
                                selectedCardForEdit.updated_at,
                              ).toLocaleString()
                            : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 flex-shrink-0">
                <Button
                  variant="secondary"
                  onClick={() => setIsEditCardDialogOpen(false)}
                  disabled={loading}
                  type="button"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="bg-larioja-azul hover:bg-larioja-azul/90"
                >
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
