"use client";

import React, { useState } from "react";
import { TextInput, NumberInput, Switch, Text, Callout, Button } from "@tremor/react";
import { AlertCircle, CheckCircle2, Copy, Sparkles, Target, MessageSquare } from "lucide-react";

interface MatriculaFieldsEditorProps {
  sectionKey: string;
  metadata: Record<string, unknown>;
  onChange: (updatedMeta: Record<string, unknown>) => void;
  isActive: boolean;
  onToggleActive: (active: boolean) => void;
}

export function MatriculaFieldsEditor({
  sectionKey,
  metadata,
  onChange,
  isActive,
  onToggleActive,
}: MatriculaFieldsEditorProps) {
  const [copied, setCopied] = useState(false);

  const updateMetaField = (key: string, value: unknown) => {
    onChange({
      ...metadata,
      [key]: value,
    });
  };

  // 1. Control maestro de publicación: Pestaña
  if (sectionKey === "pestaña") {
    return (
      <div className="rounded-2xl border-2 border-larioja-azul/20 bg-blue-50/60 dark:bg-blue-950/20 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-montserrat text-base font-bold text-larioja-azul dark:text-larioja-amarillo">
              Interruptor Maestro de Publicación (/matricula)
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Controla si la página de Matrícula está visible públicamente y si aparece en Navbar, MobileMenu y Footer.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold uppercase ${isActive ? "text-emerald-600" : "text-rose-600"}`}>
              {isActive ? "Página Publicada" : "Página Oculta (404)"}
            </span>
            <Switch checked={isActive} onChange={onToggleActive} />
          </div>
        </div>

        <Callout
          title={isActive ? "Estado: Activa" : "Estado: Desactivada"}
          color={isActive ? "emerald" : "rose"}
          icon={isActive ? CheckCircle2 : AlertCircle}
        >
          {isActive
            ? "La ruta pública /matricula responde activamente y el enlace 'Matrícula' es visible inmediatamente después de 'Programas' en la barra de navegación y pie de página."
            : "La ruta /matricula devuelve HTTP 404 a visitantes directos y los enlaces en Navbar, Menú móvil y Footer están ocultos."}
        </Callout>
      </div>
    );
  }

  // 2. Editor de Cupos
  if (sectionKey === "matricula_cupos") {
    const count = typeof metadata.count === "number" ? metadata.count : 23;
    const showCount = metadata.show_count !== false;
    const zeroLabel = (metadata.zero_label as string) || "Cupos agotados";
    const updatedLabel = (metadata.updated_label as string) || "Actualizado recientemente";

    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Sparkles className="text-brand-yellow h-5 w-5" />
          <h4 className="font-montserrat text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Gestión de Cupos de Matrícula
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Cupos Disponibles (Entero)
            </label>
            <input
              type="number"
              min={0}
              value={count}
              onChange={(e) => updateMetaField("count", Math.max(0, parseInt(e.target.value) || 0))}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3.5 py-2 text-sm bg-white dark:bg-gray-950 focus:ring-2 focus:ring-larioja-azul"
            />
            <Text className="text-[11px] text-gray-400 mt-1">Dato informativo manual del ciclo escolar.</Text>
          </div>

          <div className="flex flex-col justify-center">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Mostrar Insignia de Cupos en el Hero
            </label>
            <div className="flex items-center gap-3 pt-1">
              <Switch checked={showCount} onChange={(val) => updateMetaField("show_count", val)} />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {showCount ? "Visible" : "Oculto"}
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Texto cuando no haya cupos (count = 0)
            </label>
            <TextInput
              value={zeroLabel}
              onValueChange={(val) => updateMetaField("zero_label", val)}
              placeholder="Cupos agotados"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Etiqueta de actualización
            </label>
            <TextInput
              value={updatedLabel}
              onValueChange={(val) => updateMetaField("updated_label", val)}
              placeholder="Actualizado recientemente"
            />
          </div>
        </div>
      </div>
    );
  }

  // 3. Editor de WhatsApp
  if (sectionKey === "matricula_whatsapp") {
    const phoneE164 = (metadata.phone_e164 as string) || "+50377310792";
    const displayPhone = (metadata.display_phone as string) || "7731-0792";
    const messageTemplate =
      (metadata.message_template as string) ||
      "Solicitud de matrícula {year}\nNombre: {name}\nCorreo: {email}\nTeléfono: {phone}\nConsulta: {type}\nMensaje: {message}";

    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <MessageSquare className="text-emerald-500 h-5 w-5" />
          <h4 className="font-montserrat text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Configuración de WhatsApp de Admisiones
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Teléfono Destino (Formato E.164)
            </label>
            <TextInput
              value={phoneE164}
              onValueChange={(val) => updateMetaField("phone_e164", val)}
              placeholder="+50377310792"
            />
            <Text className="text-[11px] text-gray-400 mt-1">Utilizado para generar el enlace wa.me oficial.</Text>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Teléfono para Mostrar en Pantalla
            </label>
            <TextInput
              value={displayPhone}
              onValueChange={(val) => updateMetaField("display_phone", val)}
              placeholder="7731-0792"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Plantilla del Mensaje de WhatsApp
            </label>
            <textarea
              rows={4}
              value={messageTemplate}
              onChange={(e) => updateMetaField("message_template", e.target.value)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 p-3 text-sm bg-white dark:bg-gray-950 font-mono text-xs focus:ring-2 focus:ring-larioja-azul"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] text-gray-500 font-semibold">Tokens permitidos:</span>
              {["{year}", "{name}", "{email}", "{phone}", "{type}", "{message}"].map((token) => (
                <span
                  key={token}
                  className="rounded-md bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 border border-emerald-200"
                >
                  {token}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 4. Editor de UTM y Atribución
  if (sectionKey === "matricula_utm") {
    const ttlMinutes = typeof metadata.ttl_minutes === "number" ? metadata.ttl_minutes : 30;
    const defaults = (metadata.campaign_defaults || {}) as Record<string, string>;
    const source = defaults.source || "google";
    const medium = defaults.medium || "cpc";
    const campaign = defaults.campaign || "matricula_2027";
    const urlSuffix = `utm_source=${source}&utm_medium=${medium}&utm_campaign=${campaign}`;

    const handleCopy = () => {
      navigator.clipboard.writeText(urlSuffix);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-6 space-y-5">
        <h4 className="font-montserrat text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Configuración de Parámetros UTM para Campañas
        </h4>

        {/* Generador de sufijo para pegar en Google Ads */}
        <div className="rounded-xl bg-white dark:bg-gray-900 p-4 border border-blue-200 dark:border-blue-900">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Sufijo de URL final para Google Ads:
            </span>
            <Button
              size="xs"
              variant="secondary"
              icon={copied ? CheckCircle2 : Copy}
              onClick={handleCopy}
            >
              {copied ? "¡Copiado!" : "Copiar Sufijo"}
            </Button>
          </div>
          <code className="text-xs font-mono text-blue-700 dark:text-blue-400 break-all">
            {urlSuffix}
          </code>
          <p className="text-[11px] text-gray-400 mt-2">
            Pega este sufijo en la sección «Opciones de URL de campaña» de Google Ads (sin signo de interrogación inicial).
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Fuente predeterminada (utm_source)
            </label>
            <TextInput
              value={source}
              onValueChange={(val) =>
                onChange({
                  ...metadata,
                  campaign_defaults: { ...defaults, source: val.trim() },
                })
              }
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Medio predeterminado (utm_medium)
            </label>
            <TextInput
              value={medium}
              onValueChange={(val) =>
                onChange({
                  ...metadata,
                  campaign_defaults: { ...defaults, medium: val.trim() },
                })
              }
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Nombre de Campaña (utm_campaign)
            </label>
            <TextInput
              value={campaign}
              onValueChange={(val) =>
                onChange({
                  ...metadata,
                  campaign_defaults: { ...defaults, campaign: val.trim() },
                })
              }
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
              Tiempo de vida en sesión (TTL en minutos)
            </label>
            <input
              type="number"
              min={1}
              max={1440}
              value={ttlMinutes}
              onChange={(e) => updateMetaField("ttl_minutes", parseInt(e.target.value) || 30)}
              className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3.5 py-2 text-sm bg-white dark:bg-gray-950 focus:ring-2 focus:ring-larioja-azul"
            />
          </div>
        </div>
      </div>
    );
  }

  // 6. Configuración Técnica
  if (sectionKey === "matricula_config") {
    const year = typeof metadata.admission_year === "number" ? metadata.admission_year : 2027;

    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50 p-6 space-y-4">
        <h4 className="font-montserrat text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
          Año del Ciclo de Admisión
        </h4>
        <div className="max-w-xs">
          <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
            Año Escolar ({year})
          </label>
          <input
            type="number"
            min={2026}
            max={2100}
            value={year}
            onChange={(e) => updateMetaField("admission_year", parseInt(e.target.value) || 2027)}
            className="w-full rounded-xl border border-gray-300 dark:border-gray-700 px-3.5 py-2 text-sm bg-white dark:bg-gray-950 focus:ring-2 focus:ring-larioja-azul"
          />
          <Text className="text-[11px] text-gray-400 mt-1">
            Reemplaza automáticamente el token &#123;year&#125; en el Hero y mensajes.
          </Text>
        </div>
      </div>
    );
  }

  return null;
}
