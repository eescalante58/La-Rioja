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
import {
  uploadSingleCardImage,
  clearEventCards,
  logUploadActivity,
  verifyUpload,
} from "@/app/admin/bingo/actions";
import { CheckCircle2, AlertCircle, XCircle } from "lucide-react";

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
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [currentCardNumber, setCurrentCardNumber] = useState<number | null>(null);
  const [uploadSummary, setUploadSummary] = useState<{
    success: number;
    errors: number;
    total: number;
    dbCount: number;
    errorList: string[];
  } | null>(null);

  const handleClose = () => {
    if (uploadSummary) {
      sessionStorage.setItem("bingo_selected_tab", "1");
      window.location.reload();
    } else {
      onClose();
    }
  };

  const handleUploadCards = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event || !uploadingFiles || uploadingFiles.length === 0) {
      alert("Por favor selecciona los archivos PDF.");
      return;
    }

    const price = parseFloat(
      (e.currentTarget.elements.namedItem("card_price") as HTMLInputElement).value,
    );
    const deleteExisting = (e.currentTarget.elements.namedItem("delete_existing_upload") as HTMLInputElement).checked;

    const confirmMessage = deleteExisting
      ? `¿Estás seguro de ELIMINAR los cartones disponibles existentes y subir estos ${uploadingFiles.length} nuevos?`
      : `¿Deseas subir estos ${uploadingFiles.length} cartones?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    setLoading(true);
    setCurrentFileIndex(0);
    setUploadSummary(null);

    try {
      // 1. If requested, clear existing cards first
      if (deleteExisting) {
        const clearResult = await clearEventCards(event.company_id, event.event_id);
        if (clearResult.error) {
          alert("Error al limpiar cartones previos: " + clearResult.error);
          setLoading(false);
          return;
        }
      }

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // 2. Upload files one by one to track progress
      for (let i = 0; i < uploadingFiles.length; i++) {
        const file = uploadingFiles[i];
        setCurrentFileIndex(i + 1);
        
        // Extract card number for UI feedback
        const match = file.name.match(/_Carton_(\d+)\.pdf$/i);
        if (match) {
          setCurrentCardNumber(parseInt(match[1]));
        }

        const result = await uploadSingleCardImage(
          event.company_id,
          event.event_id,
          price,
          file.name,
          file
        );

        if (result.success) {
          successCount++;
        } else {
          errorCount++;
          errors.push(result.error || `Error en archivo ${file.name}`);
        }
      }

      // 3. Final verification with DB
      const verifyResult = await verifyUpload(event.company_id, event.event_id);
      const dbCount = verifyResult.success ? verifyResult.count : 0;

      // 4. Log the activity summary
      if (successCount > 0) {
        await logUploadActivity(event.company_id, event.event_id, {
          success_count: successCount,
          error_count: errorCount,
          deleted_previous: deleteExisting,
          total_files: uploadingFiles.length,
          verified_db_count: dbCount,
        });
      }

      setUploadSummary({
        success: successCount,
        errors: errorCount,
        total: uploadingFiles.length,
        dbCount: dbCount as number,
        errorList: errors,
      });

    } catch (error) {
      console.error("Error uploading cards:", error);
    } finally {
      setLoading(false);
      setCurrentCardNumber(null);
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
          {!uploadSummary ? (
            <>
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
                      disabled={loading}
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
                    disabled={loading}
                  />
                  <label
                    htmlFor="delete_existing_upload"
                    className="text-sm text-gray-600 font-medium cursor-pointer"
                  >
                    Limpiar cartones existentes antes de subir
                  </label>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  {loading && (
                    <div className="flex-1 flex flex-col justify-center">
                      <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                        <div 
                          className="bg-larioja-azul h-1.5 rounded-full transition-all duration-300" 
                          style={{ width: `${(currentFileIndex / (uploadingFiles?.length || 1)) * 100}%` }}
                        ></div>
                      </div>
                      <Text className="text-[10px] mt-1 text-larioja-azul font-bold">
                        Cargando cartón {currentCardNumber ? `#${currentCardNumber}` : ""} ({currentFileIndex}/{uploadingFiles?.length})
                      </Text>
                    </div>
                  )}
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
            </>
          ) : (
            <div className="py-2">
              <div className="flex items-center gap-3 mb-6">
                {uploadSummary.errors === 0 ? (
                  <div className="bg-larioja-verde/10 p-2 rounded-lg text-larioja-verde">
                    <CheckCircle2 size={32} />
                  </div>
                ) : uploadSummary.success > 0 ? (
                  <div className="bg-yellow-500/10 p-2 rounded-lg text-yellow-600">
                    <AlertCircle size={32} />
                  </div>
                ) : (
                  <div className="bg-red-500/10 p-2 rounded-lg text-red-600">
                    <XCircle size={32} />
                  </div>
                )}
                <div>
                  <Title>Resultado de la Carga</Title>
                  <Text className="text-sm">Proceso finalizado</Text>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                  <Text className="text-xs font-bold uppercase text-gray-400 mb-1">Cargados</Text>
                  <div className="text-2xl font-bold text-larioja-verde">{uploadSummary.success}</div>
                  <Text className="text-[10px] text-gray-500">Exitosamente</Text>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                  <Text className="text-xs font-bold uppercase text-gray-400 mb-1">Errores</Text>
                  <div className={`text-2xl font-bold ${uploadSummary.errors > 0 ? 'text-red-500' : 'text-gray-400'}`}>
                    {uploadSummary.errors}
                  </div>
                  <Text className="text-[10px] text-gray-500">Fallidos</Text>
                </div>
              </div>

              <div className="mb-6 space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <Text className="text-sm font-medium">Total de archivos procesados:</Text>
                  <Text className="text-sm font-bold">{uploadSummary.total}</Text>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-800">
                  <Text className="text-sm font-medium">Cartones totales en BD:</Text>
                  <Text className="text-sm font-bold text-larioja-azul">{uploadSummary.dbCount}</Text>
                </div>
              </div>

              {uploadSummary.errorList.length > 0 && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/10 rounded-xl border border-red-100 dark:border-red-900/20 max-h-32 overflow-y-auto">
                  <Text className="text-xs font-bold text-red-600 mb-2 uppercase">Detalle de Errores:</Text>
                  <ul className="space-y-1">
                    {uploadSummary.errorList.slice(0, 10).map((err, idx) => (
                      <li key={idx} className="text-[10px] text-red-500 list-disc ml-3">
                        {err}
                      </li>
                    ))}
                    {uploadSummary.errorList.length > 10 && (
                      <li className="text-[10px] text-red-400 italic ml-3">
                        ... y {uploadSummary.errorList.length - 10} errores más
                      </li>
                    )}
                  </ul>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button 
                  onClick={handleClose}
                  className="bg-larioja-azul w-full sm:w-auto"
                >
                  Finalizar y Actualizar
                </Button>
              </div>
            </div>
          )}
        </DialogPanel>
      </div>
    </Dialog>
  );
}
