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
  MessageCircle,
  Smartphone,
  X,
  FileText,
  ImageOff,
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
  updateInvoiceWhatsAppStatus,
  getWhatsAppMessageTemplate,
  getCardsForInvoice,
  getSellersFromView,
  sendWhatsAppAutomation,
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
  const [whatsappTemplate, setWhatsappTemplate] = useState<{
    id: string;
    title: string;
    description: string;
    image_url: string;
  } | null>(null);
  const [whatsappMessage, setWhatsappMessage] = useState("");
  const [whatsappImage, setWhatsappImage] = useState("");
  const [invoiceFileUrl, setInvoiceFileUrl] = useState<string | null>(null);
  const [cardImagesUrls, setCardImagesUrls] = useState<string[]>([]);
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [isWhatsAppPopupOpen, setIsWhatsAppPopupOpen] = useState(false);
  const [invoicePhoneArea, setInvoicePhoneArea] = useState("503");
  const [invoicePhoneNumber, setInvoicePhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [invoiceManagerName, setInvoiceManagerName] = useState("");

  // Auto-generate WhatsApp number when area or phone changes
  useEffect(() => {
    if (!editingInvoice) {
      const area = invoicePhoneArea.replace(/\+/g, "");
      const phone = invoicePhoneNumber.replace(/\D/g, "");
      if (area || phone) {
        setWhatsappNumber(`${area}${phone}`);
      }
    }
  }, [invoicePhoneArea, invoicePhoneNumber, editingInvoice]);
  const [sellers, setSellers] = useState<string[]>([]);
  const [selectedInvoiceCards, setSelectedInvoiceCards] = useState<number[]>(
    [],
  );
  const [availableCardsForInvoice, setAvailableCardsForInvoice] = useState<
    any[]
  >([]);
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
      // Cargar tanto facturas como cartones para que los detalles estén listos
      const [invResult, cardsResult] = await Promise.all([
        getInvoices(companyId, eventId),
        getEventCards(companyId, eventId),
      ]);

      if (invResult.success) {
        setInvoices(invResult.data || []);
      } else {
        console.error("Error fetching invoices:", invResult.error);
      }

      if (typeof cardsResult === "object" && "data" in cardsResult) {
        setEventCards(cardsResult.data || []);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
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
      // Load both cards and invoices for this event
      const [cardsResult] = await Promise.all([
        getEventCards(event.company_id, event.event_id),
        handleFetchInvoices(event.company_id, event.event_id),
      ]);

      if (typeof cardsResult === "object" && "data" in cardsResult) {
        setEventCards(cardsResult.data || []);
      } else if (typeof cardsResult === "object" && "error" in cardsResult) {
        alert("Error: " + cardsResult.error);
      }
    } catch (error) {
      console.error("Error loading inventory:", error);
      alert("Error al cargar el inventario.");
    } finally {
      setLoadingEventCards(false);
    }
  };

  const loadSellers = async (companyId: number, eventId: string) => {
    const result = await getSellersFromView(companyId, eventId);
    if (result.success && result.data) {
      // Usamos un Set para asegurar nombres únicos y filtramos valores nulos o vacíos
      const uniqueSellers = Array.from(
        new Set(result.data.map((s: any) => s.sold_by).filter(Boolean)),
      ) as string[];
      setSellers(uniqueSellers.sort());
    }
  };

  const handleOpenNewInvoice = async () => {
    setEditingInvoice(null);
    if (currentEventInfo) {
      setCardPrice(currentEventInfo.cardValue);
      setCardsNumber(1);
      setInvoicePhoneArea("503");
      setInvoicePhoneNumber("");
      setWhatsappNumber("");
      setInvoiceManagerName(officialName || "");
      setSelectedInvoiceCards([]);

      // Cargar lista de vendedores
      loadSellers(currentEventInfo.companyId, currentEventInfo.eventId);

      // We load available cards for this event
      const result = await getEventCards(
        currentEventInfo.companyId,
        currentEventInfo.eventId,
      );
      if (typeof result === "object" && "data" in result) {
        // Filter cards that are "Disponible"
        setAvailableCardsForInvoice(
          (result.data || []).filter(
            (c: any) => c.card_status === "Disponible",
          ),
        );
      }
    }
    setIsNewInvoiceDialogOpen(true);
  };

  const handleEditInvoice = async (invoice: any) => {
    setEditingInvoice(invoice);
    setCardPrice(invoice.card_price);
    setCardsNumber(invoice.cards_number);
    setInvoicePhoneArea(invoice.phone_area || "503");
    setInvoicePhoneNumber(invoice.phone_number || "");
    setWhatsappNumber(invoice.whatsapp_number || "");
    setInvoiceManagerName(invoice.manager_name || "");

    // Cargar lista de vendedores
    if (currentEventInfo) {
      loadSellers(currentEventInfo.companyId, currentEventInfo.eventId);
    }

    // For editing, we might want to see currently associated cards too
    // But for now, let's focus on the "New Invoice" requirements first
    // If it's an existing invoice, we'd need to fetch which cards are linked to it
    setSelectedInvoiceCards([]);

    if (currentEventInfo) {
      const result = await getEventCards(
        currentEventInfo.companyId,
        currentEventInfo.eventId,
      );
      if (typeof result === "object" && "data" in result) {
        setAvailableCardsForInvoice(
          (result.data || []).filter(
            (c: any) =>
              c.card_status === "Disponible" ||
              c.invoice_number === invoice.invoice_number,
          ),
        );
        // Pre-select cards already linked to this invoice
        const linked = (result.data || [])
          .filter((c: any) => c.invoice_number === invoice.invoice_number)
          .map((c: any) => c.card_number);
        setSelectedInvoiceCards(linked);
      }
    }

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

  const handleOpenWhatsAppPopup = async (invoice: any) => {
    setLoading(true);
    try {
      const templateResult = await getWhatsAppMessageTemplate();
      if (templateResult.success && templateResult.data) {
        const template = templateResult.data;
        setWhatsappTemplate(template);

        let message = template.description || "";
        message = message.replace(
          "[customer_name]",
          invoice.customer_name || "",
        );
        message = message.replace(
          "[cards_number]",
          (invoice.cards_number || 0).toString(),
        );

        setWhatsappMessage(message);
        setWhatsappImage(template.image_url || "");
      }

      const cardsResult = await getCardsForInvoice(
        invoice.company_id,
        invoice.event_id,
        invoice.invoice_number,
      );
      if (cardsResult.success && cardsResult.data) {
        const images = cardsResult.data
          .map((c: any) => c.image_url)
          .filter((url: string | null) => !!url);

        setInvoiceFileUrl(invoice.url_invoice || null);
        setCardImagesUrls(images);
      } else {
        setInvoiceFileUrl(invoice.url_invoice || null);
        setCardImagesUrls([]);
      }

      setEditingInvoice(invoice);
      setWhatsappNumber(
        invoice.whatsapp_number ||
          `${invoice.phone_area}${invoice.phone_number}`,
      );
      setIsWhatsAppPopupOpen(true);
    } catch (error) {
      console.error("Error opening WhatsApp popup:", error);
      alert("Error al cargar la información para WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendWhatsApp = async () => {
    if (!editingInvoice) return;
    setSendingWhatsApp(true);

    try {
      const cleanNumber = whatsappNumber.replace(/\+/g, "").replace(/\s/g, "");

      // Construir el mensaje para WhatsApp Web
      const encodedMessage = encodeURIComponent(whatsappMessage);
      const whatsappUrl = `https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encodedMessage}`;

      // 1. Intentar automatización con Ultramsg
      const automationResult = await sendWhatsAppAutomation({
        to: cleanNumber,
        message: whatsappMessage,
        templateImage: whatsappImage || undefined,
        invoiceUrl: invoiceFileUrl || undefined,
        cardUrls: cardImagesUrls,
      });

      if (automationResult.success) {
        const now = new Date();
        const dateStr = now.toLocaleDateString();
        const timeStr = now.toLocaleTimeString();
        const cardCount = cardImagesUrls.length;
        const statusMessage = `Enviado Automáticamente vía Ultramsg el ${dateStr} a las ${timeStr}. Incluyó factura y ${cardCount} cartones.`;

        await updateInvoiceWhatsAppStatus(editingInvoice.id, statusMessage);
        alert("¡Envío automático completado con éxito a través de Ultramsg!");
        setIsWhatsAppPopupOpen(false);
        return;
      }

      // 2. Fallback: Abrir WhatsApp Web si la automatización falla o no está configurada
      console.warn(
        "Ultramsg automation failed, falling back to manual:",
        automationResult.error,
      );
      window.open(whatsappUrl, "_blank");

      // Registrar éxito (asumimos éxito al abrir la ventana, ya que no podemos saber si se envió realmente desde el navegador)
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();
      const cardCount = cardImagesUrls.length;
      const statusMessage = `Enviado exitosamente el ${dateStr} a las ${timeStr}. Incluyó factura y ${cardCount} cartones.`;

      const result = await updateInvoiceWhatsAppStatus(
        editingInvoice.id,
        statusMessage,
      );

      if (result.success) {
        alert(
          "Mensaje preparado en WhatsApp Web. El estado ha sido registrado.",
        );
        setIsWhatsAppPopupOpen(false);
      } else {
        alert("Error al registrar el estado del envío: " + result.error);
      }
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
      alert("Error al procesar el envío de WhatsApp.");
    } finally {
      setSendingWhatsApp(false);
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
                            <Button
                              variant="light"
                              icon={Eye}
                              size="xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewInvoiceDetails(inv);
                              }}
                            />
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

      {/* Dialog: Formulario WhatsApp (Emergente) */}
      <Dialog
        open={isWhatsAppPopupOpen}
        onClose={() => setIsWhatsAppPopupOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-[60]" />
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <DialogPanel className="max-w-xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh] overflow-hidden bg-gradient-to-br from-larioja-azul/[0.08] via-larioja-verde/[0.08] to-larioja-amarillo/[0.12] hover:shadow-larioja-azul/20 hover:shadow-2xl transition-all duration-500">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-larioja-azul/5 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="bg-green-500/10 p-2 rounded-lg text-green-600">
                  <MessageCircle size={24} />
                </div>
                <Title className="text-larioja-azul">Enviar por WhatsApp</Title>
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                  Número de WhatsApp
                </label>
                <TextInput
                  value={whatsappNumber}
                  onValueChange={setWhatsappNumber}
                  icon={Smartphone}
                  placeholder="Ej: 50370000000"
                />
              </div>

              {/* 1. Imagen de Plantilla */}
              {whatsappTemplate?.image_url && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                    1. Imagen de Plantilla
                  </label>
                  <div className="relative group">
                    <img
                      src={whatsappImage}
                      alt="Plantilla"
                      className="w-full h-auto rounded-lg border border-gray-100 dark:border-gray-800"
                    />
                    <div className="absolute top-2 right-2">
                      <input
                        type="file"
                        id="change_template_img"
                        className="hidden"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              setWhatsappImage(ev.target?.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                      <Button
                        size="xs"
                        variant="secondary"
                        icon={Upload}
                        onClick={() =>
                          document
                            .getElementById("change_template_img")
                            ?.click()
                        }
                      >
                        Cambiar Imagen
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. Mensaje */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                  2. Mensaje
                </label>
                <textarea
                  className="w-full h-32 p-3 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-larioja-azul resize-none"
                  value={whatsappMessage}
                  onChange={(e) => setWhatsappMessage(e.target.value)}
                />
              </div>

              {/* 3. Factura */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                  3. Factura
                </label>
                {invoiceFileUrl ? (
                  <div className="relative aspect-[4/3] w-1/2 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex items-center justify-center group">
                    {invoiceFileUrl.toLowerCase().endsWith(".pdf") ? (
                      <div className="flex flex-col items-center gap-2">
                        <FileText size={48} className="text-red-500" />
                        <Text className="text-[10px]">PDF Factura</Text>
                      </div>
                    ) : (
                      <img
                        src={invoiceFileUrl}
                        alt="Factura"
                        className="w-full h-full object-contain"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="xs"
                        variant="secondary"
                        icon={ExternalLink}
                        onClick={() => window.open(invoiceFileUrl, "_blank")}
                      >
                        Ver Factura
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-gray-200 rounded-lg text-center">
                    <Text className="text-xs text-gray-400">
                      Sin factura adjunta
                    </Text>
                  </div>
                )}
              </div>

              {/* 4. Imagen de los Cartones */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                  4. Imagen de los Cartones ({cardImagesUrls.length})
                </label>
                {cardImagesUrls.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {cardImagesUrls.map((url, i) => (
                      <div
                        key={i}
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex items-center justify-center group"
                      >
                        {url.toLowerCase().endsWith(".pdf") ? (
                          <div className="flex flex-col items-center gap-1">
                            <FileText size={24} className="text-red-500" />
                            <Text className="text-[8px]">PDF Cartón</Text>
                          </div>
                        ) : (
                          <img
                            src={url}
                            alt={`Cartón ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="xs"
                            variant="secondary"
                            onClick={() => window.open(url, "_blank")}
                          >
                            Ver
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-gray-200 rounded-lg text-center">
                    <Text className="text-xs text-gray-400">
                      Sin cartones adjuntos
                    </Text>
                  </div>
                )}
                <Text className="text-[10px] text-gray-400 italic">
                  * Importante: En caso el envio automático falle, El sistema
                  abrirá WhatsApp Web con el mensaje. Deberás adjuntar
                  manualmente la factura y los cartones desde la carpeta de
                  descargas o el link proporcionado.
                </Text>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50">
              <Button
                variant="secondary"
                onClick={() => setIsWhatsAppPopupOpen(false)}
                disabled={sendingWhatsApp}
              >
                Cerrar
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                icon={MessageCircle}
                onClick={handleSendWhatsApp}
                loading={sendingWhatsApp}
              >
                Enviar Automático (Ultramsg)
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

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
          <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-larioja-azul/[0.08] via-larioja-verde/[0.08] to-larioja-amarillo/[0.12] hover:shadow-larioja-azul/20 hover:shadow-2xl transition-all duration-500">
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
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-larioja-azul/[0.08] via-larioja-verde/[0.08] to-larioja-amarillo/[0.12] hover:shadow-larioja-azul/20 hover:shadow-2xl transition-all duration-500">
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
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-larioja-azul/[0.08] via-larioja-verde/[0.08] to-larioja-amarillo/[0.12] hover:shadow-larioja-azul/20 hover:shadow-2xl transition-all duration-500">
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
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-larioja-azul/[0.08] via-larioja-verde/[0.08] to-larioja-amarillo/[0.12] hover:shadow-larioja-azul/20 hover:shadow-2xl transition-all duration-500">
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
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-larioja-azul/[0.08] via-larioja-verde/[0.08] to-larioja-amarillo/[0.12] hover:shadow-larioja-azul/20 hover:shadow-2xl transition-all duration-500">
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

      {/* Dialog: Nueva Factura */}
      <Dialog
        open={isNewInvoiceDialogOpen}
        onClose={() => setIsNewInvoiceDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-larioja-azul/[0.08] via-larioja-verde/[0.08] to-larioja-amarillo/[0.12] hover:shadow-larioja-azul/20 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col max-h-[95vh]">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-shrink-0 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md">
              <Title className="text-larioja-azul dark:text-larioja-amarillo">
                {editingInvoice ? "Editar Factura" : "Nueva Factura"}
              </Title>
              <div className="text-xs font-bold text-gray-500">
                EVENTO: {currentEventInfo?.eventId}
              </div>
            </div>

            <form
              onSubmit={handleSaveInvoice}
              className="flex flex-col flex-grow overflow-hidden"
              encType="multipart/form-data"
            >
              <div className="p-6 overflow-y-auto space-y-6">
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
                    <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
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
                    <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                      Fecha
                    </Text>
                    <input
                      name="invoice_date"
                      type="date"
                      defaultValue={editingInvoice?.invoice_date}
                      required
                      className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-larioja-azul"
                    />
                  </div>
                </div>

                {editingInvoice?.send_whatsapp_message && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-lg">
                    <Text className="text-[10px] font-bold uppercase text-green-600 dark:text-green-400 tracking-wider mb-1 flex items-center gap-1">
                      <CheckCircle size={12} /> Registro de envío WhatsApp
                    </Text>
                    <p className="text-xs text-green-700 dark:text-green-300 italic">
                      {editingInvoice.send_whatsapp_message}
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
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
                    <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                      Email del Cliente
                    </Text>
                    <TextInput
                      name="customer_email"
                      type="email"
                      placeholder="juan@ejemplo.com"
                      defaultValue={editingInvoice?.customer_email}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                      Área
                    </Text>
                    <Select
                      name="phone_area"
                      value={invoicePhoneArea}
                      onValueChange={setInvoicePhoneArea}
                      enableClear={false}
                    >
                      {countries.map((country) => (
                        <SelectItem
                          key={`${country.name}-${country.phone_code}`}
                          value={country.phone_code}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">
                              {country.flag_emoji}
                            </span>
                            <span>+{country.phone_code}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                      Teléfono
                    </Text>
                    <TextInput
                      name="phone_number"
                      placeholder="1234567"
                      value={invoicePhoneNumber}
                      onValueChange={setInvoicePhoneNumber}
                    />
                  </div>
                  <div className="space-y-1">
                    <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                      WhatsApp
                    </Text>
                    <div className="flex gap-2">
                      <TextInput
                        name="whatsapp_number"
                        value={whatsappNumber}
                        onValueChange={setWhatsappNumber}
                        icon={Smartphone}
                        placeholder="50312345678"
                      />
                      <Button
                        type="button"
                        variant="light"
                        icon={MessageCircle}
                        className="text-green-500"
                        tooltip="Enviar por WhatsApp"
                        onClick={() =>
                          handleOpenWhatsAppPopup(
                            editingInvoice || selectedInvoice,
                          )
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                    Vendido por (Manager)
                  </Text>
                  <input
                    name="manager_name"
                    placeholder="Nombre del vendedor..."
                    value={invoiceManagerName}
                    onChange={(e) => setInvoiceManagerName(e.target.value)}
                    required
                    list="sellers-list"
                    autoComplete="off"
                    className="w-full text-sm border border-gray-300 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-larioja-azul/20 focus:border-larioja-azul transition-all duration-200 p-2 text-gray-900 dark:text-gray-100 placeholder:text-gray-400"
                  />
                  <datalist id="sellers-list">
                    {sellers.map((seller) => (
                      <option key={seller} value={seller}>
                        {seller}
                      </option>
                    ))}
                  </datalist>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                      Imagen de Factura
                    </Text>
                    <input
                      type="file"
                      name="invoice_file"
                      accept="image/*,.pdf"
                      className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-larioja-azul/10 file:text-larioja-azul hover:file:bg-larioja-azul/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
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

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
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
                    <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
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
                  <div className="space-y-1">
                    <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
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
                </div>

                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                    Asociar Cartones ({selectedInvoiceCards.length} de{" "}
                    {cardsNumber})
                  </Text>
                  <div className="flex gap-2 mb-2">
                    <TextInput
                      id="manual_card_number"
                      placeholder="Buscar o agregar N° de cartón..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = parseInt(
                            (e.target as HTMLInputElement).value,
                          );
                          if (val && !selectedInvoiceCards.includes(val)) {
                            const found = availableCardsForInvoice.find(
                              (c) => c.card_number === val,
                            );
                            if (found) {
                              if (selectedInvoiceCards.length < cardsNumber) {
                                setSelectedInvoiceCards(
                                  [...selectedInvoiceCards, val].sort(
                                    (a, b) => a - b,
                                  ),
                                );
                                (e.target as HTMLInputElement).value = "";
                              } else {
                                alert(
                                  `Solo puedes seleccionar ${cardsNumber} cartones.`,
                                );
                              }
                            } else {
                              alert(
                                `El cartón #${val} no está disponible para este evento.`,
                              );
                            }
                          }
                        }
                      }}
                    />
                  </div>
                  <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
                    <div className="grid grid-cols-4 gap-2">
                      {availableCardsForInvoice.map((card) => (
                        <div
                          key={card.card_number}
                          className={`flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors ${
                            selectedInvoiceCards.includes(card.card_number)
                              ? "bg-larioja-azul text-white border-larioja-azul"
                              : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-larioja-azul"
                          }`}
                          onClick={() => {
                            if (
                              selectedInvoiceCards.includes(card.card_number)
                            ) {
                              setSelectedInvoiceCards(
                                selectedInvoiceCards.filter(
                                  (n) => n !== card.card_number,
                                ),
                              );
                            } else {
                              if (selectedInvoiceCards.length < cardsNumber) {
                                setSelectedInvoiceCards(
                                  [
                                    ...selectedInvoiceCards,
                                    card.card_number,
                                  ].sort((a, b) => a - b),
                                );
                              } else {
                                alert(
                                  `Solo puedes seleccionar ${cardsNumber} cartones.`,
                                );
                              }
                            }
                          }}
                        >
                          <span className="text-xs font-bold">
                            #{card.card_number}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <input
                    type="hidden"
                    name="associated_cards"
                    value={JSON.stringify(selectedInvoiceCards)}
                  />
                  {selectedInvoiceCards.length !== cardsNumber && (
                    <Text className="text-[10px] text-red-500 italic mt-1">
                      * Debes asociar exactamente {cardsNumber} cartones.
                    </Text>
                  )}
                </div>

                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
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
              </div>

              <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 flex-shrink-0">
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
                  disabled={selectedInvoiceCards.length !== cardsNumber}
                  className="bg-larioja-azul"
                >
                  {editingInvoice ? "Actualizar Factura" : "Guardar Factura"}
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
          <DialogPanel className="max-w-3xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden flex flex-col max-h-[95vh] bg-gradient-to-br from-larioja-azul/[0.08] via-larioja-verde/[0.08] to-larioja-amarillo/[0.12] hover:shadow-larioja-azul/20 hover:shadow-2xl transition-all duration-500">
            <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-shrink-0 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md">
              <div className="flex items-center gap-3">
                <div className="bg-larioja-azul/10 p-2 rounded-lg text-larioja-azul">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <Title className="text-larioja-azul dark:text-larioja-amarillo">
                    Factura {selectedInvoice?.invoice_number}
                  </Title>
                  <Text className="text-xs">
                    Evento: {selectedInvoice?.event_id}
                  </Text>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="xs"
                  icon={Edit}
                  onClick={() => handleEditInvoice(selectedInvoice)}
                >
                  Editar
                </Button>
                <Button
                  variant="secondary"
                  size="xs"
                  icon={Trash2}
                  className="text-red-500"
                  onClick={() => handleDeleteInvoice(selectedInvoice.id)}
                >
                  Eliminar
                </Button>
                <Button
                  variant="light"
                  icon={X}
                  onClick={() => setIsInvoiceDialogOpen(false)}
                />
              </div>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  {selectedInvoice?.send_whatsapp_message && (
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-lg">
                      <Text className="text-[10px] font-bold uppercase text-green-600 dark:text-green-400 tracking-wider mb-1 flex items-center gap-1">
                        <CheckCircle size={12} /> Último envío WhatsApp
                      </Text>
                      <p className="text-xs text-green-700 dark:text-green-300 italic">
                        {selectedInvoice.send_whatsapp_message}
                      </p>
                    </div>
                  )}

                  <div>
                    <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                      Información del Cliente
                    </Text>
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-100 dark:border-gray-800">
                      <p className="font-bold text-gray-900 dark:text-white">
                        {selectedInvoice?.customer_name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {selectedInvoice?.customer_email}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge size="xs" color="emerald">
                          WhatsApp:{" "}
                          {selectedInvoice?.whatsapp_number
                            ? `+${selectedInvoice.whatsapp_number}`
                            : `+${selectedInvoice?.phone_area} ${selectedInvoice?.phone_number}`}
                        </Badge>
                        <Button
                          type="button"
                          variant="light"
                          icon={MessageCircle}
                          size="xs"
                          className="text-green-500"
                          tooltip="Enviar por WhatsApp"
                          onClick={() =>
                            handleOpenWhatsAppPopup(selectedInvoice)
                          }
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                        Fecha Emisión
                      </Text>
                      <p className="text-sm font-medium mt-1">
                        {selectedInvoice?.invoice_date &&
                          new Date(
                            selectedInvoice.invoice_date,
                          ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                        Estado
                      </Text>
                      <Badge
                        color={
                          selectedInvoice?.status === "pagada"
                            ? "emerald"
                            : "amber"
                        }
                        size="xs"
                        className="mt-1 capitalize"
                      >
                        {selectedInvoice?.status}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                        Método de Pago
                      </Text>
                      <p className="text-sm font-medium mt-1 capitalize">
                        {selectedInvoice?.payment_method}
                      </p>
                    </div>
                    <div>
                      <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                        Vendido por
                      </Text>
                      <p className="text-sm font-medium mt-1">
                        {selectedInvoice?.manager_name || "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-larioja-azul/5 rounded-xl border border-larioja-azul/10">
                    <div className="flex justify-between items-center mb-2">
                      <Text className="text-xs">Cant. Cartones</Text>
                      <Text className="font-bold">
                        {selectedInvoice?.cards_number}
                      </Text>
                    </div>
                    <div className="flex justify-between items-center mb-2">
                      <Text className="text-xs">Precio unitario</Text>
                      <Text className="font-bold">
                        {formatCurrency(selectedInvoice?.card_price || 0)}
                      </Text>
                    </div>
                    <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
                    <div className="flex justify-between items-center">
                      <Text className="text-sm font-bold text-larioja-azul">
                        Total
                      </Text>
                      <Text className="text-lg font-bold text-larioja-azul">
                        {formatCurrency(selectedInvoice?.total_amount || 0)}
                      </Text>
                    </div>
                  </div>

                  <div>
                    <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider mb-2">
                      Cartones Asociados
                    </Text>
                    <div className="flex flex-wrap gap-2">
                      {eventCards
                        .filter(
                          (c) =>
                            c.invoice_number ===
                            selectedInvoice?.invoice_number,
                        )
                        .map((c) => (
                          <Badge key={c.card_number} size="xs" color="blue">
                            #{c.card_number}
                          </Badge>
                        ))}
                      {eventCards.filter(
                        (c) =>
                          c.invoice_number === selectedInvoice?.invoice_number,
                      ).length === 0 && (
                        <Text className="text-xs text-gray-400 italic">
                          No hay cartones vinculados en la vista actual.
                        </Text>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                    Imagen / Comprobante
                  </Text>
                  {selectedInvoice?.url_invoice ? (
                    <div className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
                      {selectedInvoice.url_invoice
                        .toLowerCase()
                        .endsWith(".pdf") ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 dark:bg-gray-800/50">
                          <FileText size={48} className="text-red-500 mb-2" />
                          <Text>Documento PDF</Text>
                          <Button
                            variant="primary"
                            size="xs"
                            className="mt-4"
                            onClick={() =>
                              window.open(selectedInvoice.url_invoice, "_blank")
                            }
                          >
                            Ver PDF
                          </Button>
                        </div>
                      ) : (
                        <img
                          src={selectedInvoice.url_invoice}
                          alt="Comprobante"
                          className="w-full h-auto object-contain max-h-[400px]"
                        />
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <Button
                          variant="secondary"
                          size="xs"
                          icon={Eye}
                          onClick={() =>
                            window.open(selectedInvoice.url_invoice, "_blank")
                          }
                        >
                          Ver Original
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                      <ImageOff size={48} className="text-gray-300 mb-2" />
                      <Text className="text-gray-400">Sin imagen adjunta</Text>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 flex-shrink-0">
              <Button
                variant="secondary"
                onClick={() => setIsInvoiceDialogOpen(false)}
              >
                Cerrar
              </Button>
            </div>
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
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-larioja-azul/[0.08] via-larioja-verde/[0.08] to-larioja-amarillo/[0.12] hover:shadow-larioja-azul/20 hover:shadow-2xl transition-all duration-500">
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
          <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-larioja-azul/[0.08] via-larioja-verde/[0.08] to-larioja-amarillo/[0.12] hover:shadow-larioja-azul/20 hover:shadow-2xl transition-all duration-500 overflow-hidden flex flex-col max-h-[95vh]">
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
                          id="edit_card_invoice_number"
                          placeholder="N° Factura"
                          defaultValue={selectedCardForEdit?.invoice_number}
                          className="flex-1"
                        />
                        {(selectedCardForEdit?.invoice_number || true) && (
                          <Button
                            type="button"
                            variant="light"
                            icon={ExternalLink}
                            tooltip="Ver Factura"
                            onClick={() => {
                              const currentInvoiceNum = (
                                document.getElementById(
                                  "edit_card_invoice_number",
                                ) as HTMLInputElement
                              )?.value;
                              if (!currentInvoiceNum) {
                                alert(
                                  "Por favor ingresa un número de factura.",
                                );
                                return;
                              }
                              const inv = invoices.find(
                                (i) =>
                                  String(i.invoice_number).trim() ===
                                  String(currentInvoiceNum).trim(),
                              );
                              if (inv) {
                                handleViewInvoiceDetails(inv);
                              } else {
                                alert(
                                  `No se encontró la factura "${currentInvoiceNum}" en los registros de este evento.`,
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
