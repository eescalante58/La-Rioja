"use client";

import React, { useState, useEffect } from "react";
import GalleryManagement from "@/components/admin/cms/GalleryManagement";
import { callAction } from "@/lib/action-client";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { InventoryEventRef } from "@/types/bingo";

interface GalleryImage {
  id: string;
  company_id: number;
  event_id: string;
  image_url: string;
  is_active: boolean;
  content_order: number;
}

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
  } | null>(null);
  const [loading, setLoading] = useState(true);
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
        setData({
          events: res.events || [],
          images: res.images || [],
          galleryError: res.galleryError,
        });
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
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800"
            />
          ))}
        </div>
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
    <GalleryManagement
      events={data.events}
      initialImages={data.images}
    />
  );
}
