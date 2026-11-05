"use client";

import { callAction } from "@/lib/action-client";
import type { InventoryEventRef } from "@/types/bingo";
import type { MetaAdminConfig } from "@/types/meta-tracking";
import type { GoogleAdsAdminConfig } from "@/types/google-ads-tracking";

export interface FAQSection {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  content_order: number;
}

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  section_id: string | null;
  is_active: boolean;
  content_order: number;
  faq_sections?: { title?: string | null } | null;
}

export interface FAQData {
  faqs: FAQ[];
  faqSections: FAQSection[];
}

export interface GalleryImage {
  id: string;
  company_id: number;
  event_id: string;
  image_url: string;
  is_active: boolean;
  content_order: number;
}

export interface GalleryData {
  events: InventoryEventRef[];
  images: GalleryImage[];
  galleryError?: string | null;
}

export interface MetaConfigData {
  config: MetaAdminConfig | null;
  canEdit: boolean;
}

export interface GoogleAdsConfigData {
  config: GoogleAdsAdminConfig | null;
  canEdit: boolean;
}

interface FAQDataResponse {
  success: boolean;
  faqs?: FAQ[];
  faqSections?: FAQSection[];
  error?: string;
}

interface GalleryDataResponse {
  success: boolean;
  events?: InventoryEventRef[];
  images?: GalleryImage[];
  galleryError?: string | null;
  error?: string;
}

// Variables de estado en memoria del cliente
let cachedFaqData: FAQData | null = null;
let cachedGalleryData: GalleryData | null = null;
let cachedMetaConfig: MetaConfigData | null = null;
let cachedGoogleAdsConfig: GoogleAdsConfigData | null = null;

let isPrefetching = false;
let hasPrefetched = false;

// Suscriptores para notificar cuando los datos precargados estén listos
type CacheListener = () => void;
const listeners: Set<CacheListener> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // Ignorar errores en callbacks de componentes desmontados
    }
  });
}

/**
 * Suscribe un componente para ser notificado cuando el prefetch en segundo plano actualice la caché.
 */
export function subscribeCmsTabsCache(listener: CacheListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// Getters de datos en caché
export function getCachedFaqData(): FAQData | null {
  return cachedFaqData;
}

export function getCachedGalleryData(): GalleryData | null {
  return cachedGalleryData;
}

export function getCachedMetaConfig(): MetaConfigData | null {
  return cachedMetaConfig;
}

export function getCachedGoogleAdsConfig(): GoogleAdsConfigData | null {
  return cachedGoogleAdsConfig;
}

// Setters para mutaciones locales en tabs
export function setCachedFaqData(data: FAQData | null): void {
  cachedFaqData = data;
}

export function setCachedGalleryData(data: GalleryData | null): void {
  cachedGalleryData = data;
}

export function setCachedMetaConfig(data: MetaConfigData | null): void {
  cachedMetaConfig = data;
}

export function setCachedGoogleAdsConfig(data: GoogleAdsConfigData | null): void {
  cachedGoogleAdsConfig = data;
}

/**
 * Invalida toda la caché de pestañas.
 */
export function invalidateCmsTabsCache(): void {
  cachedFaqData = null;
  cachedGalleryData = null;
  cachedMetaConfig = null;
  cachedGoogleAdsConfig = null;
  hasPrefetched = false;
}

/**
 * Ejecuta la pre-carga asíncrona de datos de las pestañas secundarias del CMS en tiempo ocioso (idle time).
 * No bloquea la UI ni compite con el render de Contenido General.
 */
export function prefetchCmsTabs(): void {
  if (typeof window === "undefined") return;
  if (isPrefetching || hasPrefetched) return;

  isPrefetching = true;

  const runTasks = async () => {
    try {
      // 1. Prefetch FAQ si no está en caché
      const faqPromise = !cachedFaqData
        ? callAction<FAQDataResponse>("cms.getFAQAdminData", [])
            .then((res) => {
              if (res && res.success && res.faqs && res.faqSections) {
                cachedFaqData = {
                  faqs: res.faqs,
                  faqSections: res.faqSections,
                };
              }
            })
            .catch(() => {
              // Silencioso; FAQTabLazy reintentará al montar si hiciera falta
            })
        : Promise.resolve();

      // 2. Prefetch Galería si no está en caché
      const galleryPromise = !cachedGalleryData
        ? callAction<GalleryDataResponse>("cms.getGalleryManagementData", [])
            .then((res) => {
              if (res && res.success) {
                cachedGalleryData = {
                  events: res.events || [],
                  images: res.images || [],
                  galleryError: res.galleryError,
                };
              }
            })
            .catch(() => {
              // Silencioso
            })
        : Promise.resolve();

      // 3. Prefetch Meta Pixel si no está en caché
      const metaPromise = !cachedMetaConfig
        ? fetch("/api/cms/meta-config?admin=1", {
            headers: { "Cache-Control": "no-cache" },
          })
            .then(async (res) => {
              const json = await res.json();
              if (res.ok && json.success && json.data) {
                cachedMetaConfig = { config: json.data, canEdit: true };
              } else if (res.status === 403) {
                cachedMetaConfig = { config: null, canEdit: false };
              }
            })
            .catch(() => {
              // Silencioso
            })
        : Promise.resolve();

      // 4. Prefetch Google Ads si no está en caché
      const googleAdsPromise = !cachedGoogleAdsConfig
        ? fetch("/api/cms/google-ads-config?admin=1", {
            headers: { "Cache-Control": "no-cache" },
          })
            .then(async (res) => {
              const json = await res.json();
              if (res.ok && json.success && json.data) {
                cachedGoogleAdsConfig = { config: json.data, canEdit: true };
              } else if (res.status === 403) {
                cachedGoogleAdsConfig = { config: null, canEdit: false };
              }
            })
            .catch(() => {
              // Silencioso
            })
        : Promise.resolve();

      await Promise.allSettled([
        faqPromise,
        galleryPromise,
        metaPromise,
        googleAdsPromise,
      ]);

      hasPrefetched = true;
      notifyListeners();
    } finally {
      isPrefetching = false;
    }
  };

  if ("requestIdleCallback" in window) {
    (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => void }).requestIdleCallback(
      () => {
        runTasks();
      },
      { timeout: 1500 }
    );
  } else {
    setTimeout(runTasks, 150);
  }
}
