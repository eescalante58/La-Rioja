"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  Card,
  Title,
  Text,
  Badge,
  Button,
  TextInput,
  Switch,
  Dialog,
  DialogPanel,
  Callout,
} from "@tremor/react";
import {
  Upload,
  Trash2,
  Image as ImageIcon,
  Video,
  Youtube,
  Play,
  Eye,
  GripVertical,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  X,
  Star,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { callAction } from "@/lib/action-client";
import { createClient } from "@/lib/supabase/client";
import { compressImage } from "@/lib/compress-image";
import { extractYouTubeId, formatDuration, youTubeEmbedUrl } from "@/lib/video-url";
import {
  SITE_GALLERY_BUCKET,
  SITE_GALLERY_MAX_ITEMS,
  SITE_GALLERY_VIDEO_MAX_BYTES,
} from "@/lib/validation/site-gallery";
import type { Database } from "@/types/database";

type SiteGalleryMediaRow =
  Database["public"]["Tables"]["site_gallery_media"]["Row"];

interface SiteGalleryManagerProps {
  page: string;
  galleryKey: string;
}

/**
 * Extrae la duración y genera un fotograma de portada (WebP de hasta 1280px)
 * a partir de un archivo de video en el navegador.
 */
async function extractVideoMetadataAndPoster(
  file: File,
): Promise<{ duration: number; posterBlob: Blob }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      const seekTime = Math.min(1.0, video.duration > 0 ? video.duration * 0.1 : 0.5);
      video.currentTime = seekTime;
    };

    video.onseeked = () => {
      try {
        const maxWidth = 1280;
        const scale = Math.min(1, maxWidth / Math.max(video.videoWidth || 1280, 1));
        const width = Math.round((video.videoWidth || 1280) * scale);
        const height = Math.round((video.videoHeight || 720) * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          URL.revokeObjectURL(url);
          return reject(
            new Error("No se pudo inicializar el lienzo para la portada"),
          );
        }
        ctx.drawImage(video, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              return reject(new Error("No se pudo generar la portada del video"));
            }
            resolve({
              duration: Math.round(video.duration) || 1,
              posterBlob: blob,
            });
          },
          "image/webp",
          0.85,
        );
      } catch (err) {
        URL.revokeObjectURL(url);
        reject(err);
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("El archivo de video no es compatible o está dañado."));
    };
  });
}

interface SortableMediaCardProps {
  item: SiteGalleryMediaRow;
  index: number;
  onUpdateText: (id: string, field: "alt_text" | "caption", value: string) => void;
  onToggleActive: (id: string, active: boolean) => void;
  onMakeCover: (id: string) => void;
  onPreview: (item: SiteGalleryMediaRow) => void;
  onDeleteRequest: (item: SiteGalleryMediaRow) => void;
}

