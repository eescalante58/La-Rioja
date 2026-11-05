"use client";

import React, { useState, useEffect } from "react";
import GoogleAdsConfigManager from "@/components/admin/cms/GoogleAdsConfigManager";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import type { GoogleAdsAdminConfig } from "@/types/google-ads-tracking";
import {
  getCachedGoogleAdsConfig,
  setCachedGoogleAdsConfig,
  subscribeCmsTabsCache,
} from "@/lib/cms/tabs-prefetch";

export default function GoogleAdsTabLazy() {
  const [config, setConfig] = useState<GoogleAdsAdminConfig | null>(
    () => getCachedGoogleAdsConfig()?.config ?? null
  );
  const [canEdit, setCanEdit] = useState<boolean>(
    () => getCachedGoogleAdsConfig()?.canEdit ?? true
  );
  const [loading, setLoading] = useState<boolean>(() => !getCachedGoogleAdsConfig());
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cms/google-ads-config?admin=1", {
        headers: { "Cache-Control": "no-cache" },
      });
      const json = await res.json();
      if (res.ok && json.success && json.data) {
        setConfig(json.data);
        setCanEdit(true);
        setCachedGoogleAdsConfig({ config: json.data, canEdit: true });
      } else {
        if (res.status === 403) {
          setCanEdit(false);
          setCachedGoogleAdsConfig({ config: null, canEdit: false });
          setError("Se requiere rol Administrador (nivel 8) para configurar Google Ads.");
        } else {
          setError(json.error || "Error al obtener la configuración de Google Ads.");
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error de conexión al cargar Google Ads."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = getCachedGoogleAdsConfig();
    if (cached) {
      setConfig(cached.config);
      setCanEdit(cached.canEdit);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeCmsTabsCache(() => {
      const fresh = getCachedGoogleAdsConfig();
      if (fresh) {
        setConfig(fresh.config);
        setCanEdit(fresh.canEdit);
        setLoading(false);
      }
    });

    loadData();

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-slate-500 dark:text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-larioja-azul dark:text-larioja-amarillo" />
        <span className="text-xs font-medium">Cargando Google Ads...</span>
      </div>
    );
  }

  if (error || !config) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-900/50 flex flex-col items-center justify-center gap-3">
        <AlertCircle size={28} />
        <p className="text-sm font-semibold">{error || "No se pudo cargar la configuración de Google Ads."}</p>
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
    <div className="animate-fade-in transition-opacity duration-200">
      <GoogleAdsConfigManager
        initialConfig={config}
        canEdit={canEdit}
      />
    </div>
  );
}
