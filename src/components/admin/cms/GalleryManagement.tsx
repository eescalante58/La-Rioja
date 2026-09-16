"use client";

import { useState, useRef } from "react";
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  Select, 
  SelectItem,
  Badge,
  Grid
} from "@tremor/react";
import { Upload, Trash2, Image as ImageIcon, CheckCircle, AlertCircle, Loader2, GripVertical } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { bulkUploadGalleryImages, deleteGalleryImage, updateGalleryImagesOrder } from "@/app/admin/cms/gallery-actions";
import Image from "next/image";

interface GalleryImage {
  id: string;
  company_id: number;
  event_id: string;
  image_url: string;
  is_active: boolean;
  content_order: number;
}

interface GalleryManagementProps {
  events: any[];
  initialImages: GalleryImage[];
}

/**
 * Comprime una imagen en el navegador (WebP, lado mayor máx. 1920px) antes de
 * subirla. Las funciones serverless de Vercel rechazan requests de más de
 * ~4.5MB, así que fotos pesadas deben reducirse del lado del cliente.
 * Si la compresión falla o no reduce el tamaño, devuelve el archivo original.
 */
async function compressImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1920 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", 0.85)
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
    return new File([blob], name, { type: "image/webp" });
  } catch {
    return file;
  }
}

interface SortableImageCardProps {
  img: GalleryImage;
  index: number;
  deletingId: string | null;
  onDelete: (id: string) => void;
}

/**
 * Card individual de imagen con soporte de reordenamiento mediante dnd-kit.
 * El arrastre solo se inicia desde el handle (GripVertical), que recibe los
 * listeners y atributos de accesibilidad de `useSortable`.
 */
