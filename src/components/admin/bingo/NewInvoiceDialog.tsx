"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  TextInput,
  Select,
  SelectItem,
  Button,
} from "@tremor/react";
import { Smartphone, MessageCircle, DollarSign, CheckCircle } from "lucide-react";
import {
  saveInvoice,
  updateInvoice,
  getEventCards,
  getSellersFromView,
} from "@/app/admin/bingo/actions";

interface NewInvoiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any; // null if new
  currentEvent: any;
  countries: any[];
  onSuccess: () => void;
  onWhatsApp: (invoice: any) => void;
}

export default function NewInvoiceDialog({
  isOpen,
  onClose,
  invoice,
  currentEvent,
  countries,
  onSuccess,
  onWhatsApp,
}: NewInvoiceDialogProps) {
  const [loading, setLoading] = useState(false);
  const [cardsNumber, setCardsNumber] = useState<number>(1);
  const [cardPrice, setCardPrice] = useState<number>(0);
  const [phoneArea, setPhoneArea] = useState("503");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [managerName, setInvoiceManagerName] = useState("");
  const [sellers, setSellers] = useState<string[]>([]);
  const [selectedCards, setSelectedInvoiceCards] = useState<number[]>([]);
  const [availableCards, setAvailableCardsForInvoice] = useState<any[]>([]);

  useEffect(() => {
    if (invoice) {
      setCardPrice(invoice.card_price);
      setCardsNumber(invoice.cards_number);
      setPhoneArea(invoice.phone_area || "503");
      setPhoneNumber(invoice.phone_number || "");
      setWhatsappNumber(invoice.whatsapp_number || "");
      setInvoiceManagerName(invoice.manager_name || "");
    } else if (currentEvent) {
      setCardPrice(currentEvent.cardValue);
      setCardsNumber(1);
      setPhoneArea("503");
      setPhoneNumber("");
      setWhatsappNumber("");
      setInvoiceManagerName("");
    }
  }, [invoice, currentEvent]);

  useEffect(() => {
    const area = phoneArea.replace(/\+/g, "");
    const phone = phoneNumber.replace(/\D/g, "");
    if (area || phone) {
      setWhatsappNumber(`${area}${phone}`);
    }
  }, [phoneArea, phoneNumber]);

  useEffect(() => {
    if (currentEvent) {
      loadInitialData();
    }
  }, [currentEvent, invoice]);

  const loadInitialData = async () => {
    if (!currentEvent) return;
    const [sellersRes, cardsRes] = await Promise.all([
      getSellersFromView(currentEvent.companyId, currentEvent.eventId),
      getEventCards(currentEvent.companyId, currentEvent.eventId),
    ]);

    if (sellersRes.success && sellersRes.data) {
      const uniqueSellers = Array.from(
        new Set(sellersRes.data.map((s: any) => s.sold_by).filter(Boolean)),
      ) as string[];
      setSellers(uniqueSellers.sort());
    }

    if (typeof cardsRes === "object" && "data" in cardsRes) {
      setAvailableCardsForInvoice(
        (cardsRes.data || []).filter(
          (c: any) =>
            c.card_status === "Disponible" || (invoice && c.invoice_number === invoice.invoice_number),
        ),
      );
      if (invoice) {
        const linked = (cardsRes.data || [])
          .filter((c: any) => c.invoice_number === invoice.invoice_number)
          .map((c: any) => c.card_number);
        setSelectedInvoiceCards(linked);
      } else {
        setSelectedInvoiceCards([]);
      }
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const result = invoice ? await updateInvoice(formData) : await saveInvoice(formData);

      if (result.success) {
        alert(invoice ? "Factura actualizada exitosamente" : "Factura guardada exitosamente");
        onSuccess();
        onClose();
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300 overflow-hidden flex flex-col max-h-[95vh]">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between flex-shrink-0 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md">
            <Title className="text-larioja-azul dark:text-larioja-amarillo">
              {invoice ? "Editar Factura" : "Nueva Factura"}
            </Title>
            <div className="text-xs font-bold text-gray-500">
              EVENTO: {currentEvent?.eventId}
            </div>
          </div>

          <form onSubmit={handleSave} className="flex flex-col flex-grow overflow-hidden" encType="multipart/form-data">
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              {invoice && <input type="hidden" name="id" value={invoice.id} />}
              <input type="hidden" name="company_id" value={currentEvent?.companyId} />
              <input type="hidden" name="event_id" value={currentEvent?.eventId} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">N° Factura</Text>
                  <TextInput
                    name="invoice_number"
                    placeholder="F001-000001"
                    defaultValue={invoice?.invoice_number}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Fecha</Text>
                  <input
                    name="invoice_date"
                    type="date"
                    defaultValue={invoice?.invoice_date}
                    required
                    className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-larioja-azul"
                  />
                </div>
              </div>

              {invoice?.send_whatsapp_message && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 rounded-lg">
                  <Text className="text-[10px] font-bold uppercase text-green-600 dark:text-green-400 tracking-wider mb-1 flex items-center gap-1">
                    <CheckCircle size={12} /> Registro de envío WhatsApp
                  </Text>
                  <p className="text-xs text-green-700 dark:text-green-300 italic">
                    {invoice.send_whatsapp_message}
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Nombre del Cliente</Text>
                  <TextInput
                    name="customer_name"
                    placeholder="Juan Pérez"
                    defaultValue={invoice?.customer_name}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Email del Cliente</Text>
                  <TextInput
                    name="customer_email"
                    type="email"
                    placeholder="juan@ejemplo.com"
                    defaultValue={invoice?.customer_email}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Área</Text>
                  <Select value={phoneArea} onValueChange={setPhoneArea} enableClear={false}>
                    {countries.map((country) => (
                      <SelectItem key={`${country.name}-${country.phone_code}`} value={country.phone_code}>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{country.flag_emoji}</span>
                          <span>+{country.phone_code}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </Select>
                  <input type="hidden" name="phone_area" value={phoneArea} />
                </div>
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Teléfono</Text>
                  <TextInput
                    name="phone_number"
                    placeholder="1234567"
                    value={phoneNumber}
                    onValueChange={setPhoneNumber}
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">WhatsApp</Text>
                  <div className="flex gap-2">
                    <TextInput
                      name="whatsapp_number"
                      value={whatsappNumber}
                      onValueChange={setWhatsappNumber}
                      icon={Smartphone}
                    />
                    <Button
                      type="button"
                      variant="light"
                      icon={MessageCircle}
                      className="text-green-500"
                      onClick={() => onWhatsApp(invoice)}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Vendido por (Manager)</Text>
                <input
                  name="manager_name"
                  placeholder="Nombre del vendedor..."
                  value={managerName}
                  onChange={(e) => setInvoiceManagerName(e.target.value)}
                  required
                  list="sellers-list-final"
                  autoComplete="off"
                  className="w-full text-sm border border-gray-300 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-larioja-azul/20 focus:border-larioja-azul transition-all duration-200 p-2 text-gray-900 dark:text-gray-100"
                />
                <datalist id="sellers-list-final">
                  {sellers.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Imagen de Factura</Text>
                  <input
                    type="file"
                    name="invoice_file"
                    accept="image/*,.pdf"
                    className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:bg-larioja-azul/10 file:text-larioja-azul hover:file:bg-larioja-azul/20"
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Estado</Text>
                  <Select name="status" defaultValue={invoice?.status || "pagada"} enableClear={false}>
                    <SelectItem value="pagada">Pagada</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">N° Cartones</Text>
                  <TextInput
                    name="cards_number"
                    type="number"
                    value={cardsNumber.toString()}
                    onValueChange={(v) => setCardsNumber(parseInt(v) || 0)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Valor Unitario</Text>
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
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Total</Text>
                  <TextInput
                    value={formatCurrency(cardsNumber * cardPrice)}
                    disabled
                    icon={DollarSign}
                  />
                  <input type="hidden" name="total_amount" value={cardsNumber * cardPrice} />
                </div>
              </div>

              <div className="space-y-1">
                <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                  Asociar Cartones ({selectedCards.length} de {cardsNumber})
                </Text>
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {availableCards.map((card) => (
                      <div
                        key={card.card_number}
                        className={`flex items-center justify-center p-2 rounded border cursor-pointer transition-colors text-xs font-bold ${
                          selectedCards.includes(card.card_number)
                            ? "bg-larioja-azul text-white border-larioja-azul"
                            : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-larioja-azul"
                        }`}
                        onClick={() => {
                          if (selectedCards.includes(card.card_number)) {
                            setSelectedInvoiceCards(selectedCards.filter((n) => n !== card.card_number));
                          } else if (selectedCards.length < cardsNumber) {
                            setSelectedInvoiceCards([...selectedCards, card.card_number].sort((a, b) => a - b));
                          }
                        }}
                      >
                        #{card.card_number}
                      </div>
                    ))}
                  </div>
                </div>
                <input type="hidden" name="selected_cards" value={JSON.stringify(selectedCards)} />
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 flex-shrink-0 bg-gray-50/50">
              <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
                Cancelar
              </Button>
              <Button type="submit" loading={loading} className="bg-larioja-azul">
                {invoice ? "Actualizar Factura" : "Guardar Factura"}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
