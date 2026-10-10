"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  TextInput,
  Button,
  Badge,
} from "@tremor/react";
import { UserCheck } from "lucide-react";
import { callAction } from "@/lib/action-client";
import { redirectIfSessionExpired } from "@/lib/auth/sessionFeedback";
import type { CountryCode, InventoryCard, InventoryEventRef } from "@/types/bingo";

type Country = CountryCode;

interface RangePlayerReassignDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: InventoryEventRef | null;
  cards: InventoryCard[];
  countries: Country[];
  onSuccess: () => void;
}

/** Solo dígitos: "+1-721" → "1721" (algunos códigos traen guiones). */
const digitsOf = (v: string) => v.replace(/\D/g, "");

/** URL de bandera por ISO2 (flagcdn — los emojis de bandera no se ven en Windows). */
const flagUrl = (iso2: string, w: 20 | 40 = 40) =>
  `https://flagcdn.com/w${w}/${iso2.toLowerCase()}.png`;

/**
 * Reasignación masiva de jugador (nombre + teléfono con código de área)
 * a un rango de cartones. Muestra una vista previa con los datos
 * actuales registrados en los cartones comprendidos en el rango.
 */
export default function RangePlayerReassignDialog({
  isOpen,
  onClose,
  event,
  cards,
  countries,
  onSuccess,
}: RangePlayerReassignDialogProps) {
  const [loading, setLoading] = useState(false);
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(1);
  const [playerName, setPlayerName] = useState("");
  const [phoneArea, setPhoneArea] = useState("+503");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [areaListOpen, setAreaListOpen] = useState(false);
  const [officialName, setOfficialName] = useState("");

  /** Cartones del rango seleccionado (preview de datos actuales). */
  const cardsInRange = useMemo(
    () =>
      cards
        .filter(
          (c) =>
            c.card_number >= Math.min(rangeStart, rangeEnd) &&
            c.card_number <= Math.max(rangeStart, rangeEnd),
        )
        .sort((a, b) => a.card_number - b.card_number),
    [cards, rangeStart, rangeEnd],
  );

  // País detectado al digitar: exacto, o único candidato por prefijo.
  const selectedCountry = useMemo(() => {
    const digits = digitsOf(phoneArea);
    if (!digits) return null;
    const exact = countries.find((c) => digitsOf(c.phone_code) === digits);
    if (exact) return exact;
    const candidates = countries.filter((c) =>
      digitsOf(c.phone_code).startsWith(digits),
    );
    return candidates.length === 1 ? candidates[0] : null;
  }, [phoneArea, countries]);

  // Lista del dropdown filtrada por lo que se va digitando.
  const filteredCountries = useMemo(() => {
    const digits = digitsOf(phoneArea);
    if (!digits) return countries;
    return countries.filter((c) => digitsOf(c.phone_code).startsWith(digits));
  }, [phoneArea, countries]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!event) return;

    const fullPhone = `+${digitsOf(phoneArea)}${digitsOf(phoneNumber)}`;
    if (!playerName.trim() || !digitsOf(phoneNumber)) {
      alert("Debes indicar el nombre y el teléfono del jugador.");
      return;
    }
    if (
      !window.confirm(
        `¿Reasignar ${cardsInRange.length} cartón(es) del rango ${rangeStart}-${rangeEnd} al jugador "${playerName.trim()}" (${fullPhone})?`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const result = await callAction<{
        success?: boolean;
        error?: string;
        updated_count?: number;
      }>("bingo.updateCardRangePlayer", [
        event.company_id,
        event.event_id,
        rangeStart,
        rangeEnd,
        playerName.trim(),
        fullPhone,
        officialName,
      ]);

      if (result?.success) {
        alert(
          `Se reasignaron ${result.updated_count} cartones a ${playerName.trim()} exitosamente.`,
        );
        setPlayerName("");
        setPhoneNumber("");
        setOfficialName("");
        onSuccess();
        onClose();
      } else if (!redirectIfSessionExpired(result)) {
        alert("Error: " + (result?.error || "No se pudo reasignar el rango."));
      }
    } catch (error) {
      console.error("Error reassigning player range:", error);
      alert(
        "Error inesperado al guardar. Si el problema persiste, vuelve a iniciar sesión.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-[70]" />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <DialogPanel className="max-w-lg w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="bg-larioja-azul/10 p-2 rounded-lg text-larioja-azul">
              <UserCheck size={24} />
            </div>
            <Title>Reasignar Jugador en Rango</Title>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Cartón Desde
                </label>
                <TextInput
                  type="number"
                  value={rangeStart.toString()}
                  onValueChange={(v) => setRangeStart(parseInt(v) || 0)}
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Cartón Hasta
                </label>
                <TextInput
                  type="number"
                  value={rangeEnd.toString()}
                  onValueChange={(v) => setRangeEnd(parseInt(v) || 0)}
                  required
                />
              </div>
            </div>

            {/* Vista previa: datos actuales de los cartones en el rango */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Datos actuales en el rango
                </label>
                <Badge size="xs" color="blue">
                  {cardsInRange.length} cartón(es)
                </Badge>
              </div>
              <div className="max-h-36 overflow-y-auto rounded-xl border border-gray-200 dark:border-gray-700 custom-scrollbar">
                {cardsInRange.length > 0 ? (
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                      <tr className="text-left text-gray-500">
                        <th className="px-3 py-1.5 font-semibold">Cartón</th>
                        <th className="px-3 py-1.5 font-semibold">Jugador actual</th>
                        <th className="px-3 py-1.5 font-semibold">Teléfono actual</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cardsInRange.map((c) => (
                        <tr
                          key={c.card_number}
                          className="border-t border-gray-100 dark:border-gray-800"
                        >
                          <td className="px-3 py-1.5 font-bold text-larioja-azul dark:text-larioja-amarillo">
                            {c.card_number}
                          </td>
                          <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">
                            {c.player_name || "—"}
                          </td>
                          <td className="px-3 py-1.5 text-gray-700 dark:text-gray-300">
                            {c.player_phone_number || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <Text className="px-3 py-4 text-center text-gray-400 italic">
                    No hay cartones en el rango indicado.
                  </Text>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">
                Nuevo Nombre del Jugador
              </label>
              <TextInput
                placeholder="Nombre completo..."
                value={playerName}
                onValueChange={setPlayerName}
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1 space-y-1 relative">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Área
                </label>
                <div className="relative">
                  {selectedCountry && (
                    <img
                      src={flagUrl(selectedCountry.iso2)}
                      alt={selectedCountry.name}
                      className="absolute left-2.5 top-1/2 h-4 w-6 -translate-y-1/2 rounded-[2px] object-cover"
                    />
                  )}
                  <input
                    type="text"
                    inputMode="tel"
                    autoComplete="off"
                    value={phoneArea}
                    placeholder="+503"
                    title={selectedCountry?.name}
                    onChange={(e) => {
                      const v = e.target.value.replace(/[^\d+]/g, "");
                      setPhoneArea(v === "" || v.startsWith("+") ? v : `+${v}`);
                      setAreaListOpen(true);
                    }}
                    onFocus={() => setAreaListOpen(true)}
                    onBlur={() => setTimeout(() => setAreaListOpen(false), 150)}
                    className={`w-full rounded-lg border border-gray-300 bg-white py-2 text-sm text-gray-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 ${
                      selectedCountry ? "pl-10 pr-2" : "px-3"
                    }`}
                  />
                </div>
                {areaListOpen && filteredCountries.length > 0 && (
                  <ul className="absolute left-0 z-50 mt-1 max-h-48 w-72 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
                    {filteredCountries.map((c) => (
                      <li key={`${c.iso2}-${c.phone_code}`}>
                        <button
                          type="button"
                          onMouseDown={() => {
                            setPhoneArea(`+${digitsOf(c.phone_code)}`);
                            setAreaListOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800"
                        >
                          <img
                            src={flagUrl(c.iso2, 20)}
                            alt=""
                            className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover"
                          />
                          <span className="shrink-0 font-semibold text-gray-800 dark:text-gray-100">
                            {c.phone_code}
                          </span>
                          <span className="truncate text-gray-500 dark:text-gray-400">
                            {c.name}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-bold uppercase text-gray-500">
                  Nuevo Teléfono
                </label>
                <TextInput
                  value={phoneNumber}
                  onValueChange={(v) => setPhoneNumber(v.replace(/\D/g, ""))}
                  placeholder="Ej: 70000000"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">
                Funcionario
              </label>
              <TextInput
                placeholder="Nombre de quien autoriza..."
                value={officialName}
                onValueChange={setOfficialName}
                required
              />
            </div>

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
                Reasignar Jugador
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
