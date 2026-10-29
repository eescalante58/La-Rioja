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
  Activity,
  AlertTriangle,
  CheckCircle2,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  FileText,
  Globe,
  GripVertical,
  KeyRound,
  Plus,
  RefreshCw,
  Save,
  Send,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Trash2,
  X,
} from "lucide-react";
import {
  DEFAULT_META_EVENTS_CONFIG,
  type MetaAdminConfig,
  type MetaConsentMode,
  type MetaEventSetting,
  type MetaEventsConfigMap,
  type MetaTrackingLogEntry,
} from "@/types/meta-tracking";

interface MetaPixelConfigManagerProps {
  initialConfig: MetaAdminConfig;
  canEdit: boolean;
}

interface SortableEventRowProps {
  eventName: string;
  index: number;
  setting: MetaEventSetting;
  onToggleField: (
    eventName: string,
    field: "enabled" | "sendCAPI" | "isCritical",
    value: boolean
  ) => void;
  onAddParam: (eventName: string, param: string) => void;
  onRemoveParam: (eventName: string, param: string) => void;
}

/**
 * Fila reordenable mediante Drag & Drop para la Matriz de Eventos (prioridad AEM).
 */
function SortableEventRow({
  eventName,
  index,
  setting,
  onToggleField,
  onAddParam,
  onRemoveParam,
}: SortableEventRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: eventName });

  const [newParam, setNewParam] = useState("");

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleParamSubmit = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const trimmed = newParam.trim();
      if (trimmed) {
        onAddParam(eventName, trimmed);
        setNewParam("");
      }
    }
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-slate-200 dark:border-slate-700/70 transition-colors ${
        isDragging
          ? "bg-blue-50/90 dark:bg-slate-800 shadow-lg z-10"
          : "hover:bg-slate-50/80 dark:hover:bg-slate-800/40"
      }`}
    >
      <td className="px-3 py-3 text-sm font-medium text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded"
            aria-label={`Reordenar prioridad AEM de ${eventName}`}
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
      </td>

      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={setting.enabled}
          onChange={(e) =>
            onToggleField(eventName, "enabled", e.target.checked)
          }
          aria-label={`Habilitar evento ${eventName}`}
          className="h-4 w-4 rounded border-slate-300 text-larioja-azul focus:ring-larioja-azul cursor-pointer"
        />
      </td>

      <td className="px-4 py-3 text-center">
        <input
          type="checkbox"
          checked={setting.sendCAPI}
          disabled={!setting.enabled}
          onChange={(e) =>
            onToggleField(eventName, "sendCAPI", e.target.checked)
          }
          aria-label={`Enviar ${eventName} a CAPI`}
          className="h-4 w-4 rounded border-slate-300 text-larioja-azul focus:ring-larioja-azul cursor-pointer disabled:opacity-40"
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

      <td className="px-4 py-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(setting.requiredParams || []).map((param) => (
            <span
              key={param}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-mono text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            >
              {param}
              <button
                type="button"
                onClick={() => onRemoveParam(eventName, param)}
                aria-label={`Quitar parámetro ${param} de ${eventName}`}
                className="text-slate-400 hover:text-red-500"
              >
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            type="text"
            value={newParam}
            onChange={(e) => setNewParam(e.target.value)}
            onKeyDown={handleParamSubmit}
            placeholder="+ param (Enter)"
            aria-label={`Agregar parámetro requerido a ${eventName}`}
            className="w-28 rounded border border-dashed border-slate-300 dark:border-slate-700 bg-transparent px-2 py-0.5 text-xs text-slate-700 dark:text-slate-200 focus:border-larioja-azul focus:outline-none"
          />
        </div>
      </td>
    </tr>
  );
}

/**
 * Panel administrativo integral de Meta Pixel + Conversions API (CAPI v21.0).
 * 100% administrable desde el CMS sin tocar código ni variables de entorno.
 */
export default function MetaPixelConfigManager({
  initialConfig,
  canEdit,
}: MetaPixelConfigManagerProps) {
  const [isEnabled, setIsEnabled] = useState<boolean>(initialConfig.isEnabled);
  const [pixelId, setPixelId] = useState<string>(initialConfig.pixelId || "");
  const [capiPixelId, setCapiPixelId] = useState<string>(
    initialConfig.capiPixelId || initialConfig.pixelId || ""
  );
  const [capiAccessToken, setCapiAccessToken] = useState<string>("");
  const [hasSavedToken, setHasSavedToken] = useState<boolean>(
    initialConfig.hasAccessToken
  );
  const [maskedToken, setMaskedToken] = useState<string>(
    initialConfig.capiAccessTokenMasked || ""
  );
  const [showToken, setShowToken] = useState<boolean>(false);
  const [clearToken, setClearToken] = useState<boolean>(false);

  const [currency, setCurrency] = useState<string>(
    initialConfig.currency || "USD"
  );
  const [testEventCode, setTestEventCode] = useState<string>(
    initialConfig.testEventCode || ""
  );
  const [enableAdvancedMatching, setEnableAdvancedMatching] = useState<boolean>(
    initialConfig.enableAdvancedMatching
  );
  const [enableAutoFbcFbp, setEnableAutoFbcFbp] = useState<boolean>(
    initialConfig.enableAutoFbcFbp
  );
  const [debugMode, setDebugMode] = useState<boolean>(initialConfig.debugMode);
  const [consentMode, setConsentMode] = useState<MetaConsentMode>(
    initialConfig.consentMode || "basic"
  );

  const [allowedDomains, setAllowedDomains] = useState<string[]>(
    initialConfig.allowedDomains || []
  );
  const [domainInput, setDomainInput] = useState<string>("");

  const [eventsConfig, setEventsConfig] = useState<MetaEventsConfigMap>(
    initialConfig.eventsConfig &&
      Object.keys(initialConfig.eventsConfig).length > 0
      ? initialConfig.eventsConfig
      : DEFAULT_META_EVENTS_CONFIG
  );

  const sortedEventNames = Object.entries(eventsConfig)
    .sort(([, a], [, b]) => (a.order ?? 99) - (b.order ?? 99))
    .map(([name]) => name);

  const [saving, setSaving] = useState<boolean>(false);
  const [testingEvent, setTestingEvent] = useState<boolean>(false);
  const [loadingLogs, setLoadingLogs] = useState<boolean>(false);
  const [logsModalOpen, setLogsModalOpen] = useState<boolean>(false);
  const [logs, setLogs] = useState<MetaTrackingLogEntry[]>([]);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error" | "info";
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
              La administración de Meta Pixel y Conversions API (CAPI) requiere
              permisos de rol <strong>Admin / CMS Admin</strong>.
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
    const updatedMap: MetaEventsConfigMap = {};
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
    field: "enabled" | "sendCAPI" | "isCritical",
    value: boolean
  ) => {
    setEventsConfig((prev) => {
      const current = prev[eventName] || {
        enabled: true,
        sendCAPI: false,
        isCritical: false,
        requiredParams: [],
      };
      const updated: MetaEventSetting = {
        ...current,
        [field]: value,
      };
      if (field === "isCritical" && value) {
        updated.sendCAPI = true;
      }
      if (field === "enabled" && !value) {
        updated.sendCAPI = false;
        updated.isCritical = false;
      }
      return {
        ...prev,
        [eventName]: updated,
      };
    });
  };

  const handleAddParam = (eventName: string, param: string) => {
    setEventsConfig((prev) => {
      const current = prev[eventName];
      if (!current) return prev;
      const existing = current.requiredParams || [];
      if (existing.includes(param)) return prev;
      return {
        ...prev,
        [eventName]: {
          ...current,
          requiredParams: [...existing, param],
        },
      };
    });
  };

  const handleRemoveParam = (eventName: string, param: string) => {
    setEventsConfig((prev) => {
      const current = prev[eventName];
      if (!current) return prev;
      return {
        ...prev,
        [eventName]: {
          ...current,
          requiredParams: (current.requiredParams || []).filter(
            (p) => p !== param
          ),
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
      const response = await fetch("/api/cms/meta-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isEnabled,
          pixelId: pixelId.trim(),
          capiPixelId: (capiPixelId || pixelId).trim(),
          capiAccessToken: capiAccessToken.trim() || undefined,
          clearAccessToken: clearToken,
          currency,
          testEventCode: testEventCode.trim() || null,
          enableAdvancedMatching,
          enableAutoFbcFbp,
          allowedDomains,
          eventsConfig,
          consentMode,
          debugMode,
        }),
      });

      const result = (await response.json()) as {
        success: boolean;
        data?: MetaAdminConfig;
        error?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(
          result.error || "No se pudo guardar la configuración."
        );
      }

      if (result.data) {
        setHasSavedToken(result.data.hasAccessToken);
        setMaskedToken(result.data.capiAccessTokenMasked);
        setCapiAccessToken("");
        setClearToken(false);
        setUpdatedAt(result.data.updatedAt);
      }

      setFeedback({
        type: "success",
        message:
          "Configuración de Meta Pixel + CAPI guardada y caché invalidada (revalidateTag: 'meta-config'). Los cambios ya están activos en producción sin necesidad de deploy.",
      });
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Error al guardar la configuración.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEvent = async () => {
    setTestingEvent(true);
    setFeedback(null);

    try {
      const res = await fetch("/api/capi/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          capiPixelId: (capiPixelId || pixelId).trim(),
          capiAccessToken: capiAccessToken.trim() || undefined,
          testEventCode: testEventCode.trim() || undefined,
          eventName: "PageView",
        }),
      });

      const data = (await res.json()) as {
        success: boolean;
        eventId?: string;
        error?: string;
        response?: Record<string, unknown>;
      };

      if (data.success) {
        setFeedback({
          type: "success",
          message: `Evento de prueba enviado exitosamente a Meta Graph API v21.0 (event_id: ${data.eventId}). Revisa la pestaña "Probar eventos" en Meta Events Manager.`,
        });
      } else {
        setFeedback({
          type: "error",
          message: `Respuesta de Meta: ${
            data.error || "Verifica que el Pixel ID y Access Token sean válidos."
          }`,
        });
      }
    } catch (err) {
      setFeedback({
        type: "error",
        message:
          err instanceof Error
            ? err.message
            : "Error al enviar evento de prueba.",
      });
    } finally {
      setTestingEvent(false);
    }
  };

  const handleOpenLogs = async () => {
    setLogsModalOpen(true);
    setLoadingLogs(true);
    try {
      const res = await fetch("/api/cms/meta-logs");
      const json = (await res.json()) as {
        success: boolean;
        data?: MetaTrackingLogEntry[];
      };
      if (json.success && Array.isArray(json.data)) {
        setLogs(json.data);
      }
    } catch {
      // Ignorar error de red en logs
    } finally {
      setLoadingLogs(false);
    }
  };

  const advancedConsentSnippet = `// Ejemplo de activación desde un banner personalizado:
