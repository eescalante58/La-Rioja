import React from "react";
import { AdmissionSteps } from "@/components/programs/AdmissionSteps";
import { textOr, type CmsSection } from "@/lib/cms-content";
import type { AdmissionStep } from "@/components/programs/types";
import type { SiteContent } from "@/types/cms";

interface MatriculaProcesoProps {
  /** Fila `matricula_proceso` (controla si la sección está activa en `/matricula`). */
  procesoSection: SiteContent | null;
  /** Fila `cl_admision` de `programs` (fuente única homologada). */
  admisionIntro: SiteContent | null;
  /** Filas `cl_paso_*` activas de `programs` (fuente única homologada). */
  admisionPasos: SiteContent[];
  /** Acción al hacer clic en «Agendar una visita» (abre `MatriculaModalForm` con origen `"proceso"`). */
  onOpenModal: () => void;
}

/**
 * Sección homologada de proceso de inscripción en `/matricula` (`#proceso`).
 * Reutiliza el diseño y contenido de `/programs#admision` (`AdmissionSteps`)
 * y conecta su CTA al formulario modal de conversión de matrícula.
 */
export function MatriculaProceso({
  procesoSection,
  admisionIntro,
  admisionPasos,
  onOpenModal,
}: MatriculaProcesoProps) {
  if (procesoSection && !procesoSection.is_active) {
    return null;
  }

  const intro: CmsSection | undefined = admisionIntro
    ? {
        section_key: admisionIntro.section_key,
        title: admisionIntro.title,
        description: admisionIntro.description,
        image_url: admisionIntro.image_url,
        content_order: admisionIntro.content_order,
        metadata: (admisionIntro.metadata || null) as Record<string, unknown> | null,
      }
    : undefined;

  const steps: AdmissionStep[] = admisionPasos.map((s) => ({
    key: s.section_key,
    title: textOr(s.title, ""),
    text: textOr(s.description, ""),
  }));

  return (
    <AdmissionSteps
      sectionId="proceso"
      intro={intro}
      steps={steps}
      onCtaClick={onOpenModal}
    />
  );
}
