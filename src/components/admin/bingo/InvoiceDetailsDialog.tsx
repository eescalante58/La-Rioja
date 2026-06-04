"use client";

import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  Button,
  Badge,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
} from "@tremor/react";
import { X, Edit, Trash2, Smartphone, MessageCircle } from "lucide-react";

interface InvoiceDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: any;
  onEdit: (invoice: any) => void;
  onDelete: (id: string) => void;
  onWhatsApp: (invoice: any) => void;
}

export default function InvoiceDetailsDialog({
  isOpen,
  onClose,
  invoice,
  onEdit,
  onDelete,
  onWhatsApp,
}: InvoiceDetailsDialogProps) {
  if (!invoice) return null;

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
        <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
          <div className="flex justify-between items-start mb-6">
            <div>
              <Title className="text-larioja-azul dark:text-larioja-amarillo">
                Factura #{invoice.invoice_number}
              </Title>
              <Text className="text-sm">Detalle completo de la transacción</Text>
            </div>
            <Button variant="light" icon={X} onClick={onClose} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="space-y-4">
              <div>
                <Text className="text-[10px] font-bold uppercase text-gray-500">Cliente</Text>
                <Text className="font-bold">{invoice.customer_name}</Text>
                <Text className="text-xs">{invoice.customer_email || "Sin email"}</Text>
              </div>
              <div>
                <Text className="text-[10px] font-bold uppercase text-gray-500">Contacto</Text>
                <div className="flex items-center gap-2">
                  <Smartphone size={14} className="text-gray-400" />
                  <Text className="text-sm">
                    {invoice.phone_area} {invoice.phone_number}
                  </Text>
                </div>
              </div>
            </div>
            <div className="space-y-4 text-right">
              <div>
                <Text className="text-[10px] font-bold uppercase text-gray-500">Estado</Text>
                <Badge color={invoice.status === "pagada" ? "emerald" : "amber"} size="xs">
                  {invoice.status.toUpperCase()}
                </Badge>
              </div>
              <div>
                <Text className="text-[10px] font-bold uppercase text-gray-500">Total Pagado</Text>
                <Text className="text-2xl font-black text-larioja-azul dark:text-larioja-amarillo">
                  {formatCurrency(invoice.total_amount)}
                </Text>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
            <Button
              variant="secondary"
              icon={MessageCircle}
              className="text-green-600"
              onClick={() => onWhatsApp(invoice)}
            >
              WhatsApp
            </Button>
            <Button variant="secondary" icon={Edit} onClick={() => onEdit(invoice)}>
              Editar
            </Button>
            <Button variant="light" icon={Trash2} color="rose" onClick={() => onDelete(invoice.id)}>
              Eliminar
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
