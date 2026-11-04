"use client";

import React, { useState, useEffect } from "react";
import MetaPixelConfigManager from "@/components/admin/cms/MetaPixelConfigManager";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { MetaAdminConfig } from "@/types/meta-tracking";

export default function MetaPixelTabLazy() {
  const [config, setConfig] = useState<MetaAdminConfig | null>(null);
  const [canEdit, setCanEdit] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/meta-config?admin=1", {
        headers: { "Cache-Control": "no-cache" },
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setConfig(json.data);
        setCanEdit(true);
      } else {
        if (res.status === 403) {
          setCanEdit(false);
          setError("Se requiere rol Administrador (nivel 8) para configurar Meta Pixel.");
        } else {
          setError(json.error || "Error al obtener la configuración de Meta Pixel.");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error de conexión al cargar Meta Pixel."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-96 w-full bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800" />
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-900/50 flex flex-col items-center justify-center gap-3">
        <AlertCircle size={28} />
        <p className="text-sm font-semibold">{error || "No se pudo cargar la configuración de Meta Pixel."}</p>
        {canEdit && (
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all"
          >
            <RefreshCw size={14} /> Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <MetaPixelConfigManager
      initialConfig={config}
      canEdit={canEdit}
    />
  );
}
