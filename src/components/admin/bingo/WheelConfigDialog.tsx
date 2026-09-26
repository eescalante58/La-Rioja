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
  Switch,
} from "@tremor/react";
import { ExternalLink } from "lucide-react";
import { saveWheelConfig } from "@/app/admin/bingo/wheel-actions";
import { redirectIfSessionExpired } from "@/lib/auth/sessionFeedback";
import type { Wheel } from "./wheel-types";

interface WheelConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  companyId?: number;
  eventId?: string;
  wheel: Wheel | null; // null = nueva ruleta
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
  const [timeRotation, setTimeRotation] = useState("5");
  const [isAutomaticRotation, setIsAutomaticRotation] = useState(false);
  const [automaticTimeoutRotation, setAutomaticTimeoutRotation] = useState("5");
  const [prizesNumber, setPrizesNumber] = useState("0");

  useEffect(() => {
    if (wheel) {
      setMode(wheel.mode);
      setWheelName(wheel.wheel_name);
      setTimeRotation(String(wheel.time_rotation ?? 5));
      setIsAutomaticRotation(wheel.is_automatic_rotation ?? false);
      setAutomaticTimeoutRotation(String(wheel.automatic_timeout_rotation ?? 5));
      setPrizesNumber(String(wheel.prizes_number ?? 0));
    } else {
      setMode("Premios");
      setWheelName("");
      setTimeRotation("5");
      setIsAutomaticRotation(false);
      setAutomaticTimeoutRotation("5");
      setPrizesNumber("0");
    }
  }, [wheel, isOpen]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!companyId || !eventId) return;
    if (!wheelName.trim()) {
      alert("Ingrese un nombre para la ruleta.");
      return;
    }
    // Tómbola (Cartones/Participantes) requiere tiempo de rotación > 0
    const rotation = parseInt(timeRotation) || 0;
    const automaticTimeout = parseInt(automaticTimeoutRotation) || 0;
    const totalPrizes = parseInt(prizesNumber) || 0;

    if (mode !== "Premios" && rotation <= 0) {
      alert("El tiempo de rotación es obligatorio (mínimo 1 segundo) para ruletas de Cartones y Participantes.");
      return;
    }
    if (automaticTimeout < 0 || automaticTimeout > 3600) {
      alert("El tiempo de espera automático debe estar entre 0 y 3600 segundos.");
      return;
    }
    if (totalPrizes < 0) {
      alert("El número de premios no puede ser negativo.");
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
        time_rotation: mode === "Premios" ? 0 : rotation,
        is_automatic_rotation: isAutomaticRotation,
        automatic_timeout_rotation: automaticTimeout,
        prizes_number: totalPrizes,
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

  /** Página pública correspondiente al tipo de juego configurado. */
  const publicGameUrl = wheel
    ? wheel.mode === "Premios"
      ? `/ruleta?evento=${encodeURIComponent(wheel.event_id)}&tipo=${encodeURIComponent(wheel.mode)}&nombre=${encodeURIComponent(wheel.wheel_name)}`
      : `/tombola?evento=${encodeURIComponent(wheel.event_id)}&nombre=${encodeURIComponent(wheel.wheel_name)}`
    : null;

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

            {mode !== "Premios" && (
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Tiempo de Rotación (segundos)
                </label>
                <TextInput
                  type="number"
                  min={1}
                  max={300}
                  value={timeRotation}
                  onValueChange={setTimeRotation}
                  placeholder="Ej: 5"
                  required
                />
                <Text className="text-xs text-gray-400">
                  Duración del giro de la tómbola antes de revelar el ganador.
                </Text>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-gray-500">
                    Giro Automático
                  </label>
                  <Text className="text-xs text-gray-400">
                    La pantalla pública ejecuta los giros sin operador.
                  </Text>
                </div>
                <Switch
                  checked={isAutomaticRotation}
                  onChange={setIsAutomaticRotation}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-500">
                    Espera Automática (seg.)
                  </label>
                  <TextInput
                    type="number"
                    min={0}
                    max={3600}
                    value={automaticTimeoutRotation}
                    onValueChange={setAutomaticTimeoutRotation}
                    placeholder="Ej: 10"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold uppercase text-gray-500">
                    Número de Premios
                  </label>
                  <TextInput
                    type="number"
                    min={0}
                    value={prizesNumber}
                    onValueChange={setPrizesNumber}
                    placeholder="0 = sin límite"
                    required
                  />
                </div>
              </div>
              <Text className="text-xs text-gray-400">
                En modo automático, cada giro espera el tiempo indicado. Usa 0
                premios para dejar la ruleta sin límite configurado.
              </Text>
            </div>

            {mode === "Cartones" && !wheel && (
              <Text className="text-xs text-gray-500">
                En modo Cartones los segmentos se generan automáticamente con
                los cartones vendidos del evento.
              </Text>
            )}

            {wheel && publicGameUrl && (
              <div className="rounded-xl border border-larioja-azul/20 bg-larioja-azul/5 p-4 flex items-center justify-between gap-4">
                <div>
                  <Text className="text-xs font-bold uppercase text-larioja-azul">
                    Página del juego
                  </Text>
                  <Text className="text-xs text-gray-500">
                    {wheel.published
                      ? "Abre la pantalla pública en una pestaña nueva."
                      : "Publica la ruleta para habilitar el acceso."}
                  </Text>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  icon={ExternalLink}
                  disabled={!wheel.published}
                  onClick={() =>
                    window.open(publicGameUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  {wheel.mode === "Premios" ? "Abrir Ruleta" : "Abrir Tómbola"}
                </Button>
              </div>
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
