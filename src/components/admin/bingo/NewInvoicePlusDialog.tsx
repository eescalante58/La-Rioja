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
import { Smartphone, DollarSign, Search } from "lucide-react";
import {
  saveInvoice,
  getSellersFromView,
  checkCardsRange,
} from "@/app/admin/bingo/actions";
import { redirectIfSessionExpired } from "@/lib/auth/sessionFeedback";

interface NewInvoicePlusDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentEvent: any;
  countries: any[];
  onSuccess: () => void;
  onWhatsApp: (invoice: any) => void;
}

export default function NewInvoicePlusDialog({
  isOpen,
  onClose,
  currentEvent,
  countries,
  onSuccess,
}: NewInvoicePlusDialogProps) {
  const [loading, setLoading] = useState(false);
  const [checkingRange, setCheckingRange] = useState(false);
  const [cardsNumber, setCardsNumber] = useState<number>(1);
  const [cardPrice, setCardPrice] = useState<number>(0);
  const [phoneArea, setPhoneArea] = useState("503");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [managerName, setInvoiceManagerName] = useState("");
  const [sellers, setSellers] = useState<string[]>([]);
  const [selectedCards, setSelectedInvoiceCards] = useState<number[]>([]);
  const [fromCard, setFromCard] = useState("");
  const [toCard, setToCard] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string>("efectivo");
  const [status, setStatus] = useState<string>("pagada");
  const [invoiceDate, setInvoiceDate] = useState<string>("");
  const [observation, setObservation] = useState<string>("");
  const [customerName, setCustomerName] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");

  const todayLocal = () => new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    if (currentEvent && isOpen) {
      setCardPrice(currentEvent.cardValue);
      setCardsNumber(1);
      setPhoneArea("503");
      setPhoneNumber("");
      setWhatsappNumber("");
      setInvoiceManagerName("");
      setPaymentMethod("efectivo");
      setStatus("pagada");
      setInvoiceDate(todayLocal());
      setObservation("");
      setSelectedInvoiceCards([]);
      setCustomerName("");
      setInvoiceNumber("");
      setFromCard("");
      setToCard("");
      loadInitialData();
    }
  }, [currentEvent, isOpen]);

  useEffect(() => {
    const area = phoneArea.replace(/\+/g, "");
    const phone = phoneNumber.replace(/\D/g, "");
    if (area || phone) {
      setWhatsappNumber(`${area}${phone}`);
    }
  }, [phoneArea, phoneNumber]);

  const loadInitialData = async () => {
    if (!currentEvent) return;
    const sellersRes = await getSellersFromView(currentEvent.companyId, currentEvent.eventId);
    if (sellersRes.success && sellersRes.data) {
      const uniqueSellers = Array.from(
        new Set(sellersRes.data.map((s: any) => s.sold_by).filter(Boolean)),
      ) as string[];
      setSellers(uniqueSellers.sort());
    }
  };

  const handleVerifyRange = async () => {
    if (!fromCard || !toCard) {
      alert("Por favor ingrese ambos números del rango.");
      return;
    }
    const start = parseInt(fromCard);
    const end = parseInt(toCard);
    if (isNaN(start) || isNaN(end)) {
      alert("Números de cartón inválidos.");
      return;
    }
    if (end < start) {
      alert("El cartón 'Hasta' debe ser igual o mayor que el cartón 'Desde'.");
      return;
    }

    setCheckingRange(true);
    try {
      const result = await checkCardsRange(currentEvent.companyId, currentEvent.eventId, start, end);
      if (result?.success) {
        const newNums = (result.data || []).map((c: any) => c.card_number);
        // Combine with existing selection
        const combined = Array.from(new Set([...selectedCards, ...newNums])).sort((a, b) => a - b);
        
        if (combined.length > cardsNumber) {
          alert(`El rango cargado excederá la cantidad de cartones permitida (${cardsNumber}). Se truncará la lista.`);
          setSelectedInvoiceCards(combined.slice(0, cardsNumber));
        } else {
          setSelectedInvoiceCards(combined);
        }
      } else if (!redirectIfSessionExpired(result)) {
        alert("Error: " + (result?.error || "No se pudo verificar el rango."));
      }
    } catch (error: any) {
      alert("Error al verificar rango: " + error.message);
    } finally {
      setCheckingRange(false);
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedCards.length === 0) {
      alert("Debe asociar al menos un cartón a la factura.");
      return;
    }
    if (selectedCards.length !== cardsNumber) {
      alert(`Debe asociar exactamente ${cardsNumber} cartones (actualmente hay ${selectedCards.length} seleccionados).`);
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);

    try {
      const result = await saveInvoice(formData);
      if (result?.success) {
        alert("Factura Plus guardada exitosamente");
        onSuccess();
        onClose();
      } else if (!redirectIfSessionExpired(result)) {
        alert("Error: " + (result?.error || "No se pudo guardar la factura."));
      }
    } catch (error: any) {
      console.error("Error saving invoice:", error);
      alert("Error inesperado: " + (error.message || "Consulte la consola para más detalles"));
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
            <Title className="text-larioja-azul dark:text-larioja-amarillo">Nueva Factura Plus</Title>
            <div className="text-right text-xs font-bold text-gray-500 space-y-0.5">
              <div>EVENTO: {currentEvent?.eventId}</div>
              {(invoiceNumber || customerName) && (
                <div className="text-larioja-azul dark:text-larioja-amarillo">
                  FACTURA #{invoiceNumber || "—"} {customerName ? `— ${customerName}` : ""}
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSave} className="flex flex-col flex-grow overflow-hidden" encType="multipart/form-data">
            <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
              <input type="hidden" name="company_id" value={currentEvent?.companyId} />
              <input type="hidden" name="event_id" value={currentEvent?.eventId} />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">N° Factura</Text>
                  <TextInput
                    name="invoice_number"
                    placeholder="F001-000001"
                    value={invoiceNumber}
                    onValueChange={setInvoiceNumber}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Fecha</Text>
                  <input
                    name="invoice_date"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    required
                    className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-larioja-azul"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Nombre del Cliente</Text>
                  <TextInput
                    name="customer_name"
                    placeholder="Juan Pérez"
                    value={customerName}
                    onValueChange={setCustomerName}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Email del Cliente</Text>
                  <TextInput
                    name="customer_email"
                    type="email"
                    placeholder="juan@ejemplo.com"
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
                          <img
                            src={`https://flagcdn.com/w20/${country.iso2.toLowerCase()}.png`}
                            alt={country.name}
                            className="h-3.5 w-5 rounded-[2px] object-cover"
                          />
                          <span>{country.phone_code}</span>
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
                  <TextInput
                    name="whatsapp_number"
                    value={whatsappNumber}
                    onValueChange={setWhatsappNumber}
                    icon={Smartphone}
                  />
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
                  list="sellers-list-plus"
                  autoComplete="off"
                  className="w-full text-sm border border-gray-300 dark:border-gray-800 rounded-lg bg-white dark:bg-gray-900 focus:ring-2 focus:ring-larioja-azul/20 focus:border-larioja-azul transition-all duration-200 p-2 text-gray-900 dark:text-gray-100"
                />
                <datalist id="sellers-list-plus">
                  {sellers.map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Método de Pago</Text>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod} enableClear={false}>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                    <SelectItem value="tarjeta debito">Tarjeta Débito</SelectItem>
                    <SelectItem value="tarjeta credito">Tarjeta Crédito</SelectItem>
                  </Select>
                  <input type="hidden" name="payment_method" value={paymentMethod} />
                </div>
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Estado</Text>
                  <Select value={status} onValueChange={setStatus} enableClear={false}>
                    <SelectItem value="pagada">Pagada</SelectItem>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                  </Select>
                  <input type="hidden" name="status" value={status} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">N° Cartones</Text>
                  <TextInput
                    name="cards_number"
                    type="number"
                    value={cardsNumber.toString()}
                    onValueChange={(v) => {
                      const n = parseInt(v) || 0;
                      setCardsNumber(n);
                      setSelectedInvoiceCards((prev) =>
                        prev.length > n ? prev.slice(0, Math.max(0, n)) : prev,
                      );
                    }}
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
                <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Observación</Text>
                <textarea
                  name="observation"
                  placeholder="Detalles adicionales de la factura..."
                  value={observation}
                  onChange={(e) => setObservation(e.target.value)}
                  className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-larioja-azul min-h-[80px] resize-none"
                />
              </div>

              <div className="space-y-1">
                <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                  Asociar Cartones ({selectedCards.length} de {cardsNumber})
                </Text>
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50 dark:bg-gray-800/50">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {selectedCards.map((num) => (
                      <div
                        key={num}
                        className="flex items-center justify-center p-2 rounded border cursor-pointer transition-colors text-xs font-bold bg-larioja-azul text-white border-larioja-azul hover:bg-rose-600 hover:border-rose-600"
                        onClick={() => {
                          setSelectedInvoiceCards(selectedCards.filter((n) => n !== num));
                        }}
                      >
                        #{num}
                      </div>
                    ))}
                    {selectedCards.length === 0 && (
                      <div className="col-span-full py-4 text-center text-gray-400 italic text-xs">
                        Utilice el selector de rango inferior para cargar cartones...
                      </div>
                    )}
                  </div>
                </div>
                <input type="hidden" name="associated_cards" value={JSON.stringify(selectedCards)} />
              </div>

              <div className="p-4 bg-larioja-azul/5 dark:bg-larioja-azul/10 rounded-xl border border-larioja-azul/20 space-y-4">
                <div className="flex items-end gap-4">
                  <div className="flex-grow grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Desde Cartón</Text>
                      <TextInput 
                        type="number" 
                        placeholder="xxxxxx" 
                        value={fromCard}
                        onValueChange={setFromCard}
                      />
                    </div>
                    <div className="space-y-1">
                      <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Hasta Cartón</Text>
                      <TextInput 
                        type="number" 
                        placeholder="xxxxxx" 
                        value={toCard}
                        onValueChange={setToCard}
                      />
                    </div>
                  </div>
                  <Button 
                    type="button" 
                    icon={Search} 
                    className="bg-larioja-azul"
                    onClick={handleVerifyRange}
                    loading={checkingRange}
                  >
                    Verificar
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 flex-shrink-0 bg-gray-50/50">
              <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
                Cancelar
              </Button>
              <Button type="submit" loading={loading} className="bg-larioja-azul">
                Guardar Factura
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
