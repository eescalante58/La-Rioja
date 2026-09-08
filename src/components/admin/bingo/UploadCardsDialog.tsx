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
import {
  DollarSign,
  Upload,
  FileIcon,
  CheckCircle2,
  AlertCircle,
  XCircle,
  ImageIcon,
  FileText,
  Trash2,
  CloudUpload,
  Check,
  Loader2,
  Minus,
} from "lucide-react";
import {
  uploadCardsBatch,
  uploadSingleCardImage,
  clearEventCards,
  logUploadActivity,
  verifyUpload,
} from "@/app/admin/bingo/actions";

interface Event {
  id: number;
  company_id: number;
  event_id: string;
  event_name: string;
  card_value: number;
  event_cartons_number?: number;
}

export interface UploadConfig {
  start?: number;
  end?: number;
  price?: number;
  cardType?: "Virtual" | "Fisico";
  deleteExisting?: boolean;
}

interface UploadCardsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  initialConfig?: UploadConfig | null;
}

export default function UploadCardsDialog({
  isOpen,
  onClose,
  event,
  initialConfig,
}: UploadCardsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<FileList | null>(null);
  const [currentFileIndex, setCurrentFileIndex] = useState<number>(0);
  const [isClearing, setIsClearing] = useState<boolean>(false);
  const [currentCardNumber, setCurrentCardNumber] = useState<number | null>(null);
  const [invalidFiles, setInvalidFiles] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [startNumber, setStartNumber] = useState<string>(initialConfig?.start?.toString() ?? "1");
  const [endNumber, setEndNumber] = useState<string>(
    initialConfig?.end?.toString() ?? (event?.event_cartons_number?.toString() ?? "1000")
  );
  const [cardPrice, setCardPrice] = useState<string>(
    initialConfig?.price?.toString() ?? (event?.card_value?.toString() ?? "10")
  );
  const [cardType, setCardType] = useState<"Virtual" | "Fisico">(initialConfig?.cardType ?? "Virtual");
  const [deleteExisting, setDeleteExisting] = useState<boolean>(initialConfig?.deleteExisting ?? false);

  useEffect(() => {
    if (isOpen) {
      if (initialConfig) {
        setStartNumber(initialConfig.start?.toString() ?? "1");
        setEndNumber(initialConfig.end?.toString() ?? (event?.event_cartons_number?.toString() ?? "1000"));
        setCardPrice(initialConfig.price?.toString() ?? (event?.card_value?.toString() ?? "10"));
        setCardType(initialConfig.cardType ?? "Virtual");
        setDeleteExisting(initialConfig.deleteExisting ?? false);
      } else if (event) {
        setStartNumber("1");
        setEndNumber(event.event_cartons_number ? event.event_cartons_number.toString() : "1000");
        setCardPrice(event.card_value ? event.card_value.toString() : "10");
        setCardType("Virtual");
        setDeleteExisting(false);
      }
      setUploadingFiles(null);
      setInvalidFiles([]);
      setStatusMessage(null);
      setUploadSummary(null);
    }
  }, [isOpen, initialConfig, event]);

  const parsedStart = parseInt(startNumber, 10);
  const parsedEnd = parseInt(endNumber, 10);
  const isStartValid = !isNaN(parsedStart) && parsedStart > 0;
  const isEndValid = !isNaN(parsedEnd) && parsedEnd > 0;
  const isRangeValid = isStartValid && isEndValid && parsedEnd >= parsedStart;
  const expectedTotal = isRangeValid ? (parsedEnd - parsedStart + 1) : 0;

  const [processSteps, setProcessSteps] = useState<{
    validation: 'pending' | 'running' | 'completed' | 'error';
    clearing: 'pending' | 'running' | 'completed' | 'skipped';
    uploading: 'pending' | 'running' | 'completed';
  }>({
    validation: 'pending',
    clearing: 'pending',
    uploading: 'pending',
  });
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

    // 0. Range validation
    if (!isStartValid) {
      alert("El Número Inicial debe ser un número entero mayor a 0.");
      return;
    }
    if (!isEndValid) {
      alert("El Número Final debe ser un número entero mayor a 0.");
      return;
    }
    if (parsedEnd < parsedStart) {
      alert(`El rango de cartones no es válido: El Número Final (${parsedEnd}) debe ser mayor o igual al Número Inicial (${parsedStart}).`);
      return;
    }

    // 1. Extract values
    const currentEvent = event;
    const filesList = uploadingFiles;
    const start = parsedStart;
    const end = parsedEnd;
    const price = parseFloat(cardPrice) || 0;
    const type = cardType;
    const deletePrevious = deleteExisting;

    const expectedTotal = end - start + 1;
    if (filesList.length !== expectedTotal) {
      const msg = `La cantidad de archivos seleccionados (${filesList.length}) no coincide con el rango indicado (${expectedTotal} cartones, del #${start} al #${end}). Debe seleccionar exactamente ${expectedTotal} archivos.`;
      setStatusMessage({ type: 'error', text: msg });
      alert(msg);
      return;
    }

    // Switch view to Control Panel
    setLoading(true);
    setCurrentFileIndex(0);
    setUploadSummary(null);
    setIsClearing(false);
    setProcessSteps({
      validation: 'running',
      clearing: 'pending',
      uploading: 'pending',
    });

    // 2. Pre-validation of all filenames and range numbers
    const invalid: string[] = [];
    const outOfRange: number[] = [];
    const seenNumbers = new Set<number>();
    const duplicateNumbers: number[] = [];
    const expectedPattern = new RegExp(`^SERIAL_${currentEvent.event_id}_Carton_(\\d+)\\.pdf$`, "i");

    for (let i = 0; i < filesList.length; i++) {
      const fileName = filesList[i].name;
      const match = fileName.match(expectedPattern);
      if (!match) {
        invalid.push(fileName);
      } else {
        const cardNum = parseInt(match[1], 10);
        if (cardNum < start || cardNum > end) {
          outOfRange.push(cardNum);
        }
        if (seenNumbers.has(cardNum)) {
          duplicateNumbers.push(cardNum);
        }
        seenNumbers.add(cardNum);
      }
    }

    if (invalid.length > 0) {
      setInvalidFiles(invalid);
      setStatusMessage({ type: 'error', text: `Validación fallida: ${invalid.length} archivos no cumplen el formato.` });
      setProcessSteps({
        validation: 'error',
        clearing: 'pending',
        uploading: 'pending',
      });
      setLoading(false);
      return;
    }

    if (outOfRange.length > 0) {
      const msg = `Hay ${outOfRange.length} cartones fuera del rango del #${start} al #${end} (ej: #${outOfRange.slice(0, 3).join(", #")}).`;
      setStatusMessage({ type: 'error', text: msg });
      setLoading(false);
      alert(msg);
      return;
    }

    if (duplicateNumbers.length > 0) {
      const msg = `Hay números de cartón duplicados en los archivos seleccionados (ej: #${duplicateNumbers.slice(0, 3).join(", #")}).`;
      setStatusMessage({ type: 'error', text: msg });
      setLoading(false);
      alert(msg);
      return;
    }

    setInvalidFiles([]);
    setProcessSteps(prev => ({ ...prev, validation: 'completed' }));
    // Brief pause so user sees Step 1 marked as Completed
    await new Promise(resolve => setTimeout(resolve, 600));

    try {
      // 4. If requested, clear existing cards first (Step 2)
      if (deletePrevious) {
        setIsClearing(true);
        setProcessSteps(prev => ({ ...prev, clearing: 'running' }));
        const clearResult = await clearEventCards(
          currentEvent.company_id,
          currentEvent.event_id,
          start,
          end
        );
        setIsClearing(false);
        if (clearResult.error) {
          alert("Error al limpiar cartones previos: " + clearResult.error);
          setLoading(false);
          return;
        }
        setProcessSteps(prev => ({ ...prev, clearing: 'completed' }));
        await new Promise(resolve => setTimeout(resolve, 400));
      } else {
        setProcessSteps(prev => ({ ...prev, clearing: 'skipped' }));
      }

      // Step 3: Uploading cards
      setProcessSteps(prev => ({ ...prev, uploading: 'running' }));

      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      // 5. Sort files in DESCENDING order by card number (e.g. 600, 599, ..., 1)
      const sortedFiles: File[] = Array.from(filesList).sort((a, b) => {
        const matchA = a.name.match(/_Carton_(\d+)\.pdf$/i);
        const matchB = b.name.match(/_Carton_(\d+)\.pdf$/i);
        const numA = matchA ? parseInt(matchA[1], 10) : 0;
        const numB = matchB ? parseInt(matchB[1], 10) : 0;
        if (numA !== numB) {
          return numB - numA; // Mayor a menor (descendente)
        }
        return b.name.localeCompare(a.name);
      });

      // Upload files in parallel batches using a worker pool for maximum throughput
      const BATCH_SIZE = 10;
      const CONCURRENCY = 4;

      const batches: File[][] = [];
      for (let i = 0; i < sortedFiles.length; i += BATCH_SIZE) {
        const chunk: File[] = [];
        for (let j = i; j < Math.min(i + BATCH_SIZE, sortedFiles.length); j++) {
          chunk.push(sortedFiles[j]);
        }
        batches.push(chunk);
      }

      let completedFiles = 0;
      let nextBatchIndex = 0;

      async function worker(): Promise<void> {
        while (nextBatchIndex < batches.length) {
          const currentBatchIdx = nextBatchIndex++;
          const batch = batches[currentBatchIdx];

          // Set current card number being processed from the batch for real-time feedback
          const firstMatch = batch[0].name.match(/_Carton_(\d+)\.pdf$/i);
          if (firstMatch) {
            setCurrentCardNumber(parseInt(firstMatch[1], 10));
          }

          const formData = new FormData();
          for (const file of batch) {
            formData.append("files", file);
          }
          formData.append("card_type", type);

          const result = await uploadCardsBatch(
            currentEvent.company_id,
            currentEvent.event_id,
            price,
            type,
            formData
          );

          if (result.success) {
            successCount += result.successCount || 0;
            errorCount += result.errorCount || 0;
            if (result.errors) errors.push(...result.errors);
            if (result.minCardNumber !== undefined && result.minCardNumber !== null) {
              setCurrentCardNumber(result.minCardNumber);
            } else if (result.maxCardNumber) {
              setCurrentCardNumber(result.maxCardNumber);
            }
          } else {
            errorCount += batch.length;
            errors.push(result.error || `Error en lote ${currentBatchIdx + 1}`);
          }

          completedFiles += batch.length;
          setCurrentFileIndex(Math.min(completedFiles, sortedFiles.length));
        }
      }

      const activeWorkers = Array.from(
        { length: Math.min(CONCURRENCY, batches.length) },
        () => worker()
      );
      await Promise.all(activeWorkers);

      // Step 3 Completed!
      setProcessSteps(prev => ({ ...prev, uploading: 'completed' }));
      await new Promise(resolve => setTimeout(resolve, 800));

      // Final verification with DB
      const verifyResult = await verifyUpload(currentEvent.company_id, currentEvent.event_id);
      const dbCount = verifyResult.success ? verifyResult.count : 0;

      // Log the activity summary
      if (successCount > 0) {
        await logUploadActivity(currentEvent.company_id, currentEvent.event_id, {
          success_count: successCount,
          error_count: errorCount,
          deleted_previous: deletePrevious,
          total_files: filesList.length,
          verified_db_count: dbCount,
        });
      }

      setUploadSummary({
        success: successCount,
        errors: errorCount,
        total: filesList.length,
        dbCount: dbCount as number,
        errorList: errors,
      });

    } catch (error: any) {
      console.error("Error uploading cards:", error);
      alert("Se produjo un error inesperado durante la carga: " + (error.message || "Error desconocido"));
    } finally {
      setLoading(false);
      setCurrentCardNumber(null);
    }
  };

  const completedStepsCount =
    (processSteps.validation === "completed" ? 1 : 0) +
    (processSteps.clearing === "completed" || processSteps.clearing === "skipped" ? 1 : 0) +
    (processSteps.uploading === "completed" ? 1 : 0);

  let overallProgress = 0;
  if (processSteps.validation === "running") {
    overallProgress = 15;
  } else if (processSteps.validation === "completed") {
    overallProgress = 33;
    if (processSteps.clearing === "running") {
      overallProgress = 50;
    } else if (processSteps.clearing === "completed" || processSteps.clearing === "skipped") {
      overallProgress = 66;
      if (processSteps.uploading === "running") {
        const total = uploadingFiles?.length || 1;
        const uploadRatio = currentFileIndex / total;
        overallProgress = Math.min(98, Math.round(66 + uploadRatio * 34));
      } else if (processSteps.uploading === "completed") {
        overallProgress = 100;
      }
    }
  }

  return (
    <Dialog open={isOpen} onClose={handleClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 transition-all duration-300 overflow-hidden p-0">
          {loading ? (
            /* PANEL DE CONTROL DEL PROCESO */
            <div className="w-full">
              {/* Header */}
              <div className="bg-[#2563eb] text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                  <div className="bg-white/20 p-2.5 rounded-xl text-white backdrop-blur-sm">
                    <ImageIcon size={28} strokeWidth={2.2} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">Subir imágenes de cartones</h3>
                    <p className="text-xs text-blue-100 font-medium">Panel de control del proceso</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-blue-900/40 border border-blue-300/30 px-3.5 py-1.5 rounded-full text-xs font-semibold text-white">
                  <span className={`w-2.5 h-2.5 rounded-full ${processSteps.uploading === 'completed' ? 'bg-emerald-400' : 'bg-emerald-400 animate-pulse'}`}></span>
                  <span>{processSteps.uploading === 'completed' ? 'Finalizado' : 'En proceso'}</span>
                </div>
              </div>

              {/* Body with Steps */}
              <div className="p-6 bg-white dark:bg-gray-900 space-y-3.5">
                {/* Step 1: Validación */}
                <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4 bg-white dark:bg-gray-800/40 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        processSteps.validation === 'completed'
                          ? 'bg-emerald-500 text-white'
                          : processSteps.validation === 'running'
                          ? 'border-2 border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-2 border-gray-300 dark:border-gray-700 bg-transparent'
                      }`}
                    >
                      {processSteps.validation === 'completed' && <Check size={20} strokeWidth={3} />}
                      {processSteps.validation === 'running' && <Loader2 size={18} className="animate-spin text-blue-600" />}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 shrink-0">
                      <FileText size={32} strokeWidth={1.8} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-snug">
                        1. Validación de nombres de archivo
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
                        Se verifican los nombres de los archivos para cumplir con el formato requerido.
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {processSteps.validation === 'completed' ? (
                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Completado
                      </span>
                    ) : processSteps.validation === 'running' ? (
                      <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
                        <Loader2 size={14} className="animate-spin" /> En ejecución
                      </span>
                    ) : (
                      <span className="bg-gray-50 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 text-xs font-medium">
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>

                {/* Step 2: Eliminación */}
                <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4 bg-white dark:bg-gray-800/40 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        processSteps.clearing === 'completed'
                          ? 'bg-emerald-500 text-white'
                          : processSteps.clearing === 'running'
                          ? 'border-2 border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : processSteps.clearing === 'skipped'
                          ? 'bg-gray-100 text-gray-400 dark:bg-gray-800'
                          : 'border-2 border-gray-300 dark:border-gray-700 bg-transparent'
                      }`}
                    >
                      {processSteps.clearing === 'completed' && <Check size={20} strokeWidth={3} />}
                      {processSteps.clearing === 'running' && <Loader2 size={18} className="animate-spin text-blue-600" />}
                      {processSteps.clearing === 'skipped' && <Minus size={18} strokeWidth={2.5} />}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 shrink-0">
                      <Trash2 size={32} strokeWidth={1.8} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-snug">
                        2. Eliminación de registros previos
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
                        {deleteExisting
                          ? `Se eliminan únicamente los registros e imágenes de cartones disponibles en el rango (#${startNumber} al #${endNumber}).`
                          : "Omitido según la configuración seleccionada."}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    {processSteps.clearing === 'completed' ? (
                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Completado
                      </span>
                    ) : processSteps.clearing === 'running' ? (
                      <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
                        <Loader2 size={14} className="animate-spin" /> En ejecución
                      </span>
                    ) : processSteps.clearing === 'skipped' ? (
                      <span className="bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 text-xs font-medium">
                        Omitido
                      </span>
                    ) : (
                      <span className="bg-gray-50 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 text-xs font-medium">
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>

                {/* Step 3: Subiendo cartones */}
                <div className="border border-gray-100 dark:border-gray-800 rounded-2xl p-4 bg-white dark:bg-gray-800/40 shadow-sm flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                        processSteps.uploading === 'completed'
                          ? 'bg-emerald-500 text-white'
                          : processSteps.uploading === 'running'
                          ? 'border-2 border-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-950/30'
                          : 'border-2 border-gray-300 dark:border-gray-700 bg-transparent'
                      }`}
                    >
                      {processSteps.uploading === 'completed' && <Check size={20} strokeWidth={3} />}
                      {processSteps.uploading === 'running' && <Loader2 size={18} className="animate-spin text-blue-600" />}
                    </div>
                    <div className="text-gray-700 dark:text-gray-300 shrink-0">
                      <CloudUpload size={32} strokeWidth={1.8} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-gray-900 dark:text-white leading-snug">
                        3. Subiendo cartones
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug mt-0.5">
                        Se están subiendo las imágenes de los cartones a la plataforma.
                      </p>
                      {processSteps.uploading === 'running' && (
                        <p className="text-[11px] font-semibold text-blue-600 mt-1">
                          Cargando cartón {currentCardNumber ? `#${currentCardNumber}` : ''} ({currentFileIndex}/{uploadingFiles?.length})
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {processSteps.uploading === 'completed' ? (
                      <span className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Completado
                      </span>
                    ) : processSteps.uploading === 'running' ? (
                      <span className="bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5 animate-pulse">
                        <Loader2 size={14} className="animate-spin" /> En ejecución
                      </span>
                    ) : (
                      <span className="bg-gray-50 dark:bg-gray-800 text-gray-400 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 text-xs font-medium">
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>

                {/* Progress Bar & Steps Count at Bottom */}
                <div className="pt-4 flex items-center gap-4">
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-blue-600 h-full rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${overallProgress}%` }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
                    {completedStepsCount} de 3 pasos completados
                  </span>
                </div>
              </div>
            </div>
          ) : !uploadSummary ? (
            <div className="p-6">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Text className="text-xs font-bold uppercase text-gray-500">Número Inicial</Text>
                    <TextInput
                      name="start_number"
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
                      name="end_number"
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Text className="text-xs font-bold uppercase text-gray-500">Precio por Cartón</Text>
                    <TextInput
                      name="card_price"
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
                    <Select
                      value={cardType}
                      onValueChange={(val) => setCardType(val as "Virtual" | "Fisico")}
                      enableClear={false}
                    >
                      <SelectItem value="Virtual">Virtual</SelectItem>
                      <SelectItem value="Fisico">Físico</SelectItem>
                    </Select>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/30 p-2.5 rounded-lg flex items-center justify-between text-xs text-blue-800 dark:text-blue-300">
                  <span className="font-medium">Total de cartones a subir:</span>
                  <span className="font-bold bg-blue-200/60 dark:bg-blue-800/60 px-2 py-0.5 rounded">
                    {isRangeValid ? `${expectedTotal} cartones (#${parsedStart} al #${parsedEnd})` : "Rango inválido"}
                  </span>
                </div>

                <div className="space-y-2">
                  <Text className="text-xs font-bold uppercase text-gray-500">
                    Seleccionar archivos PDF
                  </Text>
                  <div className={`border-2 border-dashed ${invalidFiles.length > 0 ? 'border-red-300 bg-red-50' : 'border-gray-200 dark:border-gray-800'} rounded-xl p-6 text-center hover:border-larioja-azul transition-colors cursor-pointer relative`}>
                    <input
                      type="file"
                      multiple
                      accept=".pdf"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={(e) => {
                        setUploadingFiles(e.target.files);
                        setInvalidFiles([]);
                        setStatusMessage(null);
                      }}
                      disabled={loading}
                    />
                    <FileIcon className={`mx-auto ${invalidFiles.length > 0 ? 'text-red-400' : 'text-gray-400'} mb-2`} size={32} />
                    <Text className="text-sm">
                      {uploadingFiles
                        ? `${uploadingFiles.length} de ${isRangeValid ? expectedTotal : '?'} archivos seleccionados`
                        : "Haz clic o arrastra los PDFs aquí"}
                    </Text>
                    {uploadingFiles && (
                      <div className="mt-1.5 flex justify-center">
                        {!isRangeValid ? (
                          <span className="text-[11px] font-bold text-red-700 bg-red-100/80 border border-red-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            <AlertCircle size={12} /> Configura un rango válido para validar archivos
                          </span>
                        ) : uploadingFiles.length === expectedTotal ? (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/70 border border-emerald-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            <CheckCircle2 size={12} /> Coincide exactamente con el rango ({uploadingFiles.length} cartones)
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 border border-amber-300 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                            <AlertCircle size={12} /> No coincide: {uploadingFiles.length} seleccionados vs {expectedTotal} esperados
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  {statusMessage && (
                    <div className={`mt-2 p-2 rounded-lg flex items-center gap-2 ${
                      statusMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 
                      statusMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 
                      'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}>
                      {statusMessage.type === 'error' ? <XCircle size={14} /> : 
                       statusMessage.type === 'success' ? <CheckCircle2 size={14} /> : 
                       <AlertCircle size={14} />}
                      <Text className="text-[11px] font-bold">{statusMessage.text}</Text>
                    </div>
                  )}
                  {invalidFiles.length > 0 && (
                    <div className="mt-2 p-3 bg-red-100 border border-red-200 rounded-lg">
                      <div className="flex items-center gap-2 mb-2 text-red-700">
                        <XCircle size={16} />
                        <Text className="text-xs font-bold text-red-700">FORMATO INVÁLIDO DETECTADO</Text>
                      </div>
                      <Text className="text-[10px] text-red-600 mb-2">
                        Los siguientes {invalidFiles.length} archivos no cumplen con el patrón: <br/>
                        <span className="font-mono bg-white/50 px-1 italic">SERIAL_{event?.event_id}_Carton_#.pdf</span>
                      </Text>
                      <ul className="max-h-24 overflow-y-auto space-y-1 pl-2 border-l-2 border-red-200">
                        {invalidFiles.map((name, idx) => (
                          <li key={idx} className="text-[9px] text-red-500 font-mono truncate">
                            • {name}
                          </li>
                        ))}
                      </ul>
                      <Text className="text-[9px] text-red-700 mt-2 font-medium italic">
                        Por favor, renombra los archivos y vuelve a seleccionarlos.
                      </Text>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="delete_existing_upload"
                    name="delete_existing_upload"
                    checked={deleteExisting}
                    onChange={(e) => {
                      setDeleteExisting(e.target.checked);
                      if (e.target.checked) {
                        setStatusMessage({ 
                          type: 'info', 
                          text: `¡ATENCIÓN! Se eliminarán permanentemente los registros e imágenes de los cartones disponibles en el rango (#${startNumber} al #${endNumber}) antes de subir.` 
                        });
                      } else {
                        setStatusMessage(null);
                      }
                    }}
                    className="h-4 w-4 text-larioja-azul border-gray-300 rounded focus:ring-larioja-azul"
                    disabled={loading}
                  />
                  <label
                    htmlFor="delete_existing_upload"
                    className="text-sm text-gray-600 font-medium cursor-pointer"
                  >
                    Limpiar cartones existentes en el rango antes de subir
                  </label>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    loading={loading}
                    className="bg-larioja-azul disabled:opacity-50"
                    disabled={!uploadingFiles || uploadingFiles.length === 0 || !isRangeValid}
                  >
                    Subir Cartones
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="p-6">
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
