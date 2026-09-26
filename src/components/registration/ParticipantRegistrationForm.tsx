"use client";

import { useMemo, useState } from "react";
import { ClipboardList, PartyPopper, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface WheelSummary {
  id: number;
  company_id: number;
  event_id: string;
  event_name?: string;
  mode: string;
  wheel_name: string;
}

interface Country {
  name: string;
  phone_code: string;
  flag_emoji: string | null;
  iso2: string;
}

/** Resultado por cartón devuelto por register_participant_cards(). */
interface CardResult {
  cardNumber: number;
  ok: boolean;
  reason?: "no_existe" | "no_vendido" | "ya_registrado" | string;
}

interface RpcResponse {
  success: boolean;
  error?: string;
  results?: CardResult[];
  registered?: number[];
  /** Ids de las filas creadas en wheels_presents_cards (folio del asistente). */
  confirmationIds?: number[];
}

interface ParticipantRegistrationFormProps {
  wheels: WheelSummary[];
  /** Ruleta pre-resuelta por ?id= o porque solo hay una publicada. */
  initialWheel: WheelSummary | null;
  countries: Country[];
}

/** Máximo de cartones que un asistente puede registrar por envío. */
const MAX_CARDS = 10;

/** Motivos de rechazo del RPC traducidos a mensajes accionables. */
const REASON_TEXT: Record<string, string> = {
  no_existe: "no existe en el inventario del evento",
  no_vendido: "no fue vendido ni donado",
  ya_registrado: "ya fue registrado por otro asistente",
};

/** Espera aleatoria 0-2s para distribuir la ráfaga de envíos del evento. */
const jitter = () => new Promise((r) => setTimeout(r, Math.random() * 2000));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Formulario público de registro de cartones (modo Participantes).
 *
 * Un solo RPC atómico por envío: si cualquier cartón es inválido no se
 * registra ninguno y se muestra el motivo exacto por número. Incluye
 * jitter + reintentos con backoff para absorber la ráfaga de ~1,200
 * envíos simultáneos del evento.
 */
export default function ParticipantRegistrationForm({
  wheels,
  initialWheel,
  countries,
}: ParticipantRegistrationFormProps) {
  const [wheel, setWheel] = useState<WheelSummary | null>(initialWheel);
  const [name, setName] = useState("");
  const [areaIso2, setAreaIso2] = useState(
    countries.find((c) => c.iso2 === "SV")?.iso2 ?? countries[0]?.iso2 ?? "",
  );
  const [phone, setPhone] = useState("");
  const [cardInputs, setCardInputs] = useState<string[]>(
    Array.from({ length: MAX_CARDS }, () => ""),
  );
  const [pending, setPending] = useState(false);
  const [cardErrors, setCardErrors] = useState<Map<number, string>>(new Map());
  const [formError, setFormError] = useState<string | null>(null);
  const [registered, setRegistered] = useState<number[] | null>(null);
  /** Folio(s) de confirmación: id de cada fila creada en la tabla. */
  const [confirmationIds, setConfirmationIds] = useState<number[]>([]);

  const selectedCountry = useMemo(
    () => countries.find((c) => c.iso2 === areaIso2),
    [countries, areaIso2],
  );

  /** Números de cartón ingresados: únicos, positivos, en orden. */
  const cardNumbers = useMemo(
    () =>
      Array.from(
        new Set(
          cardInputs
            .map((v) => parseInt(v, 10))
            .filter((n) => Number.isInteger(n) && n > 0),
        ),
      ),
    [cardInputs],
  );

  const updateCard = (idx: number, value: string) => {
    setCardInputs((prev) => prev.map((v, i) => (i === idx ? value : v)));
    // Limpiar el error del cartón al editarlo
    const num = parseInt(value, 10);
    if (Number.isInteger(num) && cardErrors.has(num)) {
      setCardErrors((prev) => {
        const next = new Map(prev);
        next.delete(num);
        return next;
      });
    }
  };

  /**
   * Envía el registro al RPC con jitter y hasta 3 intentos con backoff
   * (500ms, 1s) ante errores de red/transporte. Los errores de negocio
   * (cartón inválido) no se reintentan: ya vienen resueltos por Postgres.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wheel || pending) return;

    setFormError(null);
    setCardErrors(new Map());

    if (name.trim().length < 2) {
      setFormError("Ingresa tu nombre completo.");
      return;
    }
    const phoneDigits = phone.replace(/\D/g, "");
    if (phoneDigits.length < 6) {
      setFormError("Ingresa un número de teléfono válido.");
      return;
    }
    if (cardNumbers.length === 0) {
      setFormError("Ingresa al menos un número de cartón.");
      return;
    }

    setPending(true);
    await jitter();

    const fullPhone = `+${selectedCountry?.phone_code ?? ""} ${phoneDigits}`.trim();
    const supabase = createClient();

    let result: RpcResponse | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { data, error } = await supabase.rpc("register_participant_cards", {
          p_wheel_id: wheel.id,
          p_player_name: name.trim(),
          p_player_phone: fullPhone,
          p_card_numbers: cardNumbers,
        });
        if (error) throw error;
        result = data as RpcResponse;
        break;
      } catch {
        if (attempt < 2) await sleep(500 * 2 ** attempt);
      }
    }

    setPending(false);

    if (!result) {
      setFormError(
        "No pudimos registrar tus cartones. Revisa tu conexión e intenta de nuevo.",
      );
      return;
    }

    if (result.success) {
      setRegistered(result.registered ?? cardNumbers);
      setConfirmationIds(result.confirmationIds ?? []);
      return;
    }

    // Error de negocio: marcar los cartones rechazados con su motivo
    if (result.results) {
      const errors = new Map<number, string>();
      for (const r of result.results) {
        if (!r.ok) {
          errors.set(
            r.cardNumber,
            `El cartón #${r.cardNumber} ${REASON_TEXT[r.reason ?? ""] ?? "no pudo registrarse"}.`,
          );
        }
      }
      setCardErrors(errors);
      setFormError(
        errors.size > 0
          ? "Corrige los cartones señalados y vuelve a intentar."
          : result.error || "No se pudo completar el registro.",
      );
    } else {
      setFormError(result.error || "No se pudo completar el registro.");
    }
  };

  /** Reinicia el formulario para registrar a otro asistente. */
  const handleReset = () => {
    setName("");
    setPhone("");
    setCardInputs(Array.from({ length: MAX_CARDS }, () => ""));
    setRegistered(null);
    setFormError(null);
    setCardErrors(new Map());
  };

  const inputClass =
    "w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-larioja-amarillo focus:border-transparent";

  // ── Selector de tómbola (varias publicadas) ─────────────────────────────
  if (!wheel) {
    return (
      <div className="w-full rounded-3xl bg-white p-6 shadow-2xl md:p-8">
        <h1 className="font-montserrat text-xl font-black uppercase tracking-wide text-larioja-azul text-center">
          Registro de Cartones
        </h1>
        <p className="mt-2 text-center text-sm text-gray-500">
          Selecciona la tómbola en la que participarás:
        </p>
        <div className="mt-6 flex flex-col gap-3">
          {wheels.map((w) => (
            <button
              key={w.id}
              onClick={() => setWheel(w)}
              className="rounded-2xl border-2 border-larioja-azul/20 px-5 py-4 text-left transition-all hover:border-larioja-amarillo hover:bg-larioja-amarillo/5"
            >
              <p className="font-montserrat font-bold text-larioja-azul">
                {w.wheel_name}
              </p>
              <p className="text-xs text-gray-500">
                {w.event_name || w.event_id}
              </p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // ── Confirmación de éxito ────────────────────────────────────────────────
  if (registered) {
    return (
      <div className="w-full rounded-3xl bg-white p-6 text-center shadow-2xl md:p-8">
        <PartyPopper size={56} className="mx-auto text-larioja-verde" />
        <h1 className="mt-4 font-montserrat text-2xl font-black uppercase tracking-wide text-larioja-azul">
          ¡Registro exitoso!
        </h1>
        <p className="mt-2 text-gray-600">
          <span className="font-bold">{name.trim()}</span>, tus cartones ya
          participan en <span className="font-bold">{wheel.wheel_name}</span>.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {registered.map((n) => (
            <span
              key={n}
              className="rounded-full bg-larioja-azul px-4 py-2 font-montserrat text-lg font-black text-white"
            >
              #{n}
            </span>
          ))}
        </div>
        {confirmationIds.length > 0 && (
          <div className="mt-5 rounded-2xl border-2 border-dashed border-larioja-verde/40 bg-larioja-verde/10 px-4 py-3">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-500">
              {confirmationIds.length === 1
                ? "Código de registro"
                : "Códigos de registro"}
            </p>
            <p className="mt-1 font-montserrat text-xl font-black tracking-wide text-larioja-verde">
              {confirmationIds.map((id) => `#${id}`).join("  ·  ")}
            </p>
          </div>
        )}
        <p className="mt-5 text-sm text-gray-500">
          Guarda esta pantalla y tu código de registro. ¡Mucha suerte en el
          sorteo!
        </p>
        <button
          onClick={handleReset}
          className="mt-6 w-full rounded-full bg-larioja-amarillo px-6 py-3 font-montserrat font-black uppercase tracking-wider text-larioja-azul transition-all hover:brightness-105"
        >
          Registrar otro participante
        </button>
      </div>
    );
  }

  // ── Formulario ───────────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-3xl bg-white p-6 shadow-2xl md:p-8">
      {/* Encabezado */}
      <div className="mb-6 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="La Rioja" className="mx-auto h-12 w-auto" />
        <p className="mt-1 font-montserrat text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
          Centro de Formación Laboral
        </p>
        <h1 className="mt-3 font-montserrat text-lg font-black uppercase tracking-wide text-larioja-azul md:text-xl">
          Formulario para Registro de Cartones
        </h1>
        <p className="mt-1 font-montserrat text-lg font-black uppercase tracking-wide text-larioja-verde md:text-xl">
          {wheel.event_name || wheel.event_id}
        </p>
        <p className="text-xs font-semibold text-gray-500">
          {wheel.wheel_name}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Nombre */}
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
            Nombre Completo <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            maxLength={120}
            autoComplete="name"
            placeholder="Tu nombre y apellido"
            className={inputClass}
          />
        </div>

        {/* Teléfono: código de área + número */}
        <div className="grid grid-cols-[1fr_1.6fr] gap-3">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Código de Área <span className="text-red-500">*</span>
            </label>
            <select
              value={areaIso2}
              onChange={(e) => setAreaIso2(e.target.value)}
              required
              className={inputClass}
            >
              {countries.map((c) => (
                <option key={c.iso2} value={c.iso2}>
                  {c.flag_emoji ? `${c.flag_emoji} ` : ""}
                  {c.name} (+{c.phone_code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Número de teléfono <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              minLength={6}
              maxLength={20}
              placeholder="7707 7805"
              className={inputClass}
            />
          </div>
        </div>

        {/* Números de cartón */}
        <div>
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500">
              Ingresa los números de cartones que participarán{" "}
              <span className="text-red-500">*</span>
              <span className="font-medium normal-case text-gray-400">
                (máx {MAX_CARDS})
              </span>
            </label>
            {(cardErrors.size > 0 || cardInputs.some((v) => v !== "")) && (
              <button
                type="button"
                onClick={() => {
                  setCardInputs(Array.from({ length: MAX_CARDS }, () => ""));
                  setCardErrors(new Map());
                  setFormError(null);
                }}
                className="shrink-0 text-xs font-bold uppercase tracking-wider text-larioja-azul underline underline-offset-2 hover:text-larioja-amarillo"
              >
                Limpiar cartones
              </button>
            )}
          </div>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
            {cardInputs.map((value, idx) => {
              const num = parseInt(value, 10);
              const invalid = Number.isInteger(num) && cardErrors.has(num);
              return (
                <input
                  key={idx}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={value}
                  onChange={(e) =>
                    updateCard(idx, e.target.value.replace(/\D/g, ""))
                  }
                  required={idx === 0}
                  placeholder={`#${idx + 1}`}
                  className={`w-full min-w-0 rounded-xl border px-0.5 py-3 text-center font-montserrat text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 sm:text-base md:text-lg ${
                    invalid
                      ? "border-red-400 bg-red-50 focus:ring-red-400"
                      : "border-gray-300 bg-white focus:ring-larioja-amarillo focus:border-transparent"
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Errores por cartón */}
        {cardErrors.size > 0 && (
          <ul className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">
            {[...cardErrors.values()].map((msg) => (
              <li key={msg}>{msg}</li>
            ))}
          </ul>
        )}
        {formError && (
          <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {formError}
          </p>
        )}

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-larioja-amarillo px-6 py-4 font-montserrat text-base font-black uppercase tracking-wider text-larioja-azul shadow-lg transition-all hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={18} className="animate-spin" />
              Registrando…
            </span>
          ) : (
            "Registrar Cartones"
          )}
        </button>

        <p className="text-center text-xs text-gray-400">
          <ClipboardList size={12} className="mr-1 inline-block" />
          Solo cartones vendidos o donados del evento. Un cartón solo puede
          registrarse una vez.
        </p>
      </form>
    </div>
  );
}
