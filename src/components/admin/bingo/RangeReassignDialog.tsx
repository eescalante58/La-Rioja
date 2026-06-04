"use client";

import { useState } from "react";
import { Dialog, DialogPanel, Title, Text, TextInput, Button, Select, SelectItem } from "@tremor/react";
import { RefreshCw } from "lucide-react";
import { updateCardRangeType } from "@/app/admin/bingo/actions";

interface RangeReassignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: any;
  onSuccess: () => void;
}

export default function RangeReassignDialog({
  isOpen,
  onClose,
  event,
  onSuccess,
}: RangeReassignDialogProps) {
  const [loading, setLoading] = useState(false);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(1);
  const [rangeNewType, setRangeNewType] = useState("Virtual");
  const [officialName, setOfficialName] = useState("");

  const handleRangeReassignType = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event) return;

    setLoading(true);
    try {
      const result = await updateCardRangeType(
        event.company_id,
        event.event_id,
        rangeStart,
        rangeEnd,
        rangeNewType,
        officialName,
      );

      if (result.success) {
        alert(`Se actualizaron ${result.updated_count} cartones a ${rangeNewType} exitosamente.`);
        setOfficialName("");
        onSuccess();
        onClose();
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error reassigning range:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-[70]" />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-larioja-azul/10 p-2 rounded-lg text-larioja-azul">
              <RefreshCw size={24} />
            </div>
            <Title>Cambio Masivo de Tipo</Title>
          </div>

          <form onSubmit={handleRangeReassignType} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">Inicio Rango</label>
                <TextInput
                  type="number"
                  value={rangeStart.toString()}
                  onValueChange={(v) => setRangeStart(parseInt(v) || 0)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">Fin Rango</label>
                <TextInput
                  type="number"
                  value={rangeEnd.toString()}
                  onValueChange={(v) => setRangeEnd(parseInt(v) || 0)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">Nuevo Tipo</label>
              <Select value={rangeNewType} onValueChange={setRangeNewType} enableClear={false}>
                <SelectItem value="Virtual">Virtual</SelectItem>
                <SelectItem value="Fisico">Físico</SelectItem>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">Funcionario</label>
              <TextInput
                placeholder="Nombre de quien autoriza..."
                value={officialName}
                onValueChange={setOfficialName}
                required
              />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
                Cancelar
              </Button>
              <Button type="submit" loading={loading} className="bg-larioja-azul">
                Actualizar Rango
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
