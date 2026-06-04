"use client";

import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  Button,
} from "@tremor/react";
import { AlertCircle } from "lucide-react";

interface CMSDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
  item: any;
}

export default function CMSDeleteDialog({
  isOpen,
  onClose,
  onConfirm,
  loading,
  item,
}: CMSDeleteDialogProps) {
  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-black/50 sm:backdrop-blur-sm z-[100]" />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
        <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-950 p-4 sm:p-6 rounded-2xl sm:shadow-xl border border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-3 text-rose-500 mb-4">
            <AlertCircle size={28} />
            <Title className="text-rose-500">¿Eliminar Contenido?</Title>
          </div>
          <Text className="mb-6">
            Estás a punto de eliminar permanentemente la sección{" "}
            <span className="font-bold text-gray-900 dark:text-white">
              "{item?.section_key}"
            </span>{" "}
            de la página{" "}
            <span className="font-bold text-gray-900 dark:text-white">
              {item?.page}
            </span>. Esta acción no se puede deshacer.
          </Text>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={onClose} disabled={loading}>Cancelar</Button>
            <Button color="rose" onClick={onConfirm} loading={loading}>Eliminar Permanentemente</Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
