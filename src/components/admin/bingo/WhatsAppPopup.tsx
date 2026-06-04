"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  TextInput,
  Button,
} from "@tremor/react";
import {
  MessageCircle,
  Smartphone,
  Upload,
  ExternalLink,
  FileText,
  Ticket,
} from "lucide-react";
import {
  getWhatsAppMessageTemplate,
  getCardsForInvoice,
  sendWhatsAppAutomation,
  updateInvoiceWhatsAppStatus,
} from "@/app/admin/bingo/actions";

interface WhatsAppPopupProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
}

export default function WhatsAppPopup({
  isOpen,
  onClose,
  invoice,
}: WhatsAppPopupProps) {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [template, setTemplate] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [image, setImage] = useState("");
  const [number, setNumber] = useState("");
  const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
  const [cardUrls, setCardUrls] = useState<string[]>([]);

  useEffect(() => {
    if (invoice && isOpen) {
      setNumber(
        invoice.whatsapp_number ||
          `${invoice.phone_area}${invoice.phone_number}`,
      );
      loadData();
    }
  }, [invoice, isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [tplRes, cardsRes] = await Promise.all([
        getWhatsAppMessageTemplate(),
        getCardsForInvoice(
          invoice.company_id,
          invoice.event_id,
          invoice.invoice_number,
        ),
      ]);

      if (tplRes.success && tplRes.data) {
        setTemplate(tplRes.data);
        let msg = tplRes.data.description || "";
        msg = msg.replace("[customer_name]", invoice.customer_name || "");
        msg = msg.replace(
          "[cards_number]",
          (invoice.cards_number || 0).toString(),
        );
        setMessage(msg);
        setImage(tplRes.data.image_url || "");
      }

      if (cardsRes.success && cardsRes.data) {
        const urls = cardsRes.data.map((c: any) => c.image_url).filter(Boolean);
        setCardUrls(urls);
      }
      setInvoiceUrl(invoice.url_invoice || null);
    } catch (error) {
      console.error("Error loading WhatsApp data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    setSending(true);
    try {
      const cleanNumber = number.replace(/\D/g, "");
      const res = await sendWhatsAppAutomation({
        to: cleanNumber,
        message: message,
        templateImage: image || undefined,
        invoiceUrl: invoiceUrl || undefined,
        cardUrls: cardUrls,
      });

      if (res.success) {
        const status = `Enviado Automáticamente vía Ultramsg el ${new Date().toLocaleString()}. Incluyó factura y ${cardUrls.length} cartones.`;
        await updateInvoiceWhatsAppStatus(invoice.id, status);
        alert("¡Envío automático completado!");
        onClose();
      } else {
        // Fallback to manual
        const encoded = encodeURIComponent(message);
        window.open(
          `https://web.whatsapp.com/send?phone=${cleanNumber}&text=${encoded}`,
          "_blank",
        );
        const status = `Enviado exitosamente (Manual) el ${new Date().toLocaleString()}. Incluyó factura y ${cardUrls.length} cartones.`;
        await updateInvoiceWhatsAppStatus(invoice.id, status);
        onClose();
      }
    } catch (error) {
      console.error("Error sending WhatsApp:", error);
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-[60]" />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <DialogPanel className="max-w-xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[90vh] overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-larioja-azul/5">
            <div className="flex items-center gap-3">
              <MessageCircle size={24} className="text-green-600" />
              <Title>Enviar por WhatsApp</Title>
            </div>
          </div>

          <div className="p-6 overflow-y-auto space-y-6 custom-scrollbar">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-500">
                Número
              </label>
              <TextInput
                value={number}
                onValueChange={setNumber}
                icon={Smartphone}
              />
            </div>

            {image && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-gray-500">
                  Imagen
                </label>
                <img
                  src={image}
                  className="w-full h-auto rounded-lg border border-gray-100"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-500">
                Mensaje
              </label>
              <textarea
                className="w-full h-32 p-3 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent dark:text-white focus:ring-2 focus:ring-larioja-azul resize-none"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500">
                  Factura
                </label>
                {invoiceUrl ? (
                  <div className="flex items-center gap-2 p-2 border rounded-lg">
                    <FileText size={20} className="text-red-500" />
                    <Text className="text-[10px] truncate">
                      Factura Adjunta
                    </Text>
                  </div>
                ) : (
                  <Text className="text-xs text-gray-400">Sin factura</Text>
                )}
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-500">
                  Cartones ({cardUrls.length})
                </label>
                <div className="flex gap-1">
                  {cardUrls.slice(0, 3).map((_, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center"
                    >
                      <Ticket size={12} className="text-blue-600" />
                    </div>
                  ))}
                  {cardUrls.length > 3 && (
                    <Text className="text-[10px]">+{cardUrls.length - 3}</Text>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3 bg-gray-50/50">
            <Button variant="secondary" onClick={onClose} disabled={sending}>
              Cerrar
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              icon={MessageCircle}
              onClick={handleSend}
              loading={sending}
            >
              Enviar Automático
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