function SortableImageCard({ img, index, deletingId, onDelete }: SortableImageCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${isDragging ? "z-20 opacity-40" : ""}`}
    >
      <Card
        className={`p-0 overflow-hidden relative group border-2 transition-colors
          ${isDragging ? "border-larioja-azul" : "border-gray-100"}
        `}
      >
        <div className="aspect-square relative pointer-events-none">
          <Image
            src={img.image_url}
            alt="Gallery"
            fill
            className="object-cover"
          />
        </div>
        <div
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 p-1.5 bg-white/90 backdrop-blur-sm rounded-lg shadow-md cursor-grab active:cursor-grabbing hover:scale-110 transition-transform z-10 touch-none"
          title="Arrastra para reordenar"
        >
          <GripVertical size={18} className="text-larioja-azul" />
        </div>
        <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge color="emerald" size="xs">Activa</Badge>
            <span className="text-[10px] text-gray-400 font-mono">#{index + 1}</span>
          </div>
          <Button
            size="xs"
            variant="light"
            color="rose"
            icon={Trash2}
            onClick={(e) => {
              e.stopPropagation();
              onDelete(img.id);
            }}
            loading={deletingId === img.id}
            tooltip="Eliminar imagen"
          />
        </div>
      </Card>
    </div>
  );
}

export default function GalleryManagement({ events, initialImages }: GalleryManagementProps) {
  const [selectedEventKey, setSelectedEventKey] = useState<string>(
    events && events.length > 0 ? `${events[0].company_id}|${events[0].event_id}` : ""
  );
  const [images, setImages] = useState<GalleryImage[]>(initialImages.sort((a, b) => a.content_order - b.content_order));
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Sensores de dnd-kit:
   * - PointerSensor cubre mouse, touch y stylus (a diferencia del DnD nativo de HTML5,
   *   que no funciona en dispositivos táctiles).
   * - KeyboardSensor permite reordenar con teclado desde el handle enfocable.
   * `activationConstraint.distance` evita que un click simple inicie un arrastre.
   */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  /**
   * Finaliza el arrastre: reordena el array filtrado por evento con `arrayMove`,
   * reasigna `content_order` secuencialmente, aplica un optimistic update en el
   * estado local y persiste el nuevo orden en el servidor.
   */
  const handleDndDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const [cId, eId] = selectedEventKey.split("|");
    const currentFiltered = images.filter(
      img => img.company_id === parseInt(cId) && img.event_id === eId
    );

    const oldIndex = currentFiltered.findIndex(img => img.id === active.id);
    const newIndex = currentFiltered.findIndex(img => img.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const newFiltered = arrayMove(currentFiltered, oldIndex, newIndex);

    const otherImages = images.filter(
      img => !(img.company_id === parseInt(cId) && img.event_id === eId)
    );

    const updatedFiltered = newFiltered.map((img, idx) => ({
      ...img,
      content_order: idx + 1
    }));

    const finalImages = [...otherImages, ...updatedFiltered].sort((a, b) => a.content_order - b.content_order);

    setImages(finalImages);
    const updates = updatedFiltered.map(img => ({ id: img.id, content_order: img.content_order }));

    setIsReordering(true);
    const result = await updateGalleryImagesOrder(updates);

    if (!result.success) {
      alert("Error al guardar el nuevo orden: " + result.error);
    }
    setIsReordering(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedEventKey) return;

    const [cId, eId] = selectedEventKey.split("|");

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("company_id", cId);
    formData.append("event_id", eId);
    const compressed = await Promise.all(Array.from(files).map(compressImage));
    compressed.forEach(file => {
      formData.append("files", file);
    });

    try {
      const result = await bulkUploadGalleryImages(formData);
      if (result.success) {
        setMessage({ text: `Se subieron ${result.count} imágenes con éxito.`, type: 'success' });
        // Actualizar el estado local con las nuevas imágenes si el server las devuelve
        // o simplemente refrescar la lista de imágenes actual
        if (result.data) {
          const newImgs = Array.isArray(result.data) ? result.data : [result.data];
          setImages(prev => [...prev, ...newImgs].sort((a, b) => a.content_order - b.content_order));
        }
      } else {
        setMessage({ text: result.error || "Error al subir imágenes", type: 'error' });
      }
    } catch (error) {
      console.error("Error durante la subida:", error);
      const detail = error instanceof Error ? error.message : "error desconocido";
      setMessage({ text: `Error inesperado durante la subida: ${detail}`, type: 'error' });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta imagen de la galería?")) return;

    setDeletingId(id);
    try {
      const result = await deleteGalleryImage(id);
      if (result.success) {
        setImages(images.filter(img => img.id !== id));
      } else {
        alert("Error al eliminar imagen: " + result.error);
      }
    } catch (error) {
      alert("Error inesperado al eliminar");
    } finally {
      setDeletingId(null);
    }
  };

  const [selCompanyId, selEventId] = selectedEventKey.split("|");
  const filteredImages = images.filter(
    img => img.company_id === parseInt(selCompanyId) && img.event_id === selEventId
  );

  return (
    <div className="space-y-6">
      <Card className="border-larioja-azul/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <Title>Gestión de Galería</Title>
            <Text>Carga y administra las fotos oficiales del evento para la página pública.</Text>
          </div>
          
          <div className="flex items-center gap-3">
            <Select 
              value={selectedEventKey} 
              onValueChange={setSelectedEventKey}
              placeholder="Seleccionar evento..."
              className="min-w-[250px]"
              onMouseDown={(e) => e.stopPropagation()}
            >
              {events.map((ev) => (
                <SelectItem key={`${ev.company_id}-${ev.event_id}`} value={`${ev.company_id}|${ev.event_id}`}>
                  {ev.event_id} - {ev.event_name}
                </SelectItem>
              ))}
            </Select>

            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <Button
              icon={Upload}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
              className="bg-larioja-azul"
              disabled={!selectedEventKey}
            >
              Subir Fotos
            </Button>
          </div>
        </div>

        {message && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        {isReordering && (
          <div className="mt-4 p-2 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2 text-xs font-semibold animate-pulse">
            <Loader2 size={14} className="animate-spin" />
            Guardando nuevo orden...
          </div>
        )}
      </Card>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDndDragEnd}
      >
        <SortableContext
          items={filteredImages.map(img => img.id)}
          strategy={rectSortingStrategy}
        >
          <Grid 
            numItemsMd={2} 
            numItemsLg={4} 
            className="gap-4"
          >
            {filteredImages.length > 0 ? (
              filteredImages.map((img, index) => (
                <SortableImageCard
                  key={img.id}
                  img={img}
                  index={index}
                  deletingId={deletingId}
                  onDelete={handleDelete}
                />
              ))
            ) : (
              <div className="lg:col-span-4">
                <div className="py-20 text-center bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                  <ImageIcon size={48} className="mx-auto text-gray-300 mb-4" />
                  <Text className="text-gray-500">No hay fotos en este evento.</Text>
                </div>
              </div>
            )}
          </Grid>
        </SortableContext>
      </DndContext>
    </div>
  );
}
