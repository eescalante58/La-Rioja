"use client";

import React, { useState } from "react";
import { X, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { submitContactForm } from "@/app/actions/contact";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetEmail: string;
}

export function ContactModal({
  isOpen,
  onClose,
  targetEmail,
}: ContactModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: "Consulta General",
    message: "",
  });

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await submitContactForm({
        ...formData,
        targetEmail,
      });

      if (result.success) {
        setIsSuccess(true);
        // Reset and close after a delay
        setTimeout(() => {
          setIsSuccess(false);
          setFormData({
            name: "",
            email: "",
            phone: "",
            type: "Consulta General",
            message: "",
          });
          onClose();
        }, 2500);
      } else {
        setError(result.error || "Ocurrió un error al enviar el mensaje.");
      }
    } catch (err) {
      setError("Error de conexión. Por favor intente de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-[#f8f9fa] w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-larioja-azul">
            Formulario de Contacto
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500"
          >
            <X size={24} />
          </button>
        </div>

        {isSuccess ? (
          <div className="p-12 text-center flex flex-col items-center gap-4 animate-fade-in">
            <CheckCircle2 size={64} className="text-larioja-verde" />
            <h3 className="text-xl font-bold text-larioja-azul">
              ¡Mensaje Enviado!
            </h3>
            <p className="text-gray-600">
              Gracias por contactarnos. Te responderemos pronto a tu correo.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-8 pt-4 space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 text-sm animate-fade-in">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Nombre Completo */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 block">
                Nombre Completo <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Tu nombre"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-larioja-azul focus:ring-2 focus:ring-larioja-azul/20 transition-all outline-none bg-white text-gray-900"
              />
            </div>

            {/* Correo Electrónico */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 block">
                Correo Electrónico <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@correo.com"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-larioja-azul focus:ring-2 focus:ring-larioja-azul/20 transition-all outline-none bg-white text-gray-900"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 block">
                Teléfono (Opcional)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="7858-0322"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-larioja-azul focus:ring-2 focus:ring-larioja-azul/20 transition-all outline-none bg-white text-gray-900"
              />
            </div>

            {/* Tipo de Consulta */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 block">
                Tipo de Consulta
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-larioja-azul focus:ring-2 focus:ring-larioja-azul/20 transition-all outline-none bg-white text-gray-900 appearance-none cursor-pointer"
              >
                <option>Consulta General</option>
                <option>Información de Cursos</option>
                <option>Soporte de Bingo</option>
                <option>Donaciones</option>
              </select>
            </div>

            {/* Mensaje */}
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-gray-700 block">
                Mensaje <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                name="message"
                rows={4}
                value={formData.message}
                onChange={handleChange}
                placeholder="Cuéntanos cómo podemos ayudarte..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-larioja-azul focus:ring-2 focus:ring-larioja-azul/20 transition-all outline-none bg-white text-gray-900 resize-none"
              ></textarea>
            </div>

            {/* Botón de envío */}
            <button
              disabled={isSubmitting}
              type="submit"
              className="w-full bg-larioja-azul hover:bg-larioja-azul/90 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-larioja-azul/20 flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isSubmitting ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send size={18} />
                  Enviar Mensaje
                </>
              )}
            </button>

            <p className="text-[10px] text-gray-400 text-center uppercase tracking-wider">
              Los campos marcados con * son obligatorios.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
