"use client";

import { useState } from "react";
import { Card, Title, Text, Grid } from "@tremor/react";
import {
  Database,
  Copy,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Circle,
} from "lucide-react";
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

interface ValidateResult {
  success?: boolean;
  error?: string;
  totals?: Record<string, number>;
}

interface CopyStepResult {
  success?: boolean;
  error?: string;
  table?: string;
  count?: number;
}

interface CopyStep {
  table: string;
  status: "pending" | "copying" | "done" | "error";
  count?: number;
}

/** Orden de copia: invoices primero por el trigger que valida factura-evento en cards. */
const COPY_ORDER = ["invoices", "cards", "students", "students_cards"];

const TABLE_LABELS: Record<string, string> = {
  invoices: "Facturas",
  cards: "Cartones",
  students: "Alumnos",
  students_cards: "Asignaciones alumno-cartón",
};

/**
 * Selectores empresa + evento (origen/destino) y botón de copia.
 * La copia se ejecuta por pasos vía `callAction` (POST /api/actions):
 * primero `testData.validateCopy` y luego `testData.copyTable` por cada
 * tabla, mostrando el avance en una lista — sin re-render completo de
 * página (regla no-rerender-completo).
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
  const [steps, setSteps] = useState<CopyStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);

  const srcEvents = events.filter(
    (e) => String(e.company_id) === srcCompany,
  );
  const tgtEvents = events.filter(
    (e) => String(e.company_id) === tgtCompany,
  );

  const ready = srcCompany && srcEvent && tgtCompany && tgtEvent;

  const companyLabel = (id: string) => {
    const c = companies.find((x) => String(x.company_id) === id);
    return c ? `${c.company_name} (ID ${c.company_id})` : `ID ${id}`;
  };

  const updateStep = (table: string, patch: Partial<CopyStep>) =>
    setSteps((prev) =>
      prev.map((s) => (s.table === table ? { ...s, ...patch } : s)),
    );

  const handleClone = async () => {
    if (!ready) return;
    const confirmed = window.confirm(
      `Se copiarán cards, students, students_cards e invoices\n\n` +
        `Desde: ${companyLabel(srcCompany)} / evento ${srcEvent}\n` +
        `Hacia: ${companyLabel(tgtCompany)} / evento ${tgtEvent}\n\n` +
        `El evento destino debe estar vacío. ¿Continuar?`,
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);
    setFinished(false);
    setSteps(COPY_ORDER.map((t) => ({ table: t, status: "pending" })));

    const args = [
      Number(srcCompany),
      srcEvent,
      Number(tgtCompany),
      tgtEvent,
    ];

    try {
      const validation = await callAction<ValidateResult>(
        "testData.validateCopy",
        args,
      );
      if (validation.error || !validation.success) {
        setError(validation.error || "La validación del par origen/destino falló.");
        setSteps([]);
        return;
      }

      for (const table of COPY_ORDER) {
        updateStep(table, { status: "copying" });
        const res = await callAction<CopyStepResult>(
          "testData.copyTable",
          [...args, table],
        );
        if (res.error || !res.success) {
          updateStep(table, { status: "error" });
          setError(res.error || `Error al copiar "${table}".`);
          return;
        }
        updateStep(table, { status: "done", count: res.count ?? 0 });
      }

      setFinished(true);
    } catch {
      setError("Error de comunicación con el servidor.");
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
              setSteps([]);
              setError(null);
              setFinished(false);
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
              setSteps([]);
              setError(null);
              setFinished(false);
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

  const stepIcon = (status: CopyStep["status"]) => {
    switch (status) {
      case "copying":
        return <Loader2 size={15} className="animate-spin text-larioja-azul" />;
      case "done":
        return <CheckCircle size={15} className="text-emerald-500" />;
      case "error":
        return <AlertTriangle size={15} className="text-rose-500" />;
      default:
        return <Circle size={15} className="text-gray-300 dark:text-gray-600" />;
    }
  };

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
          {/* Botón nativo: el Button de Tremor dejaba el texto invisible
              con la combinación color/loading del tema. */}
          <button
            type="button"
            onClick={handleClone}
            disabled={!ready || loading}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-larioja-azul px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-larioja-azul/90 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-larioja-amarillo dark:text-larioja-azul dark:hover:bg-larioja-amarillo/90"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Copy size={16} />
            )}
            {loading ? "Copiando…" : "Ejecutar Copia"}
          </button>
        </div>
      </Card>

      {steps.length > 0 && (
        <Card
          className={`border-l-4 p-4 ${
            error
              ? "border-rose-500"
              : finished
                ? "border-emerald-500"
                : "border-larioja-azul"
          }`}
        >
          <Text className="text-sm font-bold text-gray-700 dark:text-gray-200">
            {finished
              ? "Copia completada"
              : error
                ? "Copia interrumpida"
                : "Copiando tablas…"}
          </Text>
          <ul className="mt-3 space-y-2 text-sm text-gray-600 dark:text-gray-300">
            {steps.map((step) => (
              <li key={step.table} className="flex items-center gap-2">
                {stepIcon(step.status)}
                <Database size={13} className="text-gray-400" />
                <span>
                  {TABLE_LABELS[step.table] || step.table}
                  {step.status === "copying" && " — copiando…"}
                  {step.status === "done" && (
                    <>
                      {" — "}
                      <b>{(step.count ?? 0).toLocaleString()}</b> filas
                      copiadas
                    </>
                  )}
                  {step.status === "error" && " — error"}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {error && (
        <Card className="border-l-4 border-rose-500 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-rose-500" />
            <Text className="text-sm text-rose-600 dark:text-rose-400">
              {error}
            </Text>
          </div>
        </Card>
      )}
    </div>
  );
}
