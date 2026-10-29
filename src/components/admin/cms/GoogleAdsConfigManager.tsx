"use client";

import React, { useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  FileText,
  Globe,
  GripVertical,
  KeyRound,
  Plus,
  RefreshCw,
  Save,
  Send,
  ShieldAlert,
  Sliders,
  Target,
  Trash2,
  X,
} from "lucide-react";
import {
  DEFAULT_GOOGLE_ADS_EVENTS_CONFIG,
  type GoogleAdsAdminConfig,
  type GoogleAdsConsentMode,
  type GoogleAdsEventSetting,
  type GoogleAdsEventsConfigMap,
  type GoogleAdsLogEntry,
} from "@/types/google-ads-tracking";

interface GoogleAdsConfigManagerProps {
  initialConfig: GoogleAdsAdminConfig;
  canEdit: boolean;
}

interface SortableGoogleEventRowProps {
  eventName: string;
  tagId: string;
  index: number;
  setting: GoogleAdsEventSetting;
  onToggleField: (
    eventName: string,
    field: "enabled" | "logServer" | "isCritical",
    value: boolean
  ) => void;
  onUpdateLabel: (eventName: string, label: string) => void;
  onUpdateValue: (eventName: string, val: number | null) => void;
}

/**
 * Fila reordenable mediante Drag & Drop para la Matriz de Conversiones de Google Ads.
 */
function SortableGoogleEventRow({
  eventName,
  tagId,
  index,
  setting,
  onToggleField,
  onUpdateLabel,
  onUpdateValue,
}: SortableGoogleEventRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: eventName });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sendToPreview = setting.conversionLabel
    ? `${tagId || "AW-XXXXXXXXXX"}/${setting.conversionLabel}`
    : `${tagId || "AW-XXXXXXXXXX"} (Etiqueta base)`;

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-slate-200 dark:border-slate-700/70 transition-colors ${
        isDragging
          ? "bg-emerald-50/90 dark:bg-slate-800 shadow-lg z-10"
          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
      }`}
    >
      <td className="px-3 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
            aria-label={`Reordenar prioridad de ${eventName}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical size={16} />
          </button>
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
            {index + 1}
          </span>
        </div>
      </td>

      <td className="px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-900 dark:text-white text-sm">
              {eventName}
            </span>
            {setting.isCritical && (
              <span className="rounded-full bg-amber-100 dark:bg-amber-900/40 px-2 py-0.5 text-[11px] font-semibold text-amber-800 dark:text-amber-300">
                Crítico
              </span>
            )}
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {setting.actionName}
          </span>
        </div>
      </td>

      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={setting.enabled}
          onChange={(e) =>
            onToggleField(eventName, "enabled", e.target.checked)
          }
          aria-label={`Habilitar evento ${eventName} en Google Ads`}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
        />
      </td>

      <td className="px-4 py-3">
        {eventName === "PageView" ? (
          <span className="text-xs font-mono text-slate-400">
            Automático en gtag(&apos;config&apos;)
          </span>
        ) : (
          <div>
            <input
              type="text"
              value={setting.conversionLabel}
              disabled={!setting.enabled}
              onChange={(e) => onUpdateLabel(eventName, e.target.value)}
              placeholder="Ej. -252CIjfxqgdEMzMuoVF"
              aria-label={`Conversion Label de ${eventName}`}
              className="w-full min-w-[180px] rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1 text-xs font-mono text-slate-800 dark:text-slate-200 focus:border-emerald-600 focus:outline-none disabled:opacity-40"
            />
            <span className="mt-0.5 block text-[10px] font-mono text-emerald-700 dark:text-emerald-400 truncate max-w-[220px]">
              send_to: {sendToPreview}
            </span>
          </div>
        )}
      </td>

      <td className="px-4 py-3">
        {eventName === "PageView" ? (
          <span className="text-xs text-slate-400">—</span>
        ) : (
          <input
            type="number"
            step="0.01"
            disabled={!setting.enabled}
            value={setting.defaultValue ?? ""}
            onChange={(e) => {
              const raw = e.target.value.trim();
              onUpdateValue(eventName, raw === "" ? null : Number(raw));
            }}
            placeholder="Opcional"
            aria-label={`Valor por defecto de ${eventName}`}
            className="w-24 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:border-emerald-600 focus:outline-none disabled:opacity-40"
          />
        )}
      </td>

      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={setting.logServer}
          disabled={!setting.enabled}
          onChange={(e) =>
            onToggleField(eventName, "logServer", e.target.checked)
          }
          aria-label={`Registrar ${eventName} en bitácora del servidor`}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer disabled:opacity-40"
        />
      </td>

      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={setting.isCritical}
          disabled={!setting.enabled}
          onChange={(e) =>
            onToggleField(eventName, "isCritical", e.target.checked)
          }
          aria-label={`Marcar ${eventName} como crítico`}
          className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer disabled:opacity-40"
        />
      </td>
    </tr>
  );
}

