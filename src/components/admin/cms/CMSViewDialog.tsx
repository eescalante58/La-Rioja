"use client";

import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  Badge,
  Button,
} from "@tremor/react";
import { X as XIcon } from "lucide-react";

interface CMSViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  item: any;
}

export default function CMSViewDialog({ isOpen, onClose, item }: CMSViewDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-black/50 sm:backdrop-blur-sm z-[100]" />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
        <DialogPanel className="max-w-xl w-full bg-white dark:bg-gray-950 p-4 sm:p-6 rounded-2xl sm:shadow-xl border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-4">
            <Title>Detalle de Contenido</Title>
            <Button variant="light" icon={XIcon} onClick={onClose} />
          </div>
          {item && (
            <div className="space-y-4">
              <div>
                <Text className="text-[10px] uppercase font-bold text-gray-500">Ubicación</Text>
                <div className="flex gap-2 mt-1">
                  <Badge color="gray">{item.page}</Badge>
                  <Badge color="blue">{item.section_key}</Badge>
                  <Badge color="amber">Orden: {item.content_order}</Badge>
                </div>
              </div>
              <div>
                <Text className="text-[10px] uppercase font-bold text-gray-500">Título</Text>
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  {item.title || "Sin título"}
                </Text>
              </div>
              {item.image_url && (
                <div>
                  <Text className="text-[10px] uppercase font-bold text-gray-500 mb-1">Imagen</Text>
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800">
                    <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
              <div>
                <Text className="text-[10px] uppercase font-bold text-gray-500">Descripción</Text>
                <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-sm">
                  {item.description || "Sin descripción"}
                </div>
              </div>
              <div>
                <Text className="text-[10px] uppercase font-bold text-gray-500 mb-1">Metadata (JSON)</Text>
                <pre className="p-3 bg-gray-900 text-green-400 rounded-xl text-xs overflow-auto max-h-40">
                  {JSON.stringify(item.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={onClose}>Cerrar</Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
