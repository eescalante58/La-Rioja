"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  TextInput,
  Button,
} from "@tremor/react";
import { callActionForm } from "@/lib/action-client";
import { redirectIfSessionExpired } from "@/lib/auth/sessionFeedback";
import type { CountryCode, InventoryCard, InventoryEventRef } from "@/types/bingo";

type Country = CountryCode;

interface EditCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  card: InventoryCard | null;
  event: InventoryEventRef | null;
  countries: Country[];
  onSuccess: () => void;
}

/** Solo dígitos: "+1-721" → "1721" (algunos códigos traen guiones). */
const digitsOf = (v: string) => v.replace(/\D/g, "");

/** URL de bandera por ISO2 (flagcdn — los emojis de bandera no se ven en Windows). */
const flagUrl = (iso2: string, w: 20 | 40 = 40) =>
  `https://flagcdn.com/w${w}/${iso2.toLowerCase()}.png`;

/**
 * Estados posibles de un cartón (enum card_status_enum en la BD).
 * 'Donado' = cartón de cortesía/donación: no se vende pero participa
 * en la tómbola igual que uno vendido.
 */
const CARD_STATUSES = [
  "Disponible",
  "Vendido",
  "Asignado",
  "Reservado",
  "Donado",
  "Anulado",
] as const;

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
  const [phoneIso2, setPhoneIso2] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [areaListOpen, setAreaListOpen] = useState(false);

  // Al abrir: separa el número guardado en código de área + número local,
  // usando el prefijo de país más largo que coincida (+1-721 antes que +1).
  useEffect(() => {
    if (!card) return;
    const raw = card.player_phone_number || "";
    const digits = digitsOf(raw);
    const match = countries
      .filter((c) => digits.startsWith(digitsOf(c.phone_code)))
      .sort((a, b) => digitsOf(b.phone_code).length - digitsOf(a.phone_code).length)[0];
    setPhoneArea(match ? `+${digitsOf(match.phone_code)}` : "+503");
    setPhoneIso2(match?.iso2 || "");
    setPhoneNumber(match ? digits.slice(digitsOf(match.phone_code).length) : digits);
  }, [card, countries]);

  // País detectado: prioritiza iso2 si existe (seleccion manual);
  // si no (digitando), busca por codigo exacto o prefijo unico.
  // Para el codigo +1, prioritiza Estados Unidos si no hay seleccion manual.
  const selectedCountry = useMemo(() => {
    if (phoneIso2) {
      const match = countries.find((c) => c.iso2 === phoneIso2);
      if (match) return match;
    }
    const digits = digitsOf(phoneArea);
    if (!digits) return null;
    const exactMatches = countries.filter((c) => digitsOf(c.phone_code) === digits);
    if (exactMatches.length > 0) {
      // Si hay match exacto y es "1", prioritiza US
      if (digits === "1") {
        const us = exactMatches.find((c) => c.iso2 === "US");
        if (us) return us;
      }
      return exactMatches[0];
    }
    const candidates = countries.filter((c) =>
      digitsOf(c.phone_code).startsWith(digits),
    );
    return candidates.length === 1 ? candidates[0] : null;
  }, [phoneArea, phoneIso2, countries]);

  // Lista del dropdown filtrada por lo que se va digitando.
  const filteredCountries = useMemo(() => {
    const digits = digitsOf(phoneArea);
    if (!digits) return countries;
    return countries.filter((c) => digitsOf(c.phone_code).startsWith(digits));
  }, [phoneArea, countries]);

  const handleUpdateSingleCard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!card || !event) return;

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    try {
      const result = await callActionForm<{ success?: boolean; error?: string }>(
        "bingo.updateSingleCard",
        formData,
        [event.company_id, event.event_id, card.card_number],
      );

      if (result?.success) {
        alert("Cartón actualizado exitosamente.");
        onSuccess();
        onClose();
      } else if (!redirectIfSessionExpired(result)) {
        alert("Error: " + (result?.error || "No se pudo actualizar el cartón."));
      }
    } catch (error) {
      console.error("Error updating single card:", error);
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
        <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
          <Title className="mb-4">Editar Cartón #{card?.card_number}</Title>

          <form onSubmit={handleUpdateSingleCard} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">Nombre del Jugador</label>
              <TextInput name="player_name" defaultValue={card?.player_name ?? undefined} />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-1 space-y-1 relative">
                <label className="text-xs font-bold uppercase text-gray-500">Área</label>
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
                      setPhoneIso2(""); // Limpia para deteccion automatica al digitar
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
                            setPhoneIso2(c.iso2); // Fija el pais seleccionado
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
                <label className="text-xs font-bold uppercase text-gray-500">Teléfono</label>
                <TextInput
                  value={phoneNumber}
                  onValueChange={(v) => setPhoneNumber(v.replace(/\D/g, ""))}
                  placeholder="Ej: 70000000"
                />
                <input
                  type="hidden"
                  name="player_phone_number"
                  value={
                    phoneNumber
                      ? `+${digitsOf(phoneArea)}${digitsOf(phoneNumber)}`
                      : ""
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">Correo Electrónico</label>
              <TextInput name="player_email" type="email" defaultValue={card?.player_email ?? undefined} />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase text-gray-500">Estado</label>
              <select
                name="card_status"
                defaultValue={card?.card_status || "Disponible"}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 px-3 text-sm text-gray-800 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100"
              >
                {CARD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
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
