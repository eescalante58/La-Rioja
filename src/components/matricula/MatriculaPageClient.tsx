"use client";

import React, { useState, useEffect } from "react";
import { captureAndStoreUtm } from "@/lib/matricula/utm";
import { MatriculaIntro } from "./MatriculaIntro";
import { MatriculaHero } from "./MatriculaHero";
import { MatriculaProgramas } from "./MatriculaProgramas";
import { MatriculaProceso } from "./MatriculaProceso";
import { MatriculaCierre } from "./MatriculaCierre";
import { MatriculaStickyMobileCTA } from "./MatriculaStickyMobileCTA";
import { MatriculaModalForm, type MatriculaModalOrigin } from "./MatriculaModalForm";
import type { MatriculaPageData } from "@/lib/matricula/matricula-service";
import type {
  MatriculaWhatsAppConfig,
  MatriculaUtmConfig,
} from "@/lib/validation/matricula";

interface MatriculaPageClientProps {
  pageData: MatriculaPageData;
  admissionYear: number;
}

export function MatriculaPageClient({ pageData, admissionYear }: MatriculaPageClientProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalOrigin, setModalOrigin] = useState<MatriculaModalOrigin>("hero");

  const whatsappConfig = (pageData.whatsapp?.metadata || null) as MatriculaWhatsAppConfig | null;
  const utmConfig = (pageData.utm?.metadata || null) as Partial<MatriculaUtmConfig> | null;

  // Captura y almacenamiento de parámetros UTM en cliente según configuración CMS
  useEffect(() => {
    captureAndStoreUtm(utmConfig || undefined);
  }, [utmConfig]);

  const openModalWithOrigin = (origin: MatriculaModalOrigin) => {
    setModalOrigin(origin);
    setIsModalOpen(true);
  };

  return (
    <div className="relative pb-16 lg:pb-0">
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

      {/* Sección de Proceso homologada con /programs#admision */}
      <MatriculaProceso
        procesoSection={pageData.proceso}
        admisionIntro={pageData.admisionIntro}
        admisionPasos={pageData.admisionPasos}
        onOpenModal={() => openModalWithOrigin("proceso")}
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
        admissionYear={admissionYear}
      />
    </div>
  );
}