window.consent = { marketing: true };
window.dispatchEvent(
  new CustomEvent("meta-consent-updated", { detail: { granted: true } })
);`;

  return (
    <form onSubmit={handleSave} className="space-y-6 pb-12">
      {/* Banner de Feedback */}
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
              <CheckCircle2 className="mt-0.5 shrink-0 text-emerald-600" size={18} />
            ) : (
              <AlertTriangle className="mt-0.5 shrink-0 text-red-600" size={18} />
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

      {/* SECCIÓN 1: ESTADO GLOBAL (KILL SWITCH) */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="text-larioja-azul" size={20} />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                1. Estado Global (Kill Switch)
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Control maestro para encender o apagar instantáneamente Meta Pixel
              (navegador) y Conversions API (servidor) sin modificar código ni hacer
              deploy.
            </p>
          </div>

          <label className="inline-flex cursor-pointer items-center gap-3 self-start sm:self-center">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {isEnabled ? "Tracking ACTIVO" : "Tracking APAGADO"}
            </span>
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={(e) => setIsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative h-7 w-13 rounded-full bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-larioja-azul dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-600 w-12" />
          </label>
        </div>

        {!isEnabled && (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-300 bg-red-50/90 p-3.5 text-red-800 dark:border-red-800/70 dark:bg-red-950/40 dark:text-red-200">
            <AlertTriangle size={20} className="shrink-0 text-red-600" />
            <div className="text-xs sm:text-sm">
              <strong>Kill Switch Desactivado:</strong> El script{" "}
              <code>fbevents.js</code> no se cargará en el navegador y el endpoint{" "}
              <code>/api/capi</code> omitirá todos los envíos a Meta Graph API.
            </div>
          </div>
        )}
      </section>

      {/* SECCIÓN 2: CREDENCIALES */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound className="text-larioja-azul" size={20} />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            2. Credenciales de Meta Business
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="min-w-0">
            <label
              htmlFor="meta-pixel-id"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Meta Pixel ID (Navegador)
            </label>
            <input
              id="meta-pixel-id"
              type="text"
              inputMode="numeric"
              value={pixelId}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "");
                setPixelId(val);
                if (!capiPixelId) setCapiPixelId(val);
              }}
              placeholder="Ej. 123456789012345"
              className="mt-1.5 min-h-[44px] sm:min-h-0 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base sm:text-sm text-slate-900 focus:border-larioja-azul focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500">
              Identificador numérico de 15 a 16 dígitos del conjunto de datos en Meta.
            </p>
          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between">
              <label
                htmlFor="meta-capi-pixel-id"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                CAPI Dataset / Pixel ID (Servidor)
              </label>
              <button
                type="button"
                onClick={() => setCapiPixelId(pixelId)}
                className="text-xs font-medium text-larioja-azul hover:underline"
              >
                Usar mismo Pixel ID
              </button>
            </div>
            <input
              id="meta-capi-pixel-id"
              type="text"
              inputMode="numeric"
              value={capiPixelId}
              onChange={(e) =>
                setCapiPixelId(e.target.value.replace(/\D/g, ""))
              }
              placeholder="Ej. 123456789012345"
              className="mt-1.5 min-h-[44px] sm:min-h-0 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base sm:text-sm text-slate-900 focus:border-larioja-azul focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
            <p className="mt-1 text-xs text-slate-500">
              Generalmente idéntico al Meta Pixel ID para deduplicación por event_id.
            </p>
          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between">
              <label
                htmlFor="meta-capi-token"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Conversions API Access Token
              </label>
              <span className="inline-flex items-center gap-1 rounded bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                <ShieldCheck size={12} /> AES-256-GCM
              </span>
            </div>
            <div className="relative mt-1.5">
              <input
                id="meta-capi-token"
                type={showToken ? "text" : "password"}
                value={capiAccessToken}
                onChange={(e) => {
                  setCapiAccessToken(e.target.value);
                  setClearToken(false);
                }}
                placeholder={
                  hasSavedToken && !clearToken
                    ? `Guardado (${maskedToken}) — escribe para reemplazar`
                    : "EAAxxxxxxxxxxxxxxxxxxxxxxxx..."
                }
                className="min-h-[44px] sm:min-h-0 w-full rounded-lg border border-slate-300 bg-white pl-3.5 pr-10 py-2 text-base sm:text-sm text-slate-900 focus:border-larioja-azul focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                aria-label={showToken ? "Ocultar token" : "Mostrar token"}
                className="min-h-[44px] min-w-[44px] flex items-center justify-center sm:min-h-0 sm:min-w-0 absolute right-1 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                {showToken ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
              <span>
                Se cifra en servidor con AES-256-GCM y jamás se expone al navegador.
              </span>
              {hasSavedToken && !clearToken && (
                <button
                  type="button"
                  onClick={() => {
                    setClearToken(true);
                    setCapiAccessToken("");
                  }}
                  className="text-red-600 hover:underline font-medium"
                >
                  Borrar token actual
                </button>
              )}
            </div>
          </div>

          <div className="min-w-0">
            <div className="flex items-center justify-between">
              <label
                htmlFor="meta-test-code"
                className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
              >
                Test Event Code
              </label>
              <span className="rounded bg-amber-100 dark:bg-amber-900/50 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300">
                Solo DEV / Staging
              </span>
            </div>
            <input
              id="meta-test-code"
              type="text"
              value={testEventCode}
              onChange={(e) => setTestEventCode(e.target.value)}
              placeholder="Ej. TEST12345 (Dejar vacío en producción)"
              className="mt-1.5 min-h-[44px] sm:min-h-0 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base sm:text-sm text-slate-900 focus:border-larioja-azul focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white font-mono"
            />
            <p className="mt-1 text-xs text-slate-500">
              Úsalo para validar en tiempo real en Meta Events Manager.{" "}
              <strong>Déjalo en blanco para tráfico real de campañas.</strong>
            </p>
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: CONFIGURACIÓN GENERAL */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <Sliders className="text-larioja-azul" size={20} />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            3. Configuración General
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0">
            <label
              htmlFor="meta-currency"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Moneda por Defecto
            </label>
            <select
              id="meta-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="mt-1.5 min-h-[44px] sm:min-h-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-larioja-azul focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                Advanced Matching (SHA-256)
              </span>
              <span className="text-xs text-slate-500">
                Envía email y teléfono hasheados en servidor para mejorar el Event Match Quality.
              </span>
            </div>
            <div className="mt-3 flex items-center justify-end">
              <input
                type="checkbox"
                checked={enableAdvancedMatching}
                onChange={(e) => setEnableAdvancedMatching(e.target.checked)}
                aria-label="Habilitar Advanced Matching"
                className="h-4 w-4 rounded border-slate-300 text-larioja-azul focus:ring-larioja-azul cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-3.5">
            <div>
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Captura Automática _fbc / _fbp
              </span>
              <span className="text-xs text-slate-500">
                El middleware captura <code>?fbclid=</code> y persiste cookies por 90 días.
              </span>
            </div>
            <div className="mt-3 flex items-center justify-end">
              <input
                type="checkbox"
                checked={enableAutoFbcFbp}
                onChange={(e) => setEnableAutoFbcFbp(e.target.checked)}
                aria-label="Habilitar captura automática de fbc y fbp"
                className="h-4 w-4 rounded border-slate-300 text-larioja-azul focus:ring-larioja-azul cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-lg border border-slate-200 dark:border-slate-800 p-3.5">
            <div>
              <span className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                Modo Depuración (Debug)
              </span>
              <span className="text-xs text-slate-500">
                Muestra trazas detalladas en la consola del navegador al disparar eventos.
              </span>
            </div>
            <div className="mt-3 flex items-center justify-end">
              <input
                type="checkbox"
                checked={debugMode}
                onChange={(e) => setDebugMode(e.target.checked)}
                aria-label="Habilitar modo depuración"
                className="h-4 w-4 rounded border-slate-300 text-larioja-azul focus:ring-larioja-azul cursor-pointer"
              />
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN 4: MATRIZ DE EVENTOS (DRAG & DROP AEM) */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              4. Matriz de Eventos y Prioridad AEM (Drag & Drop)
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Arrastra las filas para ordenar la prioridad de Aggregated Event
              Measurement (AEM) y elige qué eventos se envían por navegador y por CAPI.
            </p>
          </div>
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
                  <th className="px-4 py-3">Evento Estándar</th>
                  <th className="px-4 py-3 text-center">Activo (Pixel)</th>
                  <th className="px-4 py-3 text-center">Enviar a CAPI</th>
                  <th className="px-4 py-3 text-center">¿Es Crítico?</th>
                  <th className="px-4 py-3">Parámetros Requeridos</th>
                </tr>
              </thead>
              <SortableContext
                items={sortedEventNames}
                strategy={verticalListSortingStrategy}
              >
                <tbody>
                  {sortedEventNames.map((eventName, idx) => (
                    <SortableEventRow
                      key={eventName}
                      eventName={eventName}
                      index={idx}
                      setting={eventsConfig[eventName]}
                      onToggleField={handleToggleEventField}
                      onAddParam={handleAddParam}
                      onRemoveParam={handleRemoveParam}
                    />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </DndContext>
        </div>
      </section>

      {/* SECCIÓN 5: DOMINIO Y CONSENTIMIENTO */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center gap-2 mb-4">
          <Globe className="text-larioja-azul" size={20} />
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            5. Dominios Permitidos y Modo de Consentimiento
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="min-w-0">
            <label
              htmlFor="meta-domain-input"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Dominios Autorizados (Allowed Domains)
            </label>
            <div className="mt-1.5 flex gap-2">
              <input
                id="meta-domain-input"
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
                className="min-h-[44px] sm:min-h-0 min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-base sm:text-sm text-slate-900 focus:border-larioja-azul focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
              Si la lista está vacía se permite cualquier dominio del sitio. Si agregas
              dominios, solo esos dominios podrán disparar Pixel y CAPI.
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
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 px-3 py-1 text-xs font-medium text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-800"
                  >
                    {domain}
                    <button
                      type="button"
                      onClick={() => handleRemoveDomain(domain)}
                      aria-label={`Eliminar dominio ${domain}`}
                      className="text-blue-500 hover:text-red-600"
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
              htmlFor="meta-consent-mode"
              className="block text-sm font-semibold text-slate-700 dark:text-slate-200"
            >
              Modo de Consentimiento de Cookies (Consent Mode)
            </label>
            <select
              id="meta-consent-mode"
              value={consentMode}
              onChange={(e) =>
                setConsentMode(e.target.value as MetaConsentMode)
              }
              className="mt-1.5 min-h-[44px] sm:min-h-0 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base sm:text-sm text-slate-900 focus:border-larioja-azul focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            >
              <option value="disabled">
                Disabled — Disparar Pixel inmediatamente al cargar
              </option>
              <option value="basic">
                Basic — Mostrar banner de cookies y disparar tras aceptar
              </option>
              <option value="advanced">
                Advanced — Integración programática con window.consent.marketing
              </option>
            </select>

            {consentMode === "advanced" && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-900 p-3 text-xs text-slate-100">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-amber-400">
                    Snippet para Banner de Cookies (Advanced):
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      void navigator.clipboard.writeText(advancedConsentSnippet);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-slate-300 hover:text-white"
                  >
                    <Copy size={12} /> Copiar
                  </button>
                </div>
                <pre className="overflow-x-auto font-mono text-[11px] leading-relaxed">
                  {advancedConsentSnippet}
                </pre>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECCIÓN 6: HERRAMIENTAS DE DIAGNÓSTICO Y GUARDADO */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              6. Herramientas de Validación y Diagnóstico
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Prueba la conexión server-side con Graph API v21.0 o inspecciona los
              últimos 50 envíos registrados.
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
              onClick={handleTestEvent}
              disabled={testingEvent}
              className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              {testingEvent ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <Send size={16} className="text-larioja-azul" />
              )}
              Probar Evento
            </button>

            <button
              type="button"
              onClick={handleOpenLogs}
              className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <FileText size={16} className="text-larioja-azul" />
              Ver Logs (Últimos 50)
            </button>

            <a
              href={
                pixelId
                  ? `https://business.facebook.com/events_manager2/list/pixel/${pixelId}`
                  : "https://business.facebook.com/events_manager2"
              }
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              <ExternalLink size={16} className="text-larioja-azul" />
              Validar con Meta
            </a>

            <button
              type="submit"
              disabled={saving}
              className="min-h-[44px] sm:min-h-0 inline-flex items-center gap-2 rounded-lg bg-larioja-azul px-5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-50"
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

      {/* MODAL DE LOGS (ÚLTIMOS 50 ENVÍOS CAPI) */}
      {logsModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Bitácora de los últimos 50 eventos enviados a Meta CAPI"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
        >
          <div className="flex max-h-[85vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Bitácora de Envíos CAPI (Últimos 50 eventos)
                </h3>
                <p className="text-xs text-slate-500">
                  Auditoría en tiempo real de respuestas de Meta Graph API v21.0 y
                  deduplicación por event_id.
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
                  Cargando bitácora de eventos CAPI...
                </div>
              ) : logs.length === 0 ? (
                <div className="py-12 text-center text-sm text-slate-500">
                  Aún no hay eventos registrados en <code>cms_meta_logs</code>. Usa el
                  botón &ldquo;Probar Evento&rdquo; para generar el primero.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-200 bg-slate-50 font-bold uppercase text-slate-600 dark:border-slate-800 dark:bg-slate-800/60 dark:text-slate-300">
                      <tr>
                        <th className="px-3 py-2.5">Fecha</th>
                        <th className="px-3 py-2.5">Evento</th>
                        <th className="px-3 py-2.5">Event ID (Deduplicación)</th>
                        <th className="px-3 py-2.5">Estado</th>
                        <th className="px-3 py-2.5">Respuesta / Detalle</th>
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
                          <td className="px-3 py-2.5 font-mono text-slate-600 dark:text-slate-400">
                            {log.event_id}
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
                          <td className="max-w-xs truncate px-3 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            {log.error_message ||
                              JSON.stringify(log.response || {})}
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
