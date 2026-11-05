"use client";

import React, { useState, useEffect } from "react";
import GalleryManagement from "@/components/admin/cms/GalleryManagement";
import { callAction } from "@/lib/action-client";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import type { InventoryEventRef } from "@/types/bingo";
import {
  getCachedGalleryData,
  setCachedGalleryData,
  subscribeCmsTabsCache,
  type GalleryImage,
} from "@/lib/cms/tabs-prefetch";

interface GalleryDataResponse {
  success: boolean;
  events?: InventoryEventRef[];
  images?: GalleryImage[];
  galleryError?: string | null;
  error?: string;
}

export default function GalleryTabLazy() {
  const [data, setData] = useState<{
    events: InventoryEventRef[];
    images: GalleryImage[];
    galleryError?: string | null;
  } | null>(() => getCachedGalleryData());
  const [loading, setLoading] = useState<boolean>(() => !getCachedGalleryData());
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await callAction<GalleryDataResponse>(
        "cms.getGalleryManagementData",
        []
      );
      if (res && res.success) {
        const payload = {
          events: res.events || [],
          images: res.images || [],
          galleryError: res.galleryError,
        };
        setData(payload);
        setCachedGalleryData(payload);
      } else {
        setError(res?.error || "Error al cargar la galería.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Error de conexión al cargar la galería."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cached = getCachedGalleryData();
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeCmsTabsCache(() => {
      const fresh = getCachedGalleryData();
      if (fresh) {
        setData(fresh);
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
        <span className="text-xs font-medium">Cargando galería...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-900/50 flex flex-col items-center justify-center gap-3">
        <AlertCircle size={28} />
        <p className="text-sm font-semibold">{error || "No se pudo cargar la galería."}</p>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all"
        >
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    );
  }

  if (data.galleryError) {
    return (
      <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-100 text-sm">
        La tabla de galería no parece estar lista aún: {data.galleryError}
      </div>
    );
  }

  return (
    <div className="animate-fade-in transition-opacity duration-200">
      <GalleryManagement
        events={data.events}
        initialImages={data.images}
      />
    </div>
  );
}
