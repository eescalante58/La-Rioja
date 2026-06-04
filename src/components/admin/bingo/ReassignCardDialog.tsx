"use client";

import { useState } from "react";
import { Dialog, DialogPanel, Title, Text, TextInput, Button } from "@tremor/react";
import { RefreshCw } from "lucide-react";
import { updateCardType } from "@/app/admin/bingo/actions";

interface ReassignCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  card: any;
  event: any;
  onSuccess: () => void;
}

export default function ReassignCardDialog({
  isOpen,
  onClose,
  card,
  event,
  onSuccess,
}: ReassignCardDialogProps) {
  const [loading, setLoading] = useState(false);
  const [officialName, setOfficialName] = useState("");

  const handleReassignType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!card || !event) return;

    setLoading(true);
    const newType = card.card_type === "Virtual" ? "Fisico" : "Virtual";

    try {
      const result = await updateCardType(
        event.company_id,
        event.event_id,
        card.card_number,
        newType,
        officialName,
      );

      if (result.success) {
        alert(`Tipo de cartón cambiado a ${newType} exitosamente.`);
        setOfficialName("");
        onSuccess();
        onClose();
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error reassigning card type:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-[60]" />
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-larioja-azul/10 p-2 rounded-lg text-larioja-azul">
              <RefreshCw size={24} />
            </div>
            <Title>Cambiar Tipo de Cartón</Title>
          </div>

          <Text className="mb-6 text-sm">
            Estás por cambiar el tipo del cartón <span className="font-bold">#{card?.card_number}</span>{" "}
            de <span className="font-bold">{card?.card_type}</span> a{" "}
            <span className="font-bold">{card?.card_type === "Virtual" ? "Fisico" : "Virtual"}</span>.
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
              <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
                Cancelar
              </Button>
              <Button type="submit" loading={loading} className="bg-larioja-azul">
                Confirmar Cambio
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
