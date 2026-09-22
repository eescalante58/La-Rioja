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
import { saveWheelConfig } from "@/app/admin/bingo/wheel-actions";
import { redirectIfSessionExpired } from "@/lib/auth/sessionFeedback";

interface WheelConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: number;
  eventId?: string;
  wheel: any; // null = nueva ruleta
  onSuccess: () => void;
}

/**
 * Diálogo para crear o renombrar una ruleta de evento.
 * Un evento admite varias ruletas del mismo tipo; el nombre las distingue.
 */
export default function WheelConfigDialog({
  isOpen,
  onClose,
  companyId,
  eventId,
  wheel,
  onSuccess,
}: WheelConfigDialogProps) {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("Premios");
  const [wheelName, setWheelName] = useState("");

  useEffect(() => {
    if (wheel) {
      setMode(wheel.mode);
      setWheelName(wheel.wheel_name);
    } else {
      setMode("Premios");
      setWheelName("");
    }
  }, [wheel, isOpen]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!companyId || !eventId) return;
    if (!wheelName.trim()) {
      alert("Ingrese un nombre para la ruleta.");
      return;
    }

    setLoading(true);
    try {
      const result = await saveWheelConfig({
        id: wheel?.id,
        company_id: companyId,
        event_id: eventId,
        mode,
        wheel_name: wheelName.trim(),
      });

      if (result?.success) {
        onSuccess();
        onClose();
      } else if (!redirectIfSessionExpired(result)) {
        alert("Error: " + (result?.error || "No se pudo guardar la ruleta."));
      }
    } catch (error) {
      console.error("Error saving wheel config:", error);
      alert(
        "Error inesperado al guardar. Si el problema persiste, vuelve a iniciar sesión.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (!companyId || !eventId) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-[70]" />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800">
          <Title className="mb-4">
            {wheel ? `Editar Ruleta` : "Nueva Ruleta"}
          </Title>
          <Text className="mb-4 text-sm">
            Evento: <span className="font-bold">{eventId}</span>
          </Text>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">
                Tipo de Ruleta
              </label>
              <Select
                value={mode}
                onValueChange={setMode}
                enableClear={false}
                disabled={!!wheel}
              >
                <SelectItem value="Premios">Premios</SelectItem>
                <SelectItem value="Cartones">Cartones</SelectItem>
                <SelectItem value="Participantes">Participantes</SelectItem>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">
                Nombre de la Ruleta
              </label>
              <TextInput
                value={wheelName}
                onValueChange={setWheelName}
                placeholder='Ej: "Ruleta Premios 1", "Ruleta Gran Final"'
                required
              />
            </div>

            {mode === "Cartones" && !wheel && (
              <Text className="text-xs text-gray-500">
                En modo Cartones los segmentos se generan automáticamente con
                los cartones vendidos del evento.
              </Text>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <Button
                variant="secondary"
                onClick={onClose}
                disabled={loading}
                type="button"
              >
                Cancelar
              </Button>
              <Button type="submit" loading={loading} className="bg-larioja-azul">
                {wheel ? "Guardar Cambios" : "Crear Ruleta"}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
