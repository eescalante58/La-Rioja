"use client";

import { useState } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  TextInput,
  Button,
} from "@tremor/react";
import { DollarSign, Upload } from "lucide-react";
import { generateCards } from "@/app/admin/bingo/actions";

interface Event {
  id: number;
  company_id: number;
  event_id: string;
  event_name: string;
  card_value: number;
  event_cartons_number?: number;
}

interface GenerateCardsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  onOpenUpload: () => void;
}

export default function GenerateCardsDialog({
  isOpen,
  onClose,
  event,
  onOpenUpload,
}: GenerateCardsDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleGenerateCards = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event) return;

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
      try {
        const result = await generateCards(
          event.company_id,
          event.event_id,
          start,
          end,
          price,
          deleteExisting,
        );

        if (result.success) {
          alert("Cartones generados exitosamente");
          sessionStorage.setItem("bingo_selected_tab", "1");
          window.location.reload();
        } else {
          alert("Error: " + result.error);
        }
      } catch (error) {
        console.error("Error generating cards:", error);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
          <Title className="mb-4 text-larioja-azul dark:text-larioja-amarillo">
            Generar Cartones
          </Title>
          <Text className="mb-6 text-sm">
            Evento: <span className="font-bold">{event?.event_name}</span>
          </Text>

          <form onSubmit={handleGenerateCards} className="space-y-4">
            <div className="bg-red-500 text-white p-2 text-center font-bold rounded-lg mb-4">
              MODO GENERACIÓN ACTIVO
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Número Inicial</Text>
                <TextInput name="start" type="number" placeholder="1" defaultValue="1" required />
              </div>
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Número Final</Text>
                <TextInput
                  name="end"
                  type="number"
                  placeholder="1000"
                  defaultValue={event?.event_cartons_number?.toString()}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Precio por Cartón</Text>
              <TextInput
                name="price"
                type="number"
                step="0.01"
                icon={DollarSign}
                defaultValue={event?.card_value?.toString()}
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
                <Text className="text-sm font-medium text-gray-500">¿Tienes los archivos PDF?</Text>
                <Button
                  variant="secondary"
                  icon={Upload}
                  onClick={onOpenUpload}
                  type="button"
                  className="bg-larioja-azul text-white hover:bg-blue-800"
                >
                  Subir PDFs
                </Button>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
                  Cancelar
                </Button>
                <Button type="submit" loading={loading} className="bg-larioja-verde">
                  Generar
                </Button>
              </div>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
