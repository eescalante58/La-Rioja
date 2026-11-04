"use client";

import React, { useState, useEffect } from "react";
import FAQManager from "@/components/admin/FAQManager";
import { callAction } from "@/lib/action-client";
import { AlertCircle, RefreshCw } from "lucide-react";
import type { Tables } from "@/types/database";

interface FAQSection {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  content_order: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  section_id: string | null;
  is_active: boolean;
  content_order: number;
  faq_sections?: { title?: string | null } | null;
}

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
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await callAction<FAQDataResponse>("cms.getFAQAdminData", []);
      if (res && res.success && res.faqs && res.faqSections) {
        setData({
          faqs: res.faqs,
          faqSections: res.faqSections,
        });
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
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-xl" />
        <div className="h-64 w-full bg-slate-100 dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-slate-800" />
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
    <FAQManager
      initialFaqs={data.faqs}
      faqSections={data.faqSections}
    />
  );
}
