"use client";

import { useState } from "react";
import { Card, Title, Text, Button, Grid } from "@tremor/react";
import { Database, Copy, AlertTriangle, CheckCircle } from "lucide-react";
import { callAction } from "@/lib/action-client";

interface Company {
  company_id: number;
  company_name: string;
}

interface EventOption {
  company_id: number;
  event_id: string;
  event_name: string;
}

interface CloneResult {
  success?: boolean;
  error?: string;
  copied?: Record<string, number>;
}

const TABLE_LABELS: Record<string, string> = {
  invoices: "Facturas",
  cards: "Cartones",
  students: "Alumnos",
  students_cards: "Asignaciones alumno-cartón",
};

/**
 * Selectores empresa + evento (origen/destino) y botón de copia.
 * La copia se ejecuta vía `callAction` (POST /api/actions) — sin
 * re-render completo de página (regla no-rerender-completo).
 */
export default function TestDataClient({
  companies,
  events,
}: {
  companies: Company[];
  events: EventOption[];
}) {
  const [srcCompany, setSrcCompany] = useState("");
  const [srcEvent, setSrcEvent] = useState("");
  const [tgtCompany, setTgtCompany] = useState("");
  const [tgtEvent, setTgtEvent] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CloneResult | null>(null);

  const srcEvents = events.filter(
    (e) => String(e.company_id) === srcCompany,
  );
  const tgtEvents = events.filter(
    (e) => String(e.company_id) === tgtCompany,
  );

  const ready = srcCompany && srcEvent && tgtCompany && tgtEvent;

  const handleClone = async () => {
    if (!ready) return;
    const confirmed = window.confirm(
      `Se copiarán cards, students, students_cards e invoices\n\n` +
        `Desde: empresa ${srcCompany} / evento ${srcEvent}\n` +
        `Hacia: empresa ${tgtCompany} / evento ${tgtEvent}\n\n` +
        `El evento destino debe estar vacío. ¿Continuar?`,
    );
    if (!confirmed) return;

    setLoading(true);
    setResult(null);
    try {
      const res = await callAction<CloneResult>("testData.cloneEventData", [
        Number(srcCompany),
        srcEvent,
        Number(tgtCompany),
        tgtEvent,
      ]);
      setResult(res);
    } catch {
      setResult({ error: "Error de comunicación con el servidor." });
    } finally {
      setLoading(false);
    }
  };

  const selectClass =
    "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-larioja-azul";

  const renderSelectors = (
    label: string,
    company: string,
    event: string,
    setCompany: (v: string) => void,
    setEvent: (v: string) => void,
    eventList: EventOption[],
  ) => (
    <Card className="p-5">
      <Title className="text-base font-bold">{label}</Title>
      <div className="mt-4 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-gray-400">
            Empresa
          </label>
          <select
            className={selectClass}
            value={company}
            onChange={(e) => {
              setCompany(e.target.value);
              setEvent("");
              setResult(null);
            }}
          >
            <option value="">Seleccione empresa…</option>
            {companies.map((c) => (
              <option key={c.company_id} value={c.company_id}>
                {c.company_name} (ID {c.company_id})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase text-gray-400">
            Evento
          </label>
          <select
            className={selectClass}
            value={event}
            disabled={!company}
            onChange={(e) => {
              setEvent(e.target.value);
              setResult(null);
            }}
          >
            <option value="">
              {company ? "Seleccione evento…" : "Primero elija la empresa"}
            </option>
            {eventList.map((ev) => (
              <option key={ev.event_id} value={ev.event_id}>
                {ev.event_name} ({ev.event_id})
              </option>
            ))}
          </select>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <Title className="text-2xl font-bold text-larioja-azul dark:text-larioja-amarillo">
          Crear Datos de Prueba
        </Title>
        <Text className="text-gray-500 dark:text-gray-400">
          Copia la totalidad de cartones, facturas, alumnos y asignaciones
          de un evento origen a un evento destino.
        </Text>
      </div>

      <Grid numItems={1} numItemsMd={2} className="gap-6">
        {renderSelectors(
          "Desde (origen)",
          srcCompany,
          srcEvent,
          setSrcCompany,
          setSrcEvent,
          srcEvents,
        )}
        {renderSelectors(
          "Hasta (destino)",
          tgtCompany,
          tgtEvent,
          setTgtCompany,
          setTgtEvent,
          tgtEvents,
        )}
      </Grid>

      <Card className="p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
            <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-500" />
            <span>
              El evento destino debe existir y estar <b>vacío</b> en las
              tablas cards, students, students_cards e invoices. La copia
              es irreversible desde esta pantalla.
            </span>
          </div>
          <Button
            icon={Copy}
            color="blue"
            loading={loading}
            disabled={!ready || loading}
            onClick={handleClone}
          >
            {loading ? "Copiando…" : "Copiar Datos"}
          </Button>
        </div>
      </Card>

      {result?.error && (
        <Card className="border-l-4 border-rose-500 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-500" />
            <Text className="text-sm text-rose-600 dark:text-rose-400">
              {result.error}
            </Text>
          </div>
        </Card>
      )}

      {result?.success && result.copied && (
        <Card className="border-l-4 border-emerald-500 p-4">
          <div className="flex items-start gap-2">
            <CheckCircle size={18} className="mt-0.5 shrink-0 text-emerald-500" />
            <div>
              <Text className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                Copia completada
              </Text>
              <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-300">
                {Object.entries(result.copied).map(([table, count]) => (
                  <li key={table} className="flex items-center gap-2">
                    <Database size={13} className="text-gray-400" />
                    {TABLE_LABELS[table] || table}:{" "}
                    <b>{count.toLocaleString()}</b> filas
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
