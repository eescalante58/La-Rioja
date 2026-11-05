"use client";

import React, { useState, useEffect } from "react";
import FAQManager from "@/components/admin/FAQManager";
import { callAction } from "@/lib/action-client";
import { AlertCircle, RefreshCw } from "lucide-react";
import {
  getCachedFaqData,
  setCachedFaqData,
  subscribeCmsTabsCache,
  type FAQ,
  type FAQSection,
} from "@/lib/cms/tabs-prefetch";

interface FAQDataResponse {
  success: boolean;
  faqs?: FAQ[];
  faqSections?: FAQSection[];
  error?: string;
}

export default function FAQTabLazy() {
  const [data, setData] = useState<{
    faqs: FAQ[];
    faqSections: FAQSection[];
  } | null>(() => getCachedFaqData());
  const [loading, setLoading] = useState<boolean>(() => !getCachedFaqData());
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await callAction<FAQDataResponse>("cms.getFAQAdminData", []);
      if (res && res.success && res.faqs && res.faqSections) {
        const payload = {
          faqs: res.faqs,
          faqSections: res.faqSections,
        };
        setData(payload);
        setCachedFaqData(payload);
      } else {
        setError(res?.error || "Error al cargar las preguntas frecuentes.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error de conexión al cargar FAQs."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Si ya teníamos datos en caché al montar, no se requiere llamada de red
    const cached = getCachedFaqData();
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }

    // Suscribirse por si el prefetch en segundo plano aún estaba corriendo
    const unsubscribe = subscribeCmsTabsCache(() => {
      const fresh = getCachedFaqData();
      if (fresh) {
        setData(fresh);
        setLoading(false);
      }
    });

    // Si aún no hay datos y no están listos, cargar directamente
    loadData();

    return () => {
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 opacity-60 animate-pulse transition-opacity duration-300 py-1">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
        <div className="h-72 w-full bg-slate-100 dark:bg-slate-850/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/50" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl border border-red-200 dark:border-red-900/50 flex flex-col items-center justify-center gap-3">
        <AlertCircle size={28} />
        <p className="text-sm font-semibold">{error || "No se pudieron obtener las FAQs."}</p>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all"
        >
          <RefreshCw size={14} /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="animate-fade-in transition-opacity duration-200">
      <FAQManager
        initialFaqs={data.faqs}
        faqSections={data.faqSections}
      />
    </div>
  );
}
