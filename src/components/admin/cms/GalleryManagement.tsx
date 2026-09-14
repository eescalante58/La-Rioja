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
  Grid,
  Col
} from "@tremor/react";
import { Upload, Trash2, Image as ImageIcon, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { bulkUploadGalleryImages, deleteGalleryImage } from "@/app/admin/cms/gallery-actions";
import Image from "next/image";

interface GalleryImage {
  id: string;
  event_id: string;
  image_url: string;
  is_active: boolean;
}

interface GalleryManagementProps {
  events: any[];
  initialImages: GalleryImage[];
}

export default function GalleryManagement({ events, initialImages }: GalleryManagementProps) {
  const [selectedEvent, setSelectedEvent] = useState<string>(events[0]?.event_id || "");
  const [images, setImages] = useState<GalleryImage[]>(initialImages);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !selectedEvent) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("event_id", selectedEvent);
    Array.from(files).forEach(file => {
      formData.append("files", file);
    });

    try {
      const result = await bulkUploadGalleryImages(formData);
      if (result.success) {
        setMessage({ text: `Se subieron ${result.count} imágenes con éxito.`, type: 'success' });
        // Recargar imágenes (idealmente traer las nuevas del server)
        window.location.reload();
      } else {
        setMessage({ text: result.error || "Error al subir imágenes", type: 'error' });
      }
    } catch (error) {
      setMessage({ text: "Error inesperado durante la subida", type: 'error' });
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

  const filteredImages = images.filter(img => img.event_id === selectedEvent);

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
              value={selectedEvent} 
              onValueChange={setSelectedEvent}
              placeholder="Seleccionar evento..."
              className="min-w-[200px]"
            >
              {events.map((ev) => (
                <SelectItem key={ev.event_id} value={ev.event_id}>
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
              onClick={() => fileInputRef.current?.click()}
              loading={uploading}
              className="bg-larioja-azul"
              disabled={!selectedEvent}
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
      </Card>

      <Grid numItemsMd={2} numItemsLg={4} className="gap-4">
        {filteredImages.length > 0 ? (
          filteredImages.map((img) => (
            <Card key={img.id} className="p-0 overflow-hidden relative group border-gray-100">
              <div className="aspect-square relative">
                <Image
                  src={img.image_url}
                  alt="Gallery"
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  size="xs"
                  variant="secondary"
                  color="rose"
                  icon={Trash2}
                  onClick={() => handleDelete(img.id)}
                  loading={deletingId === img.id}
                />
              </div>
              <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
                <Badge color="emerald" size="xs">Activa</Badge>
              </div>
            </Card>
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
    </div>
  );
}
