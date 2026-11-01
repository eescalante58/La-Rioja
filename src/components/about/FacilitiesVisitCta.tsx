"use client";

import React, { useState, useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { PrivacyNotice } from "@/components/layout/PrivacyNotice";
import { MatriculaModalForm } from "@/components/matricula/MatriculaModalForm";
import { captureAndStoreUtm } from "@/lib/matricula/utm";
import { BTN_WHATSAPP } from "@/components/site/section-ui";
import type { AdmissionModalConfig } from "@/components/programs/AdmissionSteps";

interface FacilitiesVisitCtaProps {
  /** Texto del botón (metadata.boton_visita de cl_instalaciones). */
  label: string;
  /** Configuración del modal de matrícula (misma forma que AdmissionModalConfig de /programs). */
  modalConfig: AdmissionModalConfig;
}

/**
 * Botón «Agendar una visita» con aviso de privacidad para el pie de la sección
 * «Conoce nuestras instalaciones» en /about. Abre MatriculaModalForm con origen "instalaciones".
 */
export function FacilitiesVisitCta({ label, modalConfig }: FacilitiesVisitCtaProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    captureAndStoreUtm(modalConfig.utmConfig || undefined);
  }, [modalConfig.utmConfig]);

  return (
    <div className="flex w-full flex-col items-stretch gap-0.5 sm:w-auto sm:items-start">
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`${BTN_WHATSAPP} rounded-[14px] cursor-pointer w-full sm:w-auto`}
      >
        <MessageCircle size={20} aria-hidden="true" />
        {label}
      </button>
      <PrivacyNotice variant="whatsapp" className="text-center sm:text-left" />

      <MatriculaModalForm
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        originPosition="instalaciones"
        formSection={modalConfig.formSection}
        whatsappConfig={modalConfig.whatsappConfig}
        admissionYear={modalConfig.admissionYear}
      />
    </div>
  );
}
