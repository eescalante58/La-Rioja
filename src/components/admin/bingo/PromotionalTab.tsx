"use client";

import { useState, useEffect } from "react";
import {
  Card,
  Text,
  Title,
  Button,
  Badge,
  TextInput,
  Select,
  SelectItem,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Dialog,
  DialogPanel,
} from "@tremor/react";
import {
  Users,
  RefreshCw,
  UserPlus,
  Search,
  Smartphone,
  Edit,
  Trash,
  CheckCircle,
  Square,
  Send,
  Upload,
  ImageOff,
  FileText,
  Eye,
  Check,
} from "lucide-react";
import {
  getCustomers,
  saveCustomer,
  deleteCustomer,
  getPromoTemplates,
  syncCustomers,
  logPromoMessage,
  getBatchLogs,
  getBatchDetails,
  uploadPromoImage,
  sendWhatsAppAutomation,
} from "@/app/admin/bingo/actions";

interface Customer {
  id: number;
  company_id: number;
  customer_name: string;
  phone_number: string;
}

interface PromoTemplate {
  id: string;
  title: string;
  description: string;
  image_url: string;
}

interface PromotionalTabProps {
  companyId: number;
}

export default function PromotionalTab({ companyId }: PromotionalTabProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [promoTemplates, setPromoTemplates] = useState<PromoTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<PromoTemplate | null>(null);
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerFormName, setCustomerFormName] = useState("");
  const [customerFormPhone, setCustomerFormPhone] = useState("");
  const [promoMessage, setPromoMessage] = useState("");
  const [promoImage, setPromoImage] = useState("");
  const [sendingBulk, setSendingBulk] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ sent: 0, total: 0 });
  const [isBulkSummaryOpen, setIsBulkSummaryOpen] = useState(false);
  const [bulkResults, setBulkResults] = useState<any[]>([]);
  const [batchLogs, setBatchLogs] = useState<any[]>([]);
  const [selectedBatchDetails, setSelectedBatchDetails] = useState<any[]>([]);
  const [isBatchDetailsOpen, setIsBatchDetailsOpen] = useState(false);
  const [currentBatchId, setCurrentBatchId] = useState<string | null>(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<number[]>([]);
  const [isUploadingPromoImage, setIsUploadingPromoImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingTemplates, setLoadingTemplates] = useState(false);

  useEffect(() => {
    if (companyId) {
      loadCustomers(companyId);
      loadBatchLogs(companyId);
      loadTemplates();
    }
  }, [companyId]);

  const loadBatchLogs = async (id: number) => {
    const result = await getBatchLogs(id);
    if (result.success && result.data) {
      setBatchLogs(result.data);
    }
  };

  const loadCustomers = async (id: number) => {
    setLoadingCustomers(true);
    try {
      const result = await getCustomers(id);
      if (result.success && result.data) {
        setCustomers(result.data);
        setSelectedCustomerIds(result.data.map((c: any) => c.id));
      }
    } catch (error) {
      console.error("Error loading customers:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const result = await getPromoTemplates();
      if (result.success && result.data) {
        setPromoTemplates(result.data);
      }
    } catch (error) {
      console.error("Error loading templates:", error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleSaveCustomer = async () => {
    if (!companyId) return;
    if (!customerFormName.trim() || !customerFormPhone.trim()) return;

    setLoadingCustomers(true);
    const payload = {
      id: editingCustomer?.id,
      company_id: companyId,
      customer_name: customerFormName.trim(),
      phone_number: customerFormPhone.trim(),
    };

    try {
      const result = await saveCustomer(payload);
      if (result.success) {
        await loadCustomers(companyId);
        setIsCustomerDialogOpen(false);
        setEditingCustomer(null);
        setCustomerFormName("");
        setCustomerFormPhone("");
      }
    } catch (error) {
      console.error("Error saving customer:", error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleDeleteCustomer = async (id: number) => {
    if (!confirm("¿Estás seguro de eliminar este cliente?")) return;

    setLoadingCustomers(true);
    try {
      const result = await deleteCustomer(id);
      if (result.success) {
        await loadCustomers(companyId);
      }
    } finally {
      setLoadingCustomers(false);
    }
  };

  const handleSyncCustomers = async () => {
    setLoadingCustomers(true);
    try {
      const result = await syncCustomers();
      if (result.success) {
        await loadCustomers(companyId);
        alert("Sincronización completada con éxito.");
      }
    } finally {
      setLoadingCustomers(false);
    }
  };

  const toggleCustomerSelection = (id: number) => {
    setSelectedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((cid) => cid !== id) : [...prev, id],
    );
  };

  const toggleSelectAllCustomers = () => {
    if (selectedCustomerIds.length === customers.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(customers.map((c) => c.id));
    }
  };

  const handlePromoImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !companyId) return;

    setIsUploadingPromoImage(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("company_id", companyId.toString());

    try {
      const result = await uploadPromoImage(formData);
      if (result.success && result.url) {
        setPromoImage(result.url);
        e.target.value = "";
      }
    } finally {
      setIsUploadingPromoImage(false);
    }
  };

  const handleSendBulkPromo = async () => {
    const selectedCustomers = customers.filter((c) =>
      selectedCustomerIds.includes(c.id),
    );
    if (!selectedCustomers.length || !promoMessage || !companyId) return;

    if (!confirm(`¿Enviar mensaje a ${selectedCustomers.length} clientes?`))
      return;

    setSendingBulk(true);
    setBulkProgress({ sent: 0, total: selectedCustomers.length });
    const batchId = crypto.randomUUID();
    setCurrentBatchId(batchId);

    for (let i = 0; i < selectedCustomers.length; i++) {
      const customer = selectedCustomers[i];
      let personalizedMessage = promoMessage.replace(
        "[customer_name]",
        customer.customer_name,
      );

      const res = await sendWhatsAppAutomation({
        to: customer.phone_number,
        message: personalizedMessage,
        templateImage: promoImage || undefined,
        cardUrls: [],
      });

      await logPromoMessage({
        batch_id: batchId,
        company_id: companyId,
        customer_name: customer.customer_name,
        phone_number: customer.phone_number,
        message_body: personalizedMessage,
        image_url: promoImage || undefined,
        status: res.success ? "success" : "error",
        error_message: res.error || undefined,
      });

      setBulkProgress({ sent: i + 1, total: selectedCustomers.length });
    }

    setSendingBulk(false);
    loadBatchLogs(companyId);
    alert("Envío masivo finalizado.");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4 px-4 sm:px-0">
      {/* Columna Izquierda: Gestión de Clientes */}
      <Card className="lg:col-span-1 flex flex-col h-[700px] shadow-sm sm:shadow-md border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title className="text-larioja-azul flex items-center gap-2">
              <Users size={20} />
              Clientes
            </Title>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={toggleSelectAllCustomers}
                className="flex items-center gap-1 text-[10px] font-bold uppercase text-larioja-azul hover:opacity-70 transition-opacity"
              >
                {selectedCustomerIds.length === customers.length ? (
                  <>
                    <Check size={12} />
                    Desmarcar Todos
                  </>
                ) : (
                  <>
                    <Square size={12} />
                    Marcar Todos
                  </>
                )}
              </button>
              <span className="text-[10px] text-gray-400">|</span>
              <Text className="text-[10px]">
                {selectedCustomerIds.length} seleccionados de {customers.length}
              </Text>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="light"
              icon={RefreshCw}
              size="xs"
              onClick={handleSyncCustomers}
              loading={loadingCustomers}
              tooltip="Sincronizar desde Ventas"
            />
            <Button
              variant="light"
              icon={UserPlus}
              size="xs"
              onClick={() => {
                setEditingCustomer(null);
                setCustomerFormName("");
                setCustomerFormPhone("");
                setIsCustomerDialogOpen(true);
              }}
              tooltip="Añadir Cliente"
            />
          </div>
        </div>

        <div className="relative mb-4">
          <TextInput
            icon={Search}
            placeholder="Buscar por nombre o teléfono..."
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
          {loadingCustomers ? (
            <div className="flex flex-col items-center justify-center h-full opacity-50">
              <RefreshCw className="animate-spin mb-2" size={24} />
              <Text>Cargando clientes...</Text>
            </div>
          ) : customers.length > 0 ? (
            customers
              .filter(
                (c) =>
                  c.customer_name
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()) ||
                  c.phone_number.includes(searchQuery),
              )
              .map((customer) => (
                <div
                  key={customer.id}
                  className={`p-3 rounded-xl border flex justify-between items-center hover:shadow-md transition-all group ${
                    selectedCustomerIds.includes(customer.id)
                      ? "bg-larioja-azul/[0.03] border-larioja-azul/20"
                      : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleCustomerSelection(customer.id)}
                      className={`transition-colors ${
                        selectedCustomerIds.includes(customer.id)
                          ? "text-larioja-azul"
                          : "text-gray-300 hover:text-gray-400"
                      }`}
                    >
                      {selectedCustomerIds.includes(customer.id) ? (
                        <CheckCircle size={20} />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>
                    <div className="flex flex-col">
                      <Text className="font-bold text-sm">
                        {customer.customer_name}
                      </Text>
                      <Text className="text-xs opacity-60 flex items-center gap-1">
                        <Smartphone size={10} />
                        {customer.phone_number}
                      </Text>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="light"
                      icon={Edit}
                      size="xs"
                      onClick={() => {
                        setEditingCustomer(customer);
                        setCustomerFormName(customer.customer_name);
                        setCustomerFormPhone(customer.phone_number);
                        setIsCustomerDialogOpen(true);
                      }}
                    />
                    <Button
                      variant="light"
                      icon={Trash}
                      size="xs"
                      color="rose"
                      onClick={() => handleDeleteCustomer(customer.id)}
                    />
                  </div>
                </div>
              ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center opacity-40 px-4">
              <Users size={40} className="mb-2" />
              <Text className="text-xs">
                No hay clientes registrados. Usa el botón de sincronización para
                importar desde ventas.
              </Text>
            </div>
          )}
        </div>
      </Card>

      {/* Columna Derecha: Envío de Mensajes */}
      <Card className="lg:col-span-2 flex flex-col h-[700px] shadow-sm sm:shadow-md border-gray-200 dark:border-gray-800 transition-all duration-300">
        <div className="flex justify-between items-center mb-6">
          <Title className="text-larioja-azul flex items-center gap-2">
            <Send size={20} />
            Envío Masivo Promocional
          </Title>
          <Button
            icon={Send}
            className="bg-larioja-azul"
            onClick={handleSendBulkPromo}
            disabled={
              sendingBulk || !selectedCustomerIds.length || !promoMessage
            }
            loading={sendingBulk}
          >
            {sendingBulk
              ? `Enviando ${bulkProgress.sent}/${bulkProgress.total}...`
              : "Enviar mensaje"}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 overflow-hidden">
          {/* Selector y Preview */}
          <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Text className="text-[10px] font-bold uppercase text-gray-500">
                  Seleccionar Plantilla
                </Text>
                <Button
                  variant="light"
                  icon={RefreshCw}
                  size="xs"
                  onClick={loadTemplates}
                  tooltip="Recargar plantillas"
                />
              </div>
              <Select
                placeholder={
                  loadingTemplates
                    ? "Cargando plantillas..."
                    : promoTemplates.length > 0
                      ? "Elige una plantilla promocional..."
                      : "No hay plantillas disponibles"
                }
                disabled={loadingTemplates || promoTemplates.length === 0}
                value={selectedTemplate?.id || ""}
                onValueChange={(val) => {
                  const template = promoTemplates.find((t) => t.id === val);
                  if (template) {
                    setSelectedTemplate(template);
                    setPromoMessage(template.description);
                    setPromoImage(template.image_url);
                  }
                }}
              >
                {promoTemplates.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.title}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Text className="text-[10px] font-bold uppercase text-gray-500">
                  Imagen del Mensaje
                </Text>
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="promo-image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handlePromoImageUpload}
                  />
                  <Button
                    variant="light"
                    icon={Upload}
                    size="xs"
                    onClick={() =>
                      document.getElementById("promo-image-upload")?.click()
                    }
                    loading={isUploadingPromoImage}
                    tooltip="Subir nueva imagen"
                  />
                </div>
              </div>
              <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 group">
                {promoImage ? (
                  <>
                    <img
                      src={promoImage}
                      alt="Promo"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button
                        size="xs"
                        variant="secondary"
                        icon={Upload}
                        onClick={() =>
                          document.getElementById("promo-image-upload")?.click()
                        }
                      >
                        Subir Nueva
                      </Button>
                      <Button
                        size="xs"
                        variant="light"
                        className="text-white hover:text-white/80"
                        onClick={() => {
                          const url = prompt(
                            "URL de la nueva imagen:",
                            promoImage,
                          );
                          if (url) setPromoImage(url);
                        }}
                      >
                        Pegar URL
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-400">
                    {isUploadingPromoImage ? (
                      <RefreshCw className="animate-spin mb-2" size={40} />
                    ) : (
                      <ImageOff size={40} className="mb-2" />
                    )}
                    <Text className="text-xs">
                      {isUploadingPromoImage
                        ? "Subiendo..."
                        : "Sin imagen seleccionada"}
                    </Text>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Text className="text-[10px] font-bold uppercase text-gray-500">
                Mensaje (Usa [customer_name] para personalizar)
              </Text>
              <textarea
                className="w-full h-40 text-sm p-3 border border-gray-200 dark:border-gray-800 rounded-xl bg-white dark:bg-gray-900 focus:ring-2 focus:ring-larioja-azul/20 outline-none transition-all resize-none"
                value={promoMessage}
                onChange={(e) => setPromoMessage(e.target.value)}
                placeholder="Escribe el mensaje promocional aquí..."
              />
            </div>
          </div>

          {/* WhatsApp Canvas Simulator */}
          <div className="bg-[#E5DDD5] dark:bg-gray-950 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden shadow-inner">
            <div className="bg-[#075E54] p-3 flex items-center gap-3 text-white">
              <div className="bg-white/20 p-2 rounded-full">
                <Users size={18} />
              </div>
              <div>
                <Text className="text-white font-bold leading-none">
                  Grupo Promocional (Simulado)
                </Text>
                <Text className="text-white/70 text-[10px]">
                  {selectedCustomerIds.length} participantes
                </Text>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
              {customers
                .filter((c) => selectedCustomerIds.includes(c.id))
                .slice(0, 10)
                .map((c, i) => (
                  <div
                    key={c.id}
                    className={`max-w-[85%] rounded-lg p-3 shadow-sm relative ${
                      i % 2 === 0
                        ? "bg-white dark:bg-gray-800 self-start rounded-tl-none"
                        : "bg-[#DCF8C6] dark:bg-emerald-950 self-end rounded-tr-none"
                    }`}
                  >
                    <Text className="text-[10px] font-bold text-larioja-azul mb-1">
                      {c.customer_name}
                    </Text>
                    {promoImage && (
                      <img
                        src={promoImage}
                        className="rounded-lg mb-2 w-full h-auto"
                        alt="Promo Preview"
                      />
                    )}
                    <Text className="text-xs">
                      {promoMessage
                        .replace("[customer_name]", c.customer_name)
                        .split("\n")
                        .map((line, key) => (
                          <span key={key}>
                            {line}
                            <br />
                          </span>
                        ))}
                    </Text>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Sección de Historial de Lotes */}
        <div className="mt-6 border-t border-gray-100 dark:border-gray-800 pt-6">
          <div className="flex items-center gap-2 mb-4">
            <FileText size={18} className="text-larioja-azul" />
            <Title className="text-sm">Historial de Envíos Masivos</Title>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHead>
                <TableRow>
                  <TableHeaderCell className="text-[10px]">
                    Fecha/Hora
                  </TableHeaderCell>
                  <TableHeaderCell className="text-[10px]">
                    Total
                  </TableHeaderCell>
                  <TableHeaderCell className="text-[10px]">
                    Éxito
                  </TableHeaderCell>
                  <TableHeaderCell className="text-[10px]">
                    Error
                  </TableHeaderCell>
                  <TableHeaderCell className="text-[10px] text-right">
                    Detalles
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {batchLogs.length > 0 ? (
                  batchLogs.map((batch) => (
                    <TableRow key={batch.batch_id}>
                      <TableCell className="py-2">
                        <Text className="text-[11px]">
                          {new Date(batch.started_at).toLocaleString()}
                        </Text>
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        <Badge color="gray" size="xs">
                          {batch.total_messages}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        <Badge color="emerald" size="xs">
                          {batch.success_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-center">
                        <Badge color="rose" size="xs">
                          {batch.error_count}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <Button
                          variant="light"
                          icon={Eye}
                          size="xs"
                          onClick={async () => {
                            const res = await getBatchDetails(batch.batch_id);
                            if (res.success && res.data) {
                              setSelectedBatchDetails(res.data);
                              setIsBatchDetailsOpen(true);
                            }
                          }}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      <Text className="text-xs opacity-40">
                        No hay envíos registrados.
                      </Text>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* Dialog: Añadir/Editar Cliente */}
      <Dialog
        open={isCustomerDialogOpen}
        onClose={() => setIsCustomerDialogOpen(false)}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 sm:backdrop-blur-sm z-[70]" />
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4">
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl sm:shadow-xl border border-gray-200 dark:border-gray-800">
            <Title className="mb-4">
              {editingCustomer ? "Editar Cliente" : "Nuevo Cliente Promocional"}
            </Title>
            <div className="space-y-4">
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">
                  Nombre Completo
                </Text>
                <TextInput
                  value={customerFormName}
                  onValueChange={setCustomerFormName}
                  placeholder="Ej: Juan Pérez"
                />
              </div>
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">
                  Teléfono (WhatsApp)
                </Text>
                <TextInput
                  value={customerFormPhone}
                  onValueChange={setCustomerFormPhone}
                  placeholder="Ej: 50370000000"
                />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setIsCustomerDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-larioja-azul"
                  onClick={handleSaveCustomer}
                >
                  Guardar Cliente
                </Button>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Dialog: Detalles del Lote */}
      <Dialog
        open={isBatchDetailsOpen}
        onClose={() => setIsBatchDetailsOpen(false)}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 sm:backdrop-blur-sm z-[70]" />
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-2 sm:p-4">
          <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl sm:shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[85vh] sm:max-h-[80vh]">
            <Title className="mb-4">Detalles del Envío</Title>
            <div className="flex-1 overflow-y-auto">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Cliente</TableHeaderCell>
                    <TableHeaderCell>Teléfono</TableHeaderCell>
                    <TableHeaderCell>Estado</TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedBatchDetails.map((detail, i) => (
                    <TableRow key={i}>
                      <TableCell>{detail.customer_name}</TableCell>
                      <TableCell>{detail.phone_number}</TableCell>
                      <TableCell>
                        <Badge
                          color={
                            detail.status === "success" ? "emerald" : "rose"
                          }
                          size="xs"
                        >
                          {detail.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-6 flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setIsBatchDetailsOpen(false)}
              >
                Cerrar
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
