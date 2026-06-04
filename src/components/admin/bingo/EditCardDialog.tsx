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
import { updateSingleCard } from "@/app/admin/bingo/actions";

interface EditCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  card: any;
  event: any;
  countries: any[];
  onSuccess: () => void;
}

export default function EditCardDialog({
  isOpen,
  onClose,
  card,
  event,
  countries,
  onSuccess,
}: EditCardDialogProps) {
  const [loading, setLoading] = useState(false);
  const [phoneArea, setPhoneArea] = useState("+503");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    if (card) {
      const existingArea = countries.find((c) =>
        card.player_phone_number?.startsWith(c.phone_code),
      )?.phone_code;
      const area = existingArea || "+503";
      setPhoneArea(area);
      setPhoneNumber(card.player_phone_number ? card.player_phone_number.replace(area, "") : "");
    }
  }, [card, countries]);

  const handleUpdateSingleCard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!card || !event) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await updateSingleCard(
        event.company_id,
        event.event_id,
        card.card_number,
        formData,
      );

      if (result.success) {
        alert("Cartón actualizado exitosamente.");
        onSuccess();
        onClose();
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error updating single card:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-[70]" />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
          <Title className="mb-4">Editar Cartón #{card?.card_number}</Title>

          <form onSubmit={handleUpdateSingleCard} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">Nombre del Jugador</label>
              <TextInput name="player_name" defaultValue={card?.player_name} />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1 space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">Área</label>
                <Select value={phoneArea} onValueChange={setPhoneArea} enableClear={false}>
                  {countries.map((c: any) => (
                    <SelectItem key={c.iso2} value={c.phone_code}>
                      {c.flag_emoji} +{c.phone_code}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">Teléfono</label>
                <TextInput
                  value={phoneNumber}
                  onValueChange={setPhoneNumber}
                  placeholder="Ej: 70000000"
                />
                <input type="hidden" name="player_phone_number" value={`${phoneArea}${phoneNumber}`} />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">Correo Electrónico</label>
              <TextInput name="player_email" type="email" defaultValue={card?.player_email} />
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
                Cancelar
              </Button>
              <Button type="submit" loading={loading} className="bg-larioja-azul">
                Guardar Cambios
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