function SortableMediaCard({
  item,
  index,
  onUpdateText,
  onToggleActive,
  onMakeCover,
  onPreview,
  onDeleteRequest,
}: SortableMediaCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isCover = index === 0;
  const isVideo = item.media_type === "video";
  const isYouTube = item.media_type === "youtube";

  const thumbnailSrc = item.poster_url || item.media_url;
  const altLen = (item.alt_text || "").trim().length;
  const isAltInvalid = altLen < 5 || altLen > 150;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "z-20 opacity-40" : ""}`}
    >
      <Card
        className={`p-0 overflow-hidden relative group border-2 transition-all rounded-xl flex flex-col h-full bg-white dark:bg-gray-900 ${
          isDragging
            ? "border-larioja-azul dark:border-larioja-amarillo shadow-lg"
            : !item.is_active
              ? "border-gray-200 dark:border-gray-800 opacity-75"
              : "border-gray-200 dark:border-gray-800"
        }`}
      >
        {/* Miniatura visual */}
        <div className="aspect-[16/10] relative bg-gray-100 dark:bg-gray-950 overflow-hidden select-none">
          {thumbnailSrc ? (
            <Image
              src={thumbnailSrc}
              alt={item.alt_text || "Miniatura"}
              fill
              sizes="(min-width: 1024px) 300px, 50vw"
              className={`object-cover ${!item.is_active ? "grayscale contrast-75" : ""}`}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <ImageIcon size={32} />
            </div>
          )}

          {/* Handle de arrastre (exclusivo para iniciar drag) */}
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="absolute top-2 left-2 p-1.5 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm rounded-lg shadow-md cursor-grab active:cursor-grabbing hover:scale-105 transition-transform z-10 touch-none text-larioja-azul dark:text-larioja-amarillo"
            aria-label={`Reordenar elemento #${index + 1}: ${item.caption || item.alt_text}`}
          >
            <GripVertical size={16} />
          </button>

          {/* Insignia de orden y portada */}
          <div className="absolute top-2 right-2 flex items-center gap-1.5 z-10">
            {isCover && (
              <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-full bg-larioja-amarillo text-larioja-azul border border-larioja-azul shadow-sm">
                Portada
              </span>
            )}
            <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-black/75 text-white backdrop-blur-sm">
              #{index + 1}
            </span>
          </div>

          {/* Indicador de tipo de contenido */}
          <div className="absolute bottom-2 left-2 z-10 flex items-center gap-1">
            {isVideo && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-600/90 text-white backdrop-blur-sm flex items-center gap-1 shadow-sm">
                <Video size={11} />
                {item.duration_seconds
                  ? formatDuration(item.duration_seconds)
                  : "Video"}
              </span>
            )}
            {isYouTube && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-red-600/90 text-white backdrop-blur-sm flex items-center gap-1 shadow-sm">
                <Youtube size={11} />
                YouTube
              </span>
            )}
            {!isVideo && !isYouTube && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-black/60 text-white backdrop-blur-sm flex items-center gap-1">
                <ImageIcon size={11} />
                Foto
              </span>
            )}
            {!item.is_active && (
              <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-rose-600/90 text-white backdrop-blur-sm shadow-sm">
                Oculta
              </span>
            )}
          </div>

          {/* Botón de vista previa rápida sobre miniatura */}
          <button
            type="button"
            onClick={() => onPreview(item)}
            className="absolute inset-0 m-auto w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110 shadow-lg z-10"
            title="Vista previa"
          >
            {isVideo || isYouTube ? <Play size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Campos editables con debounce */}
        <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-between text-xs">
          <div className="space-y-2.5">
            {/* Texto alternativo accesible */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-gray-700 dark:text-gray-300">
                  {isVideo || isYouTube ? "Descripción del video *" : "Texto alternativo *"}
                </label>
                <span
                  className={`font-mono text-[10px] ${
                    isAltInvalid ? "text-rose-600 font-bold" : "text-gray-400"
                  }`}
                >
                  {altLen}/150
                </span>
              </div>
              <input
                type="text"
                defaultValue={item.alt_text}
                maxLength={150}
                onChange={(e) => onUpdateText(item.id, "alt_text", e.target.value)}
                className={`w-full px-2.5 py-1.5 text-xs rounded-lg border bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 outline-none transition-colors ${
                  isAltInvalid
                    ? "border-rose-400 focus:border-rose-600 ring-1 ring-rose-300"
                    : "border-gray-300 dark:border-gray-700 focus:border-larioja-azul dark:focus:border-larioja-amarillo"
                }`}
                placeholder="Descripción para personas con lectores de pantalla"
              />
              {altLen < 5 && (
                <p className="text-[10px] text-rose-600 mt-0.5">Mínimo 5 caracteres</p>
              )}
            </div>

            {/* Leyenda visible */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="font-semibold text-gray-700 dark:text-gray-300">
                  Leyenda sobre la casilla (opcional)
                </label>
                <span className="font-mono text-[10px] text-gray-400">
                  {(item.caption || "").length}/60
                </span>
              </div>
              <input
                type="text"
                defaultValue={item.caption || ""}
                maxLength={60}
                onChange={(e) => onUpdateText(item.id, "caption", e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 outline-none focus:border-larioja-azul dark:focus:border-larioja-amarillo"
                placeholder="Ej: Hall principal, Comedor, etc."
              />
            </div>
          </div>

          {/* Barra de acciones inferiores */}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-1">
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={item.is_active}
                onChange={(e) => onToggleActive(item.id, e.target.checked)}
                className="rounded border-gray-300 text-larioja-azul focus:ring-larioja-azul cursor-pointer"
              />
              Visible
            </label>

            <div className="flex items-center gap-1">
              {!isCover && (
                <button
                  type="button"
                  onClick={() => onMakeCover(item.id)}
                  className="px-2 py-1 text-[11px] font-semibold text-larioja-azul dark:text-larioja-amarillo hover:underline rounded"
                >
                  Hacer portada
                </button>
              )}
              <button
                type="button"
                onClick={() => onDeleteRequest(item)}
                className="p-1 text-gray-400 hover:text-rose-600 rounded transition-colors"
                title="Eliminar elemento"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

export function SiteGalleryManager({ page, galleryKey }: SiteGalleryManagerProps) {
  const [items, setItems] = useState<SiteGalleryMediaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: "ok" | "busy" | "error";
    text: string;
  }>({ type: "ok", text: "✓ Cambios guardados" });

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [youtubeLoading, setYoutubeLoading] = useState(false);

  // Modales
  const [previewItem, setPreviewItem] = useState<SiteGalleryMediaRow | null>(null);
  const [itemToDelete, setItemToDelete] = useState<SiteGalleryMediaRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Drag state
  const [activeItem, setActiveItem] = useState<SiteGalleryMediaRow | null>(null);
  const [srAnnouncement, setSrAnnouncement] = useState("");
  const saveSeq = useRef(0);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sensores de dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Carga inicial
  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await callAction<{
        success: boolean;
        data?: SiteGalleryMediaRow[];
        error?: string;
      }>("cms.listSiteGalleryItems", [page, galleryKey]);

      if (res.success && res.data) {
        setItems(res.data);
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "No se pudieron cargar los elementos",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Error de conexión al cargar la galería",
      });
    } finally {
      setLoading(false);
    }
  }, [page, galleryKey]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Actualización optimista de texto con debounce de 600ms
  const handleUpdateText = (
    id: string,
    field: "alt_text" | "caption",
    value: string,
  ) => {
    // Actualizar estado local inmediatamente
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)),
    );

    const timerKey = `${id}-${field}`;
    if (debounceTimers.current.has(timerKey)) {
      clearTimeout(debounceTimers.current.get(timerKey)!);
    }

    const timer = setTimeout(async () => {
      setStatusMessage({ type: "busy", text: "Guardando texto…" });
      try {
        const res = await callAction<{ success: boolean; error?: string }>(
          "cms.updateSiteGalleryItem",
          [id, { [field]: value }],
        );
        if (res.success) {
          setStatusMessage({ type: "ok", text: "✓ Texto actualizado" });
        } else {
          setStatusMessage({
            type: "error",
            text: res.error || "Error al actualizar texto",
          });
        }
      } catch {
        setStatusMessage({
          type: "error",
          text: "Error de red al guardar texto",
        });
      }
    }, 600);

    debounceTimers.current.set(timerKey, timer);
  };

  // Toggle visible instantáneo
  const handleToggleActive = async (id: string, active: boolean) => {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, is_active: active } : it)),
    );
    setStatusMessage({ type: "busy", text: "Guardando visibilidad…" });
    try {
      const res = await callAction<{ success: boolean; error?: string }>(
        "cms.updateSiteGalleryItem",
        [id, { is_active: active }],
      );
      if (res.success) {
        setStatusMessage({
          type: "ok",
          text: active ? "✓ Foto marcada como visible" : "✓ Foto oculta",
        });
      } else {
        // Revertir
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, is_active: !active } : it)),
        );
        setStatusMessage({
          type: "error",
          text: res.error || "No se pudo actualizar la visibilidad",
        });
      }
    } catch {
      setItems((prev) =>
        prev.map((it) => (it.id === id ? { ...it, is_active: !active } : it)),
      );
      setStatusMessage({ type: "error", text: "Error de red" });
    }
  };

  // Hacer portada (mover al inicio)
  const handleMakeCover = async (id: string) => {
    const currentIndex = items.findIndex((i) => i.id === id);
    if (currentIndex <= 0) return;

    const previousItems = [...items];
    const newItems = arrayMove(items, currentIndex, 0);
    setItems(newItems);

    setStatusMessage({ type: "busy", text: "Estableciendo portada…" });
    try {
      const res = await callAction<{ success: boolean; error?: string }>(
        "cms.reorderSiteGalleryItems",
        [page, galleryKey, newItems.map((i) => i.id)],
      );
      if (res.success) {
        setStatusMessage({ type: "ok", text: "✓ Nueva portada guardada" });
      } else {
        setItems(previousItems);
        setStatusMessage({
          type: "error",
          text: res.error || "Error al reordenar",
        });
      }
    } catch {
      setItems(previousItems);
      setStatusMessage({ type: "error", text: "Error de conexión" });
    }
  };

  // Manejo de Drag and Drop
  const handleDragStart = (e: DragStartEvent) => {
    const it = items.find((i) => i.id === e.active.id);
    setActiveItem(it || null);
    if (it) {
      setSrAnnouncement(
        `Tomaste ${it.caption || it.alt_text}, posición ${
          items.indexOf(it) + 1
        }. Usa las flechas para moverlo.`,
      );
    }
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveItem(null);
    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const previousItems = [...items];
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    const movedItem = reordered[newIndex];
    setSrAnnouncement(
      `Moviste ${movedItem.caption || movedItem.alt_text} a la posición ${
        newIndex + 1
      } de ${reordered.length}.`,
    );

    const seq = ++saveSeq.current;
    setStatusMessage({ type: "busy", text: "⏳ Guardando nuevo orden…" });

    try {
      const res = await callAction<{ success: boolean; error?: string }>(
        "cms.reorderSiteGalleryItems",
        [page, galleryKey, reordered.map((i) => i.id)],
      );
      if (seq !== saveSeq.current) return;

      if (res.success) {
        setStatusMessage({ type: "ok", text: "✓ Orden guardado" });
      } else {
        setItems(previousItems);
        setStatusMessage({
          type: "error",
          text: res.error || "No se pudo guardar el orden",
        });
      }
    } catch {
      if (seq !== saveSeq.current) return;
      setItems(previousItems);
      setStatusMessage({ type: "error", text: "Error de red al guardar orden" });
    }
  };

  // Subida de archivos directa a Storage
  const handleFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files);

    if (items.length + fileList.length > SITE_GALLERY_MAX_ITEMS) {
      setStatusMessage({
        type: "error",
        text: `No se pueden agregar ${fileList.length} archivo(s). El límite máximo es de ${SITE_GALLERY_MAX_ITEMS} elementos.`,
      });
      return;
    }

    const supabase = createClient();
    const createdItems: SiteGalleryMediaRow[] = [];
    const errors: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const isVideo = file.type.startsWith("video/") || file.name.endsWith(".mp4") || file.name.endsWith(".webm");
      setUploadProgress(`Subiendo ${i + 1} de ${fileList.length}: ${file.name}`);

      try {
        if (isVideo) {
          if (file.size > SITE_GALLERY_VIDEO_MAX_BYTES) {
            throw new Error(`El video excede el límite de 50 MB (${(file.size / 1024 / 1024).toFixed(1)} MB).`);
          }

          // Extraer duración y fotograma en WebP
          const { duration, posterBlob } = await extractVideoMetadataAndPoster(file);

          // 1. Solicitar URLs de subida firmadas
          const prep = await callAction<{
            success: boolean;
            data?: {
              path: string;
              token: string;
              posterPath?: string;
              posterToken?: string;
            };
            error?: string;
          }>("cms.prepareSiteGalleryUpload", [
            page,
            galleryKey,
            {
              kind: "video",
              contentType: file.type || "video/mp4",
              size: file.size,
              fileName: file.name,
              posterContentType: "image/webp",
            },
          ]);

          if (!prep.success || !prep.data || !prep.data.posterPath || !prep.data.posterToken) {
            throw new Error(prep.error || "No se pudo preparar la subida del video.");
          }

          // 2. Subir video y portada
          const { error: vErr } = await supabase.storage
            .from(SITE_GALLERY_BUCKET)
            .uploadToSignedUrl(prep.data.path, prep.data.token, file, {
              contentType: file.type || "video/mp4",
            });
          if (vErr) throw new Error(`Fallo al subir video: ${vErr.message}`);

          const { error: pErr } = await supabase.storage
            .from(SITE_GALLERY_BUCKET)
            .uploadToSignedUrl(prep.data.posterPath, prep.data.posterToken, posterBlob, {
              contentType: "image/webp",
            });
          if (pErr) throw new Error(`Fallo al subir portada: ${pErr.message}`);

          // 3. Confirmar e insertar en base de datos
          const conf = await callAction<{
            success: boolean;
            data?: SiteGalleryMediaRow;
            error?: string;
          }>("cms.confirmSiteGalleryUpload", [
            page,
            galleryKey,
            {
              kind: "video",
              path: prep.data.path,
              posterPath: prep.data.posterPath,
              durationSeconds: duration,
              fileName: file.name,
            },
          ]);

          if (!conf.success || !conf.data) {
            throw new Error(conf.error || "No se pudo confirmar el video.");
          }

          createdItems.push(conf.data);
        } else {
          // Imagen: comprimir a WebP en el navegador
          const compressed = await compressImage(file, 1920);

          const prep = await callAction<{
            success: boolean;
            data?: { path: string; token: string };
            error?: string;
          }>("cms.prepareSiteGalleryUpload", [
            page,
            galleryKey,
            {
              kind: "image",
              contentType: compressed.type || "image/webp",
              size: compressed.size,
              fileName: file.name,
            },
          ]);

          if (!prep.success || !prep.data) {
            throw new Error(prep.error || "No se pudo preparar la subida de la imagen.");
          }

          const { error: imgErr } = await supabase.storage
            .from(SITE_GALLERY_BUCKET)
            .uploadToSignedUrl(prep.data.path, prep.data.token, compressed, {
              contentType: compressed.type || "image/webp",
            });

          if (imgErr) throw new Error(`Fallo al subir imagen: ${imgErr.message}`);

          const conf = await callAction<{
            success: boolean;
            data?: SiteGalleryMediaRow;
            error?: string;
          }>("cms.confirmSiteGalleryUpload", [
            page,
            galleryKey,
            {
              kind: "image",
              path: prep.data.path,
              fileName: file.name,
            },
          ]);

          if (!conf.success || !conf.data) {
            throw new Error(conf.error || "No se pudo confirmar la imagen.");
          }

          createdItems.push(conf.data);
        }
      } catch (err: unknown) {
        console.error(`Error procesando archivo ${file.name}:`, err);
        errors.push(`${file.name}: ${err instanceof Error ? err.message : "Error desconocido"}`);
      }
    }

    setUploadProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    if (createdItems.length > 0) {
      setItems((prev) => [...prev, ...createdItems]);
      setStatusMessage({
        type: "ok",
        text: `✓ Se agregaron ${createdItems.length} elemento(s). Revisa sus textos descriptivos.`,
      });
    }

    if (errors.length > 0) {
      setStatusMessage({
        type: "error",
        text: `Errores en subida: ${errors.join(" | ")}`,
      });
    }
  };

  // Agregar YouTube
  const handleAddYouTube = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    setYoutubeLoading(true);
    setStatusMessage({ type: "busy", text: "Registrando video de YouTube…" });

    try {
      const res = await callAction<{
        success: boolean;
        data?: SiteGalleryMediaRow;
        error?: string;
      }>("cms.addSiteGalleryYouTube", [page, galleryKey, youtubeUrl.trim()]);

      if (res.success && res.data) {
        setItems((prev) => [...prev, res.data!]);
        setYoutubeUrl("");
        setStatusMessage({
          type: "ok",
          text: "✓ Video de YouTube agregado a la galería",
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "No se pudo agregar el video de YouTube",
        });
      }
    } catch {
      setStatusMessage({
        type: "error",
        text: "Error de conexión al agregar YouTube",
      });
    } finally {
      setYoutubeLoading(false);
    }
  };

  // Eliminar elemento confirmado
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);

    try {
      const res = await callAction<{ success: boolean; error?: string }>(
        "cms.deleteSiteGalleryItem",
        [itemToDelete.id],
      );

      if (res.success) {
        setItems((prev) => prev.filter((i) => i.id !== itemToDelete.id));
        setStatusMessage({
          type: "ok",
          text: `✓ «${itemToDelete.caption || itemToDelete.alt_text}» eliminado correctamente`,
        });
      } else {
        setStatusMessage({
          type: "error",
          text: res.error || "No se pudo eliminar el elemento",
        });
      }
    } catch {
      setStatusMessage({ type: "error", text: "Error de conexión al eliminar" });
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const activeCount = items.filter((i) => i.is_active).length;

  return (
    <Card className="p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-4">
        <div>
          <Title className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            Fotos y Videos de la Galería
            <span className="text-sm font-normal text-gray-500">
              ({items.length} elementos · {activeCount} visibles)
            </span>
          </Title>
          <Text className="text-xs text-gray-500">
            Tabla <code>site_gallery_media</code> · clave <code>{galleryKey}</code>
          </Text>
        </div>

        {/* Indicador de estado */}
        <div
          role="status"
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
            statusMessage.type === "busy"
              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
              : statusMessage.type === "error"
                ? "bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300"
                : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
          }`}
        >
          {statusMessage.type === "busy" ? (
            <Loader2 size={12} className="animate-spin" />
          ) : statusMessage.type === "error" ? (
            <AlertCircle size={12} />
          ) : (
            <CheckCircle size={12} />
          )}
          {statusMessage.text}
        </div>
      </div>

      {/* Callout informativo sobre persistencia instantánea */}
      <Callout title="Guardado instantáneo" color="blue">
        Las fotos, videos, leyendas y el orden con arrastrar y soltar se{" "}
        <strong>guardan al instante</strong> en la base de datos (no dependen del botón «Guardar cambios»).
        La foto o video en la <strong>posición #1</strong> es la portada grande del mosaico.
      </Callout>

      {/* Zona de subida de archivos y enlace de YouTube */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Dropzone para archivos directos */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFilesUpload(e.dataTransfer.files);
          }}
          className="lg:col-span-2 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-5 text-center flex flex-col items-center justify-center gap-2 hover:border-larioja-azul dark:hover:border-larioja-amarillo transition-colors bg-gray-50/50 dark:bg-gray-900/30"
        >
          <Upload size={24} className="text-gray-400" />
          <div className="text-xs text-gray-600 dark:text-gray-300">
            <span className="font-semibold text-larioja-azul dark:text-larioja-amarillo">
              Arrastra fotos o videos aquí
            </span>{" "}
            o presiona el botón para seleccionar
          </div>
          <p className="text-[11px] text-gray-400 max-w-md">
            Fotos JPG, PNG o WebP (optimizadas a 1920px) · Videos MP4 o WebM (máx. 50 MB con extracción automática de portada) · Máximo {SITE_GALLERY_MAX_ITEMS} elementos
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadProgress !== null}
            className="mt-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <Plus size={14} />
            Subir fotos o videos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,video/mp4,video/webm"
            className="hidden"
            onChange={(e) => handleFilesUpload(e.target.files)}
          />
          {uploadProgress && (
            <div className="mt-2 text-xs font-semibold text-larioja-azul dark:text-larioja-amarillo flex items-center gap-2">
              <Loader2 size={13} className="animate-spin" />
              {uploadProgress}
            </div>
          )}
        </div>

        {/* Formulario rápido para video de YouTube */}
        <form
          onSubmit={handleAddYouTube}
          className="p-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col justify-between gap-3 text-xs"
        >
          <div className="space-y-1.5">
            <span className="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <Youtube size={16} className="text-red-600" />
              Agregar video de YouTube
            </span>
            <p className="text-[11px] text-gray-500">
              Pega un enlace de YouTube estándar o short para incrustarlo sin consumir almacenamiento.
            </p>
            <input
              type="text"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtu.be/... o youtube.com/watch?v=..."
              className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100 outline-none focus:border-larioja-azul text-xs"
            />
          </div>
          <button
            type="submit"
            disabled={youtubeLoading || !youtubeUrl.trim()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-larioja-azul text-white dark:bg-larioja-amarillo dark:text-larioja-azul font-semibold text-xs hover:opacity-90 disabled:opacity-50"
          >
            {youtubeLoading ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Plus size={13} />
            )}
            Agregar enlace
          </button>
        </form>
      </div>

      {/* Lista reordenable con dnd-kit */}
      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-gray-400">
          <Loader2 size={24} className="animate-spin" />
          <span className="text-xs">Cargando elementos de la galería…</span>
        </div>
      ) : items.length === 0 ? (
        <div className="py-12 text-center text-gray-400 border border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
          <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
          <p className="text-sm font-semibold">No hay fotos ni videos en esta galería</p>
          <p className="text-xs text-gray-500 mt-1">
            Sube fotos o videos desde el recuadro superior para comenzar.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {items.map((it, idx) => (
                <SortableMediaCard
                  key={it.id}
                  item={it}
                  index={idx}
                  onUpdateText={handleUpdateText}
                  onToggleActive={handleToggleActive}
                  onMakeCover={handleMakeCover}
                  onPreview={(item) => setPreviewItem(item)}
                  onDeleteRequest={(item) => setItemToDelete(item)}
                />
              ))}
            </div>
          </SortableContext>

          <DragOverlay>
            {activeItem && (
              <div className="w-64 p-2 bg-white dark:bg-gray-900 border-2 border-larioja-azul dark:border-larioja-amarillo rounded-xl shadow-2xl opacity-90 pointer-events-none">
                <div className="aspect-[16/10] relative rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={activeItem.poster_url || activeItem.media_url}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </div>
                <p className="text-xs font-semibold mt-1 text-gray-800 dark:text-gray-200 truncate">
                  {activeItem.caption || activeItem.alt_text}
                </p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Región accesible aria-live para lectores de pantalla */}
      <div className="sr-only" aria-live="assertive">
        {srAnnouncement}
      </div>

      {/* Diálogo de Vista Previa */}
      <Dialog
        open={previewItem !== null}
        onClose={() => setPreviewItem(null)}
        static={true}
      >
        <DialogPanel className="max-w-3xl w-full bg-white dark:bg-gray-950 p-6 rounded-2xl border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <div>
              <Title className="text-base font-bold text-gray-900 dark:text-white">
                {previewItem?.caption || previewItem?.alt_text || "Vista previa"}
              </Title>
              <Text className="text-xs text-gray-500">
                {previewItem?.media_type === "video"
                  ? "Video directo (MP4/WebM)"
                  : previewItem?.media_type === "youtube"
                    ? "Incrustación de YouTube"
                    : "Fotografía"}
              </Text>
            </div>
            <button
              type="button"
              onClick={() => setPreviewItem(null)}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="aspect-[16/10] relative rounded-xl overflow-hidden bg-black flex items-center justify-center">
            {previewItem?.media_type === "video" ? (
              <video
                src={previewItem.media_url}
                controls
                playsInline
                poster={previewItem.poster_url || undefined}
                className="w-full h-full object-contain"
              />
            ) : previewItem?.media_type === "youtube" && previewItem.youtube_id ? (
              <iframe
                src={youTubeEmbedUrl(previewItem.youtube_id, false)}
                title={previewItem.alt_text}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : previewItem ? (
              <Image
                src={previewItem.media_url}
                alt={previewItem.alt_text}
                fill
                className="object-contain"
              />
            ) : null}
          </div>

          <div className="mt-4 text-xs text-gray-600 dark:text-gray-300">
            <strong>Texto alternativo:</strong> {previewItem?.alt_text}
          </div>
        </DialogPanel>
      </Dialog>

      {/* Diálogo de Confirmación de Eliminación */}
      <Dialog
        open={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        static={true}
      >
        <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-950 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 shrink-0">
              <Trash2 size={20} />
            </div>
            <div>
              <Title className="text-base font-bold text-gray-900 dark:text-white">
                ¿Eliminar este elemento?
              </Title>
              <Text className="text-xs text-gray-500">
                Esta acción no se puede deshacer. Se eliminará de la base de datos y de Supabase Storage.
              </Text>
            </div>
          </div>

          <p className="text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
            «{itemToDelete?.caption || itemToDelete?.alt_text}»
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setItemToDelete(null)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-1.5"
            >
              {isDeleting && <Loader2 size={12} className="animate-spin" />}
              Sí, eliminar
            </button>
          </div>
        </DialogPanel>
      </Dialog>
    </Card>
  );
}
