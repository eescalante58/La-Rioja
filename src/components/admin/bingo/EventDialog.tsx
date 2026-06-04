"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  TextInput,
  Select,
  SelectItem,
  Button,
} from "@tremor/react";
import { DollarSign, TrendingUp, Hash } from "lucide-react";
import { saveEvent } from "@/app/admin/bingo/actions";

interface Event {
  id: number;
  company_id: number;
  event_id: string;
  event_name: string;
  event_date: string;
  card_value: number;
  status: string;
  event_cartons_number?: number;
  event_start_promotion_date?: string;
  event_manager?: string;
  event_goal?: number;
}

interface Company {
  company_id: number;
  company_name: string;
}

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
  companies: Company[];
}

export default function EventDialog({ isOpen, onClose, event, companies }: EventDialogProps) {
  const [loading, setLoading] = useState(false);
  const [statusValue, setStatusValue] = useState<string>("Inactivo");
  const [selectedCompany, setSelectedCompany] = useState<string>("");
  const [cardValueStr, setCardValueStr] = useState("");
  const [eventGoalStr, setEventGoalStr] = useState("");

  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  };

  const formatInputCurrency = (value: string) => {
    const numeric = value.replace(/\D/g, "");
    if (!numeric || parseInt(numeric) === 0) return "";
    const amount = parseFloat(numeric) / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const handleCurrencyChange = (value: string, setter: (v: string) => void) => {
    if (!value) {
      setter("");
      return;
    }
    setter(formatInputCurrency(value));
  };

  useEffect(() => {
    if (event) {
      setStatusValue(event.status || "Inactivo");
      setSelectedCompany(event.company_id.toString());
      setCardValueStr(formatCurrency(event.card_value));
      setEventGoalStr(formatCurrency(event.event_goal));
    } else {
      setStatusValue("Inactivo");
      setSelectedCompany(companies[0]?.company_id.toString() || "");
      setCardValueStr("");
      setEventGoalStr("");
    }
  }, [event, companies]);

  const handleSaveEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await saveEvent(formData);
      if (result.success) {
        window.location.reload();
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
          <Title className="mb-4 text-larioja-azul dark:text-larioja-amarillo">
            {event ? "Editar Evento" : "Nuevo Evento de Bingo"}
          </Title>
          <form onSubmit={handleSaveEvent} className="space-y-4">
            {event && <input type="hidden" name="id" value={event.id} />}

            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Empresa Organizadora</Text>
              <input type="hidden" name="company_id" value={selectedCompany} />
              <Select value={selectedCompany} onValueChange={setSelectedCompany} enableClear={false}>
                {companies.map((c) => (
                  <SelectItem key={c.company_id} value={c.company_id.toString()}>
                    {c.company_name}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">ID Evento (Slug)</Text>
                <TextInput
                  name="event_id"
                  placeholder="BINGO-2024"
                  defaultValue={event?.event_id}
                  required
                />
              </div>
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Valor Cartón</Text>
                <TextInput
                  name="card_value_display"
                  placeholder="$0.00"
                  icon={DollarSign}
                  value={cardValueStr}
                  onValueChange={(v) => handleCurrencyChange(v, setCardValueStr)}
                  required
                />
                <input type="hidden" name="card_value" value={cardValueStr.replace(/[$,]/g, "")} />
              </div>
            </div>

            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Nombre del Evento</Text>
              <TextInput
                name="event_name"
                placeholder="Gran Bingo Anual"
                defaultValue={event?.event_name}
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Responsable</Text>
                <TextInput
                  name="event_manager"
                  placeholder="Nombre del encargado"
                  defaultValue={event?.event_manager}
                />
              </div>
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Meta del Evento</Text>
                <TextInput
                  name="event_goal_display"
                  icon={TrendingUp}
                  placeholder="$0.00"
                  value={eventGoalStr}
                  onValueChange={(v) => handleCurrencyChange(v, setEventGoalStr)}
                />
                <input type="hidden" name="event_goal" value={eventGoalStr.replace(/[$,]/g, "")} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Número de Cartones</Text>
                <TextInput
                  name="event_cartons_number"
                  type="number"
                  icon={Hash}
                  placeholder="Ej: 1000"
                  defaultValue={event?.event_cartons_number?.toString()}
                />
              </div>
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Inicio Promoción</Text>
                <input
                  name="event_start_promotion_date"
                  type="date"
                  defaultValue={event?.event_start_promotion_date}
                  className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Fecha</Text>
                <input
                  name="event_date"
                  type="date"
                  defaultValue={event?.event_date}
                  className="w-full p-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Estado</Text>
                <input type="hidden" name="status" value={statusValue} />
                <Select
                  value={statusValue}
                  onValueChange={setStatusValue}
                  enableClear={false}
                >
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Realizado">Realizado</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="secondary" onClick={onClose} disabled={loading} type="button">
                Cancelar
              </Button>
              <Button type="submit" loading={loading} className="bg-larioja-azul">
                Guardar
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
