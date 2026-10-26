"use client";

import React, { useState, useEffect } from "react";
import { captureAndStoreUtm } from "@/lib/matricula/utm";
import { MatriculaIntro } from "./MatriculaIntro";
import { MatriculaHero } from "./MatriculaHero";
import { MatriculaProgramas } from "./MatriculaProgramas";
import { MatriculaProceso } from "./MatriculaProceso";
import { MatriculaCierre } from "./MatriculaCierre";
import { MatriculaStickyMobileCTA } from "./MatriculaStickyMobileCTA";
import { MatriculaModalForm } from "./MatriculaModalForm";
import { MatriculaGoogleAds } from "./MatriculaGoogleAds";
import type { MatriculaPageData } from "@/lib/matricula/matricula-service";
import type {
  MatriculaAdsConfig,
  MatriculaWhatsAppConfig,
  MatriculaUtmConfig,
} from "@/lib/validation/matricula";

interface MatriculaPageClientProps {
  pageData: MatriculaPageData;
  admissionYear: number;
}

export function MatriculaPageClient({ pageData, admissionYear }: MatriculaPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOrigin, setModalOrigin] = useState<"intro" | "hero" | "cierre" | "sticky_mobile">("hero");

  const adsConfig = (pageData.ads?.metadata || null) as MatriculaAdsConfig | null;
  const whatsappConfig = (pageData.whatsapp?.metadata || null) as MatriculaWhatsAppConfig | null;
  const utmConfig = (pageData.utm?.metadata || null) as Partial<MatriculaUtmConfig> | null;

  // Captura y almacenamiento de parámetros UTM en cliente según configuración CMS
  useEffect(() => {
    captureAndStoreUtm(utmConfig || undefined);
  }, [utmConfig]);

  const openModalWithOrigin = (origin: "intro" | "hero" | "cierre" | "sticky_mobile") => {
    setModalOrigin(origin);
    setIsModalOpen(true);
  };

  return (
    <div className="relative pb-16 lg:pb-0">
      {/* Carga declarativa y aislada de Google Ads */}
      <MatriculaGoogleAds config={adsConfig} />

      {/* Bloque superior intro bajo navbar */}
      <MatriculaIntro
        introSection={pageData.intro}
        onOpenModal={() => openModalWithOrigin("intro")}
      />

      {/* Hero principal con fotografía e insignia de cupos */}
      <MatriculaHero
        heroSection={pageData.hero}
        cuposSection={pageData.cupos}
        admissionYear={admissionYear}
        onOpenModal={() => openModalWithOrigin("hero")}
      />

      {/* Sección de Programas (Colegio y CFL) */}
      <MatriculaProgramas
        programasSection={pageData.programas}
        colegioSection={pageData.programaColegio}
        cflSection={pageData.programaCfl}
      />

      {/* Sección de Proceso con los 3 pasos */}
      <MatriculaProceso
        procesoSection={pageData.proceso}
        pasos={pageData.pasos}
      />

      {/* Bloque de Cierre con CTA antes del Footer global */}
      <MatriculaCierre
        cierreSection={pageData.cierre}
        whatsappConfig={whatsappConfig}
        onOpenModal={() => openModalWithOrigin("cierre")}
      />

      {/* Barra fija inferior móvil */}
      <MatriculaStickyMobileCTA
        ctaMovilSection={pageData.ctaMovil}
        onOpenModal={() => openModalWithOrigin("sticky_mobile")}
      />

      {/* Formulario Modal accesible */}
      <MatriculaModalForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        originPosition={modalOrigin}
        formSection={pageData.formulario}
        whatsappConfig={whatsappConfig}
        adsConfig={adsConfig}
        admissionYear={admissionYear}
      />
    </div>
  );
}
