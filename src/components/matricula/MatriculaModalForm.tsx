"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import Link from "next/link";
import { X, Send, CheckCircle2, AlertCircle, ArrowUpRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/layout/WhatsAppIcon";
import { getStoredAttribution } from "@/lib/matricula/utm";
import { resolveWhatsAppUrl } from "@/lib/matricula/whatsapp";
import { triggerMatriculaConversion } from "./MatriculaGoogleAds";
import type { SiteContent } from "@/types/cms";
import type { MatriculaAdsConfig, MatriculaWhatsAppConfig } from "@/lib/validation/matricula";

export interface MatriculaModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  originPosition: "intro" | "hero" | "cierre" | "sticky_mobile";
  formSection: SiteContent | null;
  whatsappConfig: MatriculaWhatsAppConfig | null;
  adsConfig: MatriculaAdsConfig | null;
  admissionYear: number;
}

export function MatriculaModalForm({
  isOpen,
  onClose,
  originPosition,
  formSection,
  whatsappConfig,
  adsConfig,
  admissionYear,
}: MatriculaModalFormProps) {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [idempotencyKey, setIdempotencyKey] = useState<string>("");
  const [waUrl, setWaUrl] = useState<string>("");

  const modalRef = useRef<HTMLDivElement>(null);
  const conversionFiredRef = useRef(false);

  const meta = (formSection?.metadata || {}) as Record<string, unknown>;
  const labels = (meta.field_labels || {}) as Record<string, string>;
  const placeholders = (meta.field_placeholders || {}) as Record<string, string>;
  const helpTexts = (meta.help_texts || {}) as Record<string, string>;
  const inquiryOptions = (meta.inquiry_options as string[]) || [
    "Información de Inscripción",
    "Colegio La Rioja (12-20 años)",
    "Centro de Formación Laboral (20-55 años)",
    "Visita guiada a instalaciones",
    "Otra consulta",
  ];
  const defaultInquiry = (meta.default_inquiry as string) || inquiryOptions[0] || "Información de Inscripción";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: defaultInquiry,
    message: "",
    hp_field: "",
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generar clave de idempotencia al abrir el modal o resetear
  useEffect(() => {
    if (isOpen) {
      if (typeof crypto !== "undefined" && crypto.randomUUID) {
        setIdempotencyKey(crypto.randomUUID());
      } else {
        setIdempotencyKey(`idemp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
      }
      setIsSuccess(false);
      setGlobalError(null);
      setFieldErrors({});
      conversionFiredRef.current = false;
    }
  }, [isOpen]);

  // Manejo de foco y tecla Escape para accesibilidad
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !isSubmitting) {
        onClose();
      }
    },
    [isOpen, isSubmitting, onClose]
  );

  useEffect(() => {
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !mounted) return null;

  const validateClient = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      errors.name = "Ingresa tu nombre completo (al menos 2 caracteres).";
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email.trim())) {
      errors.email = "Ingresa un correo electrónico válido.";
    }
    if (formData.phone && formData.phone.trim().length > 0) {
      if (!/^[0-9+\s\-().]{6,25}$/.test(formData.phone.trim())) {
        errors.phone = "Ingresa un número telefónico válido (ej. 7731-0792).";
      }
    }
    if (!formData.message.trim() || formData.message.trim().length < 10) {
      errors.message = "El mensaje debe tener al menos 10 caracteres.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateClient()) return;

    setIsSubmitting(true);
    setGlobalError(null);

    try {
      const attribution = getStoredAttribution();

      const response = await fetch("/api/public/matricula/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone || null,
          type: formData.type,
          message: formData.message,
          idempotency_key: idempotencyKey,
          attribution,
          hp_field: formData.hp_field,
        }),
      });

      const json = await response.json().catch(() => null);

      if (response.ok && json?.success) {
        // Solicitud guardada exitosamente en BD
        const phoneE164 = whatsappConfig?.phone_e164 || "+50377310792";
        const template =
          whatsappConfig?.message_template ||
          "Solicitud de matrícula {year}\nNombre: {name}\nCorreo: {email}\nTeléfono: {phone}\nConsulta: {type}\nMensaje: {message}";

        const generatedUrl = resolveWhatsAppUrl({
          template,
          phoneE164,
          year: admissionYear,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          type: formData.type,
          message: formData.message,
        });

        setWaUrl(generatedUrl);
        setIsSuccess(true);
      } else {
        setGlobalError(json?.error || "No se pudo guardar tu solicitud. Por favor intenta de nuevo.");
      }
    } catch {
      setGlobalError("Fallo de conexión al enviar la solicitud. Verifica tu conexión e intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenWhatsApp = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!waUrl) return;

    if (!conversionFiredRef.current) {
      conversionFiredRef.current = true;
      triggerMatriculaConversion({
        config: adsConfig,
        targetUrl: waUrl,
        onNavigate: () => {
          window.location.href = waUrl;
        },
      });
    } else {
      // Si ya se disparó la conversión en este flujo, navegar directamente sin volver a emitir
      window.location.href = waUrl;
    }
  };

  const submitLabel = (meta.submit_label as string) || "Guardar y continuar";
  const successTitle = (meta.success_title as string) || "Solicitud guardada con éxito";
  const successDesc =
    (meta.success_description as string) ||
    "Hemos registrado tus datos en nuestro sistema. Ahora continúa a WhatsApp para enviar tu mensaje directo a nuestro equipo de admisiones.";
  const waLinkLabel = (meta.whatsapp_link_label as string) || "Abrir WhatsApp";

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="matricula-modal-title"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-xl rounded-2xl bg-white shadow-2xl dark:bg-gray-900 border border-gray-100 dark:border-gray-800 my-8 overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Encabezado con marca institucional */}
        <div className="relative border-b border-gray-100 dark:border-gray-800 bg-gray-50/70 dark:bg-gray-800/50 px-6 py-5 sm:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white p-1.5 shadow-xs border border-gray-100">
                <Image
                  src="/logo.svg"
                  alt="La Rioja"
                  width={120}
                  height={36}
                  className="h-7 w-auto"
                />
              </div>
              <div>
                <h2
                  id="matricula-modal-title"
                  className="font-montserrat text-lg font-bold text-larioja-azul dark:text-larioja-amarillo"
                >
                  Matrícula {admissionYear}
                </h2>
                <p className="font-inter text-xs text-gray-500 dark:text-gray-400">
                  Solicitud de Admisión e Información
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              disabled={isSubmitting}
              aria-label="Cerrar formulario de contacto"
              className="grid h-10 w-10 place-items-center rounded-full text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-700 dark:hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-larioja-azul"
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Contenido del modal */}
        <div className="p-6 sm:p-8 font-inter">
          {globalError && (
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-sm text-red-800 dark:bg-red-950/40 dark:text-red-200 border border-red-200/60 dark:border-red-900/40">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
              <div>
                <p className="font-semibold">Atención</p>
                <p>{globalError}</p>
              </div>
            </div>
          )}

          {!isSuccess ? (
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                Guardaremos tu solicitud y prepararemos el mensaje para continuar por WhatsApp.
              </p>

              {/* Campo Honeypot invisible */}
              <input
                type="text"
                name="hp_field"
                value={formData.hp_field}
                onChange={(e) => setFormData({ ...formData, hp_field: e.target.value })}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              {/* Nombre completo */}
              <div>
                <label
                  htmlFor="mat-name"
                  className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1"
                >
                  {labels.name || "Nombre Completo"} <span className="text-red-500">*</span>
                </label>
                <input
                  id="mat-name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={placeholders.name || "Tu nombre y apellido"}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 ${
                    fieldErrors.name
                      ? "border-red-400 ring-red-100"
                      : "border-gray-200 dark:border-gray-700 focus:border-larioja-azul focus:ring-blue-100"
                  }`}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.name}</p>
                )}
              </div>

              {/* Correo y Teléfono en dos columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="mat-email"
                    className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {labels.email || "Correo Electrónico"} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="mat-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder={placeholders.email || "ejemplo@correo.com"}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 ${
                      fieldErrors.email
                        ? "border-red-400 ring-red-100"
                        : "border-gray-200 dark:border-gray-700 focus:border-larioja-azul focus:ring-blue-100"
                    }`}
                  />
                  {fieldErrors.email && (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.email}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="mat-phone"
                    className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1"
                  >
                    {labels.phone || "Teléfono (opcional)"}
                  </label>
                  <input
                    id="mat-phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder={placeholders.phone || "7000-0000"}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 ${
                      fieldErrors.phone
                        ? "border-red-400 ring-red-100"
                        : "border-gray-200 dark:border-gray-700 focus:border-larioja-azul focus:ring-blue-100"
                    }`}
                  />
                  {fieldErrors.phone ? (
                    <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.phone}</p>
                  ) : (
                    helpTexts.phone && (
                      <p className="mt-1 text-[11px] text-gray-400">{helpTexts.phone}</p>
                    )
                  )}
                </div>
              </div>

              {/* Tipo de Consulta */}
              <div>
                <label
                  htmlFor="mat-type"
                  className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1"
                >
                  {labels.type || "Tipo de Consulta"} <span className="text-red-500">*</span>
                </label>
                <select
                  id="mat-type"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3.5 py-2.5 text-sm focus:border-larioja-azul focus:outline-none focus:ring-2 focus:ring-blue-100"
                >
                  {inquiryOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              {/* Mensaje */}
              <div>
                <label
                  htmlFor="mat-message"
                  className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1"
                >
                  {labels.message || "Mensaje"} <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="mat-message"
                  required
                  rows={3}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={placeholders.message || "Escribe tus dudas sobre requisitos, edad o proceso..."}
                  className={`w-full rounded-xl border px-3.5 py-2.5 text-sm transition-all bg-white dark:bg-gray-950 focus:outline-none focus:ring-2 ${
                    fieldErrors.message
                      ? "border-red-400 ring-red-100"
                      : "border-gray-200 dark:border-gray-700 focus:border-larioja-azul focus:ring-blue-100"
                  }`}
                />
                {fieldErrors.message && (
                  <p className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.message}</p>
                )}
              </div>

              {/* Aviso de privacidad */}
              <div className="pt-1 text-xs text-gray-500">
                Al continuar, aceptas nuestra{" "}
                <Link
                  href="/privacidad"
                  target="_blank"
                  className="font-medium text-larioja-azul hover:underline dark:text-blue-400"
                >
                  Política de Privacidad
                </Link>
                . Tus datos se utilizarán exclusivamente para atender tu consulta de admisión.
              </div>

              {/* Botón de Enviar */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full min-h-[46px] items-center justify-center gap-2 rounded-xl bg-larioja-azul px-6 py-3 font-montserrat text-sm font-bold text-white shadow-md transition-all hover:bg-larioja-azul-profundo active:scale-[0.99] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul"
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Guardando solicitud...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>{submitLabel}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Vista de confirmación con botón Abrir WhatsApp */
            <div className="text-center py-4 space-y-6 animate-scale-in">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <CheckCircle2 size={36} />
              </div>

              <div className="space-y-2">
                <h3 className="font-montserrat text-xl font-bold text-gray-900 dark:text-white">
                  {successTitle}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-md mx-auto leading-relaxed">
                  {successDesc}
                </p>
              </div>

              <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-4 text-left border border-gray-100 dark:border-gray-800 text-xs space-y-1.5 text-gray-600 dark:text-gray-300">
                <p>
                  <strong className="text-gray-900 dark:text-white">Solicitante:</strong> {formData.name}
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">Consulta:</strong> {formData.type}
                </p>
                <p>
                  <strong className="text-gray-900 dark:text-white">WhatsApp La Rioja:</strong>{" "}
                  {whatsappConfig?.display_phone || "7731-0792"}
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <a
                  href={waUrl}
                  onClick={handleOpenWhatsApp}
                  className="flex-1 flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-montserrat text-sm font-bold text-white shadow-md transition-all hover:bg-emerald-700 active:scale-[0.99] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                >
                  <WhatsAppIcon className="h-5 w-5 fill-current" />
                  <span>{waLinkLabel}</span>
                  <ArrowUpRight size={16} />
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[48px] rounded-xl border border-gray-200 px-5 py-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cerrar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
