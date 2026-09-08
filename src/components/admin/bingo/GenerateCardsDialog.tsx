"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  TextInput,
  Button,
  Select,
  SelectItem,
} from "@tremor/react";
import { DollarSign, Upload, AlertCircle } from "lucide-react";
import { generateCards } from "@/app/admin/bingo/actions";

interface Event {
  id: number;
  company_id: number;
  event_id: string;
  event_name: string;
  card_value: number;
  event_cartons_number?: number;
}

export interface GenerateConfig {
  start: number;
  end: number;
  price: number;
  cardType: "Virtual" | "Fisico";
  deleteExisting: boolean;
}

interface GenerateCardsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  onOpenUpload: (config: GenerateConfig) => void;
}

export default function GenerateCardsDialog({
  isOpen,
  onClose,
  event,
  onOpenUpload,
}: GenerateCardsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [startNumber, setStartNumber] = useState<string>("1");
  const [endNumber, setEndNumber] = useState<string>(event?.event_cartons_number?.toString() || "1000");
  const [cardPrice, setCardPrice] = useState<string>(event?.card_value?.toString() || "10");
  const [cardType, setCardType] = useState<string>("Virtual");
  const [deleteExisting, setDeleteExisting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && event) {
      setStartNumber("1");
      setEndNumber(event.event_cartons_number ? event.event_cartons_number.toString() : "1000");
      setCardPrice(event.card_value ? event.card_value.toString() : "10");
      setCardType("Virtual");
      setDeleteExisting(false);
    }
  }, [isOpen, event]);

  const parsedStart = parseInt(startNumber, 10);
  const parsedEnd = parseInt(endNumber, 10);
  const isStartValid = !isNaN(parsedStart) && parsedStart > 0;
  const isEndValid = !isNaN(parsedEnd) && parsedEnd > 0;
  const isRangeValid = isStartValid && isEndValid && parsedEnd >= parsedStart;

  const handleGenerateCards = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event) return;

    if (!isStartValid) {
      alert("El Número Inicial debe ser un número entero mayor a 0.");
      return;
    }

    if (!isEndValid) {
      alert("El Número Final debe ser un número entero mayor a 0.");
      return;
    }

    if (parsedEnd < parsedStart) {
      alert(`El Número Final (${parsedEnd}) debe ser mayor o igual que el Número Inicial (${parsedStart}).`);
      return;
    }

    setLoading(true);
    const start = parsedStart;
    const end = parsedEnd;
    const price = parseFloat(cardPrice) || 0;
    const type = cardType as "Virtual" | "Fisico";

    if (end - start + 1 > 5000) {
      alert("Por seguridad, no puedes generar más de 5,000 cartones por lote.");
      setLoading(false);
      return;
    }

    const message = deleteExisting
      ? `¿Estás seguro de ELIMINAR TODOS los cartones existentes de este evento y generar ${end - start + 1} cartones nuevos de tipo ${type}? Esta acción no se puede deshacer.`
      : `¿Estás seguro de generar ${end - start + 1} cartones de tipo ${type}? Si ya existen en este rango, sus valores se actualizarán.`;

    if (confirm(message)) {
      try {
        const result = await generateCards(
          event.company_id,
          event.event_id,
          start,
          end,
          price,
          type,
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

  const handleOpenUpload = () => {
    if (!isStartValid) {
      alert("El Número Inicial debe ser un número entero mayor a 0.");
      return;
    }

    if (!isEndValid) {
      alert("El Número Final debe ser un número entero mayor a 0.");
      return;
    }

    if (parsedEnd < parsedStart) {
      alert(`El Número Final (${parsedEnd}) debe ser mayor o igual que el Número Inicial (${parsedStart}).`);
      return;
    }

    onOpenUpload({
      start: parsedStart,
      end: parsedEnd,
      price: parseFloat(cardPrice) || 0,
      cardType: (cardType === "Fisico" || cardType === "Físico") ? "Fisico" : "Virtual",
      deleteExisting,
    });
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
            <br />
            ID: <span className="font-mono text-xs text-gray-500">{event?.event_id}</span>
          </Text>

          <form onSubmit={handleGenerateCards} className="space-y-4">
            <div className="bg-red-500 text-white p-2 text-center font-bold rounded-lg mb-4">
              MODO GENERACIÓN ACTIVO
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Número Inicial</Text>
                <TextInput
                  name="start"
                  type="number"
                  value={startNumber}
                  onChange={(e) => setStartNumber(e.target.value)}
                  min={1}
                  required
                />
              </div>
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Número Final</Text>
                <TextInput
                  name="end"
                  type="number"
                  value={endNumber}
                  onChange={(e) => setEndNumber(e.target.value)}
                  min={1}
                  required
                />
              </div>
            </div>

            {isStartValid && isEndValid && parsedEnd < parsedStart && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/40 p-2.5 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-400">
                <AlertCircle size={15} className="shrink-0" />
                <span>
                  El <strong>Número Final ({parsedEnd})</strong> debe ser mayor o igual que el <strong>Número Inicial ({parsedStart})</strong>.
                </span>
              </div>
            )}

            {isRangeValid && (
              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 p-2.5 rounded-lg flex items-center justify-between text-xs text-blue-800 dark:text-blue-300">
                <span className="font-medium">Total de cartones a generar:</span>
                <span className="font-bold bg-blue-200/60 dark:bg-blue-800/60 px-2 py-0.5 rounded">
                  {parsedEnd - parsedStart + 1} cartones (#{parsedStart} al #{parsedEnd})
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Precio por Cartón</Text>
                <TextInput
                  name="price"
                  type="number"
                  step="0.01"
                  icon={DollarSign}
                  value={cardPrice}
                  onChange={(e) => setCardPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Tipo de Cartón</Text>
                <Select value={cardType} onValueChange={setCardType} enableClear={false}>
                  <SelectItem value="Virtual">Virtual</SelectItem>
                  <SelectItem value="Fisico">Físico</SelectItem>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="delete_existing"
                name="delete_existing"
                checked={deleteExisting}
                onChange={(e) => setDeleteExisting(e.target.checked)}
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
                  onClick={handleOpenUpload}
                  type="button"
                  disabled={!isRangeValid}
                  className="bg-larioja-azul text-white hover:bg-blue-800 disabled:opacity-50"
                >
                  Subir PDFs
                </Button>
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  loading={loading} 
                  disabled={!isRangeValid}
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
  );
}

