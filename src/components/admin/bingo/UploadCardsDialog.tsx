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
import { DollarSign, Upload, FileIcon } from "lucide-react";
import { uploadCardImages } from "@/app/admin/bingo/actions";

interface Event {
  id: number;
  company_id: number;
  event_id: string;
  event_name: string;
  card_value: number;
}

interface UploadCardsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

export default function UploadCardsDialog({ isOpen, onClose, event }: UploadCardsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<FileList | null>(null);

  const handleUploadCards = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event || !uploadingFiles || uploadingFiles.length === 0) {
      alert("Por favor selecciona los archivos PDF.");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    for (let i = 0; i < uploadingFiles.length; i++) {
      formData.append("files", uploadingFiles[i]);
    }

    const price = parseFloat(
      (e.currentTarget.elements.namedItem("card_price") as HTMLInputElement).value,
    );
    const deleteExisting = formData.get("delete_existing_upload") === "on";

    const confirmMessage = deleteExisting
      ? `¿Estás seguro de ELIMINAR los cartones disponibles existentes y subir estos ${uploadingFiles.length} nuevos?`
      : `¿Deseas subir estos ${uploadingFiles.length} cartones?`;

    if (!confirm(confirmMessage)) {
      setLoading(false);
      return;
    }

    try {
      const result = await uploadCardImages(
        event.company_id,
        event.event_id,
        price,
        formData,
      );

      if ("success_count" in result && result.success_count > 0) {
        let message = `Se cargaron exitosamente ${result.success_count} cartones.`;
        if (result.error_count > 0) {
          message += `\nHubo ${result.error_count} errores:\n` + result.errors.slice(0, 5).join("\n");
        }
        alert(message);
        sessionStorage.setItem("bingo_selected_tab", "1");
        window.location.reload();
      } else if ("errors" in result) {
        alert("Error al cargar cartones:\n" + result.errors.join("\n"));
      } else if ("error" in result) {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error uploading cards:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-larioja-azul/10 p-2 rounded-lg text-larioja-azul">
              <Upload size={24} />
            </div>
            <Title>Subir Imágenes de Cartones</Title>
          </div>

          <Text className="mb-6 text-sm">
            Evento: <span className="font-bold">{event?.event_name}</span>
            <br />
            <span className="text-xs text-gray-500 italic">
              Patrón: SERIAL_{event?.event_id}_Carton_#.pdf
            </span>
          </Text>

          <form onSubmit={handleUploadCards} className="space-y-4">
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Precio por Cartón</Text>
              <TextInput
                name="card_price"
                type="number"
                step="0.01"
                icon={DollarSign}
                defaultValue={event?.card_value?.toString()}
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
              <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
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
  );
}