/**
 * Panel administrativo integral de Google Ads (gtag.js + Conversiones Mejoradas + GCLID + Consent Mode v2).
 * 100% administrable desde el CMS e independiente de Meta Pixel + CAPI.
 */
export default function GoogleAdsConfigManager({
  initialConfig,
  canEdit,
}: GoogleAdsConfigManagerProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(initialConfig.isEnabled);
  const [tagId, setTagId] = useState<string>(
    initialConfig.tagId || "AW-18533492300"
  );
  const [ga4MeasurementId, setGa4MeasurementId] = useState<string>(
    initialConfig.ga4MeasurementId || ""
  );
  const [currency, setCurrency] = useState<string>(
    initialConfig.currency || "USD"
  );
  const [enableEnhancedConversions, setEnableEnhancedConversions] =
    useState<boolean>(initialConfig.enableEnhancedConversions);
  const [enableAutoGclid, setEnableAutoGclid] = useState<boolean>(
    initialConfig.enableAutoGclid
  );
  const [allowAdPersonalization, setAllowAdPersonalization] =
    useState<boolean>(initialConfig.allowAdPersonalization);
  const [restrictedDataProcessing, setRestrictedDataProcessing] =
    useState<boolean>(initialConfig.restrictedDataProcessing);
  const [productionOnly, setProductionOnly] = useState<boolean>(
    initialConfig.productionOnly
  );
  const [debugMode, setDebugMode] = useState<boolean>(initialConfig.debugMode);
  const [consentMode, setConsentMode] = useState<GoogleAdsConsentMode>(
    initialConfig.consentMode || "disabled"
  );

  const [allowedDomains, setAllowedDomains] = useState<string[]>(
    initialConfig.allowedDomains || []
  );
  const [domainInput, setDomainInput] = useState<string>("");

  const [eventsConfig, setEventsConfig] = useState<GoogleAdsEventsConfigMap>(
    initialConfig.eventsConfig &&
      Object.keys(initialConfig.eventsConfig).length > 0
      ? initialConfig.eventsConfig
      : DEFAULT_GOOGLE_ADS_EVENTS_CONFIG
  );

  const sortedEventNames = Object.entries(eventsConfig)
    .sort(([, a], [, b]) => (a.order ?? 99) - (b.order ?? 99))
    .map(([name]) => name);

  const [saving, setSaving] = useState<boolean>(false);
  const [testingEvent, setTestingEvent] = useState<boolean>(false);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [logsModalOpen, setLogsModalOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<GoogleAdsLogEntry[]>([]);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(
    initialConfig.updatedAt
  );

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!canEdit) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-200">
        <div className="flex items-center gap-3">
          <ShieldAlert size={24} className="shrink-0 text-red-600" />
          <div>
            <h3 className="font-bold text-base">
              Acceso Restringido a Administradores
            </h3>
            <p className="text-sm mt-1">
              La administración de Google Ads y etiquetas de conversión requiere
              permisos de rol <strong>Admin / SuperAdmin</strong>.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sortedEventNames.indexOf(String(active.id));
    const newIndex = sortedEventNames.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    const reorderedNames = arrayMove(sortedEventNames, oldIndex, newIndex);
    const updatedMap: GoogleAdsEventsConfigMap = {};
    reorderedNames.forEach((name, idx) => {
      updatedMap[name] = {
        ...eventsConfig[name],
        order: idx + 1,
      };
    });
    setEventsConfig(updatedMap);
  };

  const handleToggleEventField = (
    eventName: string,
    field: "enabled" | "logServer" | "isCritical",
    value: boolean
  ) => {
    setEventsConfig((prev) => {
      const current = prev[eventName];
      if (!current) return prev;
      const updated: GoogleAdsEventSetting = {
        ...current,
        [field]: value,
      };
      if (field === "isCritical" && value) {
        updated.logServer = true;
      }
      if (field === "enabled" && !value) {
        updated.logServer = false;
        updated.isCritical = false;
      }
      return {
        ...prev,
        [eventName]: updated,
      };
    });
  };

  const handleUpdateLabel = (eventName: string, label: string) => {
    setEventsConfig((prev) => {
      const current = prev[eventName];
      if (!current) return prev;
      return {
        ...prev,
        [eventName]: {
          ...current,
          conversionLabel: label.trim(),
        },
      };
    });
  };

  const handleUpdateValue = (eventName: string, val: number | null) => {
    setEventsConfig((prev) => {
      const current = prev[eventName];
      if (!current) return prev;
      return {
        ...prev,
        [eventName]: {
          ...current,
          defaultValue: val,
        },
      };
    });
  };

  const handleAddDomain = () => {
    const clean = domainInput
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//, "")
      .replace(/\/.*$/, "");
    if (!clean) return;
    if (!allowedDomains.includes(clean)) {
      setAllowedDomains([...allowedDomains, clean]);
    }
    setDomainInput("");
  };

  const handleRemoveDomain = (domain: string) => {
    setAllowedDomains(allowedDomains.filter((d) => d !== domain));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/cms/google-ads-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled,
          tagId: tagId.trim().toUpperCase(),
          ga4MeasurementId: ga4MeasurementId.trim().toUpperCase(),
          currency,
          enableEnhancedConversions,
          enableAutoGclid,
          allowAdPersonalization,
          restrictedDataProcessing,
          productionOnly,
          allowedDomains,
          eventsConfig,
          consentMode,
          debugMode,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        data?: GoogleAdsAdminConfig;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "No se pudo guardar la configuración de Google Ads."
        );
      }

      if (result.data) {
        setUpdatedAt(result.data.updatedAt);
      }

      setFeedback({
        type: "success",
        message:
          "Configuración de Google Ads guardada y caché invalidada (revalidateTag: 'google-ads-config'). Los cambios ya están activos en todo el sitio sin necesidad de deploy.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Error al guardar la configuración de Google Ads.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestConversion = async () => {
    setTestingEvent(true);
    setFeedback(null);

    try {
      const leadLabel = eventsConfig["Lead"]?.conversionLabel || "";
      const res = await fetch("/api/google-ads/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagId: tagId.trim().toUpperCase(),
          conversionLabel: leadLabel,
        }),
      });

      const data = (await res.json()) as {
        success: boolean;
        transactionId?: string;
        sendTo?: string;
        error?: string;
      };

      if (data.success) {
        setFeedback({
          type: "success",
          message: `Conversión de prueba validada y registrada en bitácora (send_to: ${data.sendTo}, transaction_id: ${data.transactionId}). Puedes verla en "Ver Logs (Últimos 50)".`,
        });
      } else {
        setFeedback({
          type: "error",
          message: data.error || "No se pudo validar la conversión de prueba.",
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Error al probar la conversión de Google Ads.",
      });
    } finally {
      setTestingEvent(false);
    }
  };

  const handleOpenLogs = async () => {
    setLogsModalOpen(true);
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/cms/google-ads-logs");
      const json = (await res.json()) as {
        success: boolean;
        data?: GoogleAdsLogEntry[];
      };
      if (json.success && Array.isArray(json.data)) {
        setLogs(json.data);
      }
    } catch {
      // Ignorar fallo de red
    } finally {
      setLoadingLogs(false);
    }
  };

  const leadLabelPreview = eventsConfig["Lead"]?.conversionLabel || "";
  const mainSendToPreview = leadLabelPreview
    ? `${tagId || "AW-18533492300"}/${leadLabelPreview}`
    : `${tagId || "AW-18533492300"}`;

  const consentModeV2Snippet = `// Activación programática de Google Consent Mode v2 + Meta:
window.consent = { marketing: true };
window.dispatchEvent(
  new CustomEvent("meta-consent-updated", { detail: { granted: true } })
);`;

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-12">
      {/* Notificación de estado */}
      {feedback && (
        <div
          role="alert"
          className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-sm ${
            feedback.type === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800/60 dark:bg-emerald-950/50 dark:text-emerald-200"
              : "border-red-200 bg-red-50 text-red-900 dark:border-red-800/60 dark:bg-red-950/50 dark:text-red-200"
          }`}
        >
          <div className="flex items-start gap-2.5">
            {feedback.type === "success" ? (
              <CheckCircle2
                className="mt-0.5 shrink-0 text-emerald-600"
                size={18}
              />
            ) : (
              <AlertTriangle
                className="mt-0.5 shrink-0 text-red-600"
                size={18}
              />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-slate-400 hover:text-slate-600"
            aria-label="Cerrar notificación"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* SECCIÓN 1: ESTADO GLOBAL (KILL SWITCH INDEPENDIENTE) */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Target className="text-emerald-600" size={20} />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                1. Estado Global de Google Ads (Kill Switch)
              </h2>
              <span className="rounded-full bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-0.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                100% Independiente de Meta Pixel
              </span>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Enciende o apaga globalmente Google Ads (`gtag.js`) en todo el sitio web.
              Puedes usar solo Google Ads, solo Meta Pixel, ambos a la vez o ninguno.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-3 self-start sm:self-center">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {isEnabled ? "Google Ads ACTIVO" : "Google Ads APAGADO"}
            </span>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative h-7 w-12 rounded-full bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-600 dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600" />
          </label>
        </div>

        {!isEnabled && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-300 bg-red-50/90 p-3.5 text-red-800 dark:border-red-800/70 dark:bg-red-950/40 dark:text-red-200">
            <AlertTriangle size={20} className="shrink-0 text-red-600" />
            <div className="text-xs sm:text-sm">
              <strong>Kill Switch de Google Ads Desactivado:</strong> El contenedor{" "}
              <code>gtag.js</code> global no se cargará en el navegador ni se dispararán
              conversiones globales de Google Ads.
            </div>
          </div>
        )}
      </section>

      {/* SECCIÓN 2: CREDENCIALES DE GOOGLE ADS */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="text-emerald-600" size={20} />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Credenciales e Identificadores de Google Tag
          </h2>
        </div>

        <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 dark:border-emerald-800/60 dark:bg-emerald-950/30">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                Destino de Conversión Principal (Lead / Matrícula):
              </span>
              <div className="mt-0.5 break-all font-mono text-sm font-bold text-emerald-900 dark:text-emerald-200">
                {mainSendToPreview}
              </div>
            </div>
            <span className="self-start sm:self-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
              {eventsConfig["Lead"]?.actionName || "Website lead"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div className="min-w-0">
            <label
              htmlFor="google-ads-tag-id"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              ID de Google Ads (Tag ID)
            </label>
            <input
              id="google-ads-tag-id"
              type="text"
              value={tagId}
              onChange={(e) => setTagId(e.target.value.toUpperCase())}
              placeholder="Ej. AW-18533492300"
              className="mt-1.5 min-h-[44px] sm:min-h-0 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base sm:text-sm font-mono text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500">
              Formato obligatorio <code>AW-XXXXXXXXXX</code> obtenido en Google Ads →
              Conversiones.
            </p>
          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between">
              <label
                htmlFor="google-ga4-id"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                ID de Google Analytics 4 (Opcional)
              </label>
              <span className="rounded bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                GA4
              </span>
            </div>
            <input
              id="google-ga4-id"
              type="text"
              value={ga4MeasurementId}
              onChange={(e) =>
                setGa4MeasurementId(e.target.value.toUpperCase())
              }
              placeholder="Ej. G-XXXXXXXXXX (Opcional)"
              className="mt-1.5 min-h-[44px] sm:min-h-0 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base sm:text-sm font-mono text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500">
              Si lo ingresas, <code>gtag.js</code> vinculará también tu flujo de GA4 sin
              cargar otro script.
            </p>
          </div>

          <div className="flex flex-col justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-3.5">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Modo «Solo en Producción»
                </span>
                <span className="rounded bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                  Filtro DEV
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Si está activo, impide que las pruebas en <code>localhost</code> contaminen
                las estadísticas reales de Google Ads.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-end">
              <input
                type="checkbox"
                checked={productionOnly}
                onChange={(e) => setProductionOnly(e.target.checked)}
                aria-label="Activar modo Solo en Producción"
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: CONFIGURACIÓN GENERAL Y PRIVACIDAD */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="text-emerald-600" size={20} />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Configuración General, Atribución GCLID y Privacidad
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="min-w-0">
            <label
              htmlFor="google-ads-currency"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Moneda por Defecto
            </label>
            <select
              id="google-ads-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1.5 min-h-[44px] sm:min-h-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="USD">USD — Dólar Estadounidense ($)</option>
              <option value="GTQ">GTQ — Quetzal Guatemalteco (Q)</option>
              <option value="MXN">MXN — Peso Mexicano ($)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="HNL">HNL — Lempira Hondureño (L)</option>
              <option value="CRC">CRC — Colón Costarricense (₡)</option>
              <option value="NIO">NIO — Córdoba Nicaragüense (C$)</option>
              <option value="COP">COP — Peso Colombiano ($)</option>
            </select>
          </div>

          <div className="flex flex-col justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-3.5">
            <div>
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Conversiones Mejoradas (Enhanced Conversions)
              </span>
              <span className="text-xs text-slate-500">
                Envía email y teléfono normalizados/hasheados (SHA-256) al completar
                formularios como Matrícula.
              </span>
            </div>
            <div className="mt-3 flex items-center justify-end">
              <input
                type="checkbox"
                checked={enableEnhancedConversions}
                onChange={(e) =>
                  setEnableEnhancedConversions(e.target.checked)
                }
                aria-label="Habilitar Conversiones Mejoradas"
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-3.5">
            <div>
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Captura Automática GCLID / GBRAID (90 días)
              </span>
              <span className="text-xs text-slate-500">
                El middleware captura <code>?gclid=</code>, <code>?gbraid=</code> y{" "}
                <code>?wbraid=</code> en la cookie <code>_gcl_aw</code>.
              </span>
            </div>
            <div className="mt-3 flex items-center justify-end">
              <input
                type="checkbox"
                checked={enableAutoGclid}
                onChange={(e) => setEnableAutoGclid(e.target.checked)}
                aria-label="Habilitar captura automática de GCLID"
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-3.5">
            <div>
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Señales de Personalización de Anuncios
              </span>
              <span className="text-xs text-slate-500">
                Controla <code>allow_ad_personalization_signals</code> para listas de
                remarketing en Google.
              </span>
            </div>
            <div className="mt-3 flex items-center justify-end">
              <input
                type="checkbox"
                checked={allowAdPersonalization}
                onChange={(e) => setAllowAdPersonalization(e.target.checked)}
                aria-label="Permitir señales de personalización de anuncios"
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-3.5">
            <div>
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Procesamiento Restringido de Datos (RDP)
              </span>
              <span className="text-xs text-slate-500">
                Activa <code>restricted_data_processing: true</code> para mayor
                protección de privacidad institucional.
              </span>
            </div>
            <div className="mt-3 flex items-center justify-end">
              <input
                type="checkbox"
                checked={restrictedDataProcessing}
                onChange={(e) =>
                  setRestrictedDataProcessing(e.target.checked)
                }
                aria-label="Activar procesamiento restringido de datos"
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-3.5">
            <div>
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Modo Depuración (Debug)
              </span>
              <span className="text-xs text-slate-500">
                Imprime en consola <code>[Google Ads] Evento -&gt; send_to</code> y
                permite pruebas locales.
              </span>
            </div>
            <div className="mt-3 flex items-center justify-end">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                aria-label="Habilitar modo depuración de Google Ads"
                className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-600 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: MATRIZ DE EVENTOS Y ETIQUETAS DE CONVERSIÓN */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            4. Matriz de Eventos y Etiquetas de Conversión (Conversion Labels)
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Configura qué acciones se miden en Google Ads y asigna a cada una su{" "}
            <code>Conversion Label</code> específico (ej.{" "}
            <code>-252CIjfxqgdEMzMuoVF</code> para <code>Lead</code>).
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-600 dark:border-slate-700 dark:bg-slate-800/70 dark:text-slate-300">
                  <th className="px-3 py-3 w-24">Prioridad</th>
                  <th className="px-4 py-3">Evento / Acción</th>
                  <th className="px-4 py-3 text-center">Activo</th>
                  <th className="px-4 py-3">Conversion Label (send_to)</th>
                  <th className="px-4 py-3">Valor Default</th>
                  <th className="px-4 py-3 text-center">Bitácora Server</th>
                  <th className="px-4 py-3 text-center">¿Es Crítico?</th>
                </tr>
              </thead>
              <SortableContext
                items={sortedEventNames}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {sortedEventNames.map((eventName, idx) => (
                    <SortableGoogleEventRow
                      key={eventName}
                      eventName={eventName}
                      tagId={tagId}
                      index={idx}
                      setting={eventsConfig[eventName]}
                      onToggleField={handleToggleEventField}
                      onUpdateLabel={handleUpdateLabel}
                      onUpdateValue={handleUpdateValue}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </section>

      {/* SECCIÓN 5: DOMINIO Y GOOGLE CONSENT MODE V2 */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="text-emerald-600" size={20} />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. Dominios Permitidos y Google Consent Mode v2
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="min-w-0">
            <label
              htmlFor="google-domain-input"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Dominios Autorizados (Allowed Domains)
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="google-domain-input"
                type="text"
                value={domainInput}
                onChange={(e) => setDomainInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddDomain();
                  }
                }}
                placeholder="Ej. lariojacflsv.site"
                className="min-h-[44px] sm:min-h-0 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base sm:text-sm text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
              <button
                type="button"
                onClick={handleAddDomain}
                className="min-h-[44px] sm:min-h-0 shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-3.5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <Plus size={16} /> Agregar
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Si está vacío se permite cualquier dominio del sitio. Si agregas dominios,
              solo esos dominios cargarán <code>gtag.js</code>.
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {allowedDomains.length === 0 ? (
                <span className="text-xs italic text-slate-400">
                  Sin restricción de dominio activa (todos permitidos).
                </span>
              ) : (
                allowedDomains.map((domain) => (
                  <span
                    key={domain}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 text-xs font-medium text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800"
                  >
                    {domain}
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(domain)}
                      aria-label={`Eliminar dominio ${domain}`}
                      className="text-emerald-600 hover:text-red-600"
                    >
                      <Trash2 size={12} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className="min-w-0">
            <label
              htmlFor="google-consent-mode"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Google Consent Mode v2
            </label>
            <select
              id="google-consent-mode"
              value={consentMode}
              onChange={(e) =>
                setConsentMode(e.target.value as GoogleAdsConsentMode)
              }
              className="mt-1.5 min-h-[44px] sm:min-h-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-emerald-600 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="disabled">
                Disabled — Cargar gtag.js inmediatamente al entrar
              </option>
              <option value="basic">
                Basic — Esperar aceptación del banner de cookies integrado
              </option>
              <option value="advanced">
                Advanced — Integración con señales ad_storage / ad_user_data
              </option>
            </select>

            {consentMode === "advanced" && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-900 p-3 text-xs text-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-emerald-400">
                    Snippet Google Consent Mode v2:
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(consentModeV2Snippet);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white"
                  >
                    <Copy size={12} /> Copiar
                  </button>
                </div>
                <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed">
                  {consentModeV2Snippet}
                </pre>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECCIÓN 6: HERRAMIENTAS DE VALIDACIÓN Y GUARDADO */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              6. Herramientas de Validación y Diagnóstico de Google Ads
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Simula una conversión de prueba o revisa las últimas 50 conversiones
              registradas con su <code>gclid</code> y <code>transaction_id</code>.
            </p>
            {updatedAt && (
              <p className="mt-1 text-xs text-slate-400">
                Última actualización:{" "}
                {new Date(updatedAt).toLocaleString("es-SV")}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleTestConversion}
              disabled={testingEvent}
              className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {testingEvent ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Send size={16} className="text-emerald-600" />
              )}
              Probar Conversión
            </button>

            <button
              type="button"
              onClick={handleOpenLogs}
              className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <FileText size={16} className="text-emerald-600" />
              Ver Logs (Últimos 50)
            </button>

            <a
              href="https://tagassistant.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ExternalLink size={16} className="text-emerald-600" />
              Tag Assistant
            </a>

            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              Guardar Configuración
            </button>
          </div>
        </div>
      </section>

      {/* MODAL DE LOGS (ÚLTIMOS 50 EVENTOS DE GOOGLE ADS) */}
      {logsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bitácora de las últimas 50 conversiones de Google Ads"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Bitácora de Conversiones Google Ads (Últimos 50 eventos)
                </h3>
                <p className="text-xs text-slate-500">
                  Auditoría de eventos disparados con su destino{" "}
                  <code>send_to</code>, <code>transaction_id</code> y{" "}
                  <code>gclid</code>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleOpenLogs}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center sm:min-h-0 sm:min-w-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Actualizar lista de logs"
                >
                  <RefreshCw
                    size={16}
                    className={loadingLogs ? "animate-spin" : ""}
                  />
                </button>
                <button
                  type="button"
                  onClick={() => setLogsModalOpen(false)}
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center sm:min-h-0 sm:min-w-0 rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  aria-label="Cerrar modal de logs"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingLogs ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Cargando bitácora de conversiones de Google Ads...
                </div>
              ) : logs.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Aún no hay conversiones registradas en{" "}
                  <code>cms_google_ads_logs</code>. Usa el botón &ldquo;Probar
                  Conversión&rdquo; para generar la primera.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                      <tr>
                        <th className="px-3 py-2.5">Fecha</th>
                        <th className="px-3 py-2.5">Evento</th>
                        <th className="px-3 py-2.5">Destino (send_to)</th>
                        <th className="px-3 py-2.5">Transaction ID</th>
                        <th className="px-3 py-2.5">GCLID</th>
                        <th className="px-3 py-2.5">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td className="whitespace-nowrap px-3 py-2.5 text-slate-500">
                            {new Date(log.created_at).toLocaleString("es-SV")}
                          </td>
                          <td className="px-3 py-2.5 font-semibold text-slate-900 dark:text-white">
                            {log.event_name}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-emerald-700 dark:text-emerald-400">
                            {log.send_to}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400">
                            {log.transaction_id}
                          </td>
                          <td className="px-3 py-2.5 font-mono text-slate-500">
                            {log.gclid || "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <span
                              className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold uppercase ${
                                log.status === "ok"
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                                  : log.status === "skipped"
                                  ? "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  : "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300"
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
