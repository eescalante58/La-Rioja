"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  TextInput,
  Button,
  Select,
  SelectItem,
  Switch,
} from "@tremor/react";
import { X as XIcon, Save } from "lucide-react";
import { createFAQ, updateFAQ } from "@/app/admin/cms/actions";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  section_id: string | null;
  is_active: boolean;
  content_order: number;
}

interface FAQSection {
  id: string;
  title: string;
}

interface FAQModalProps {
  isOpen: boolean;
  onClose: () => void;
  faq: FAQ | null;
  sections: FAQSection[];
  totalFaqs: number;
}

export default function FAQModal({
  isOpen,
  onClose,
  faq,
  sections,
  totalFaqs,
}: FAQModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    section_id: "",
    is_active: true,
    content_order: 0,
  });

  useEffect(() => {
    if (faq) {
      setFormData({
        question: faq.question,
        answer: faq.answer,
        section_id: faq.section_id || "",
        is_active: faq.is_active,
        content_order: faq.content_order,
      });
    } else {
      setFormData({
        question: "",
        answer: "",
        section_id: sections[0]?.id || "",
        is_active: true,
        content_order: totalFaqs,
      });
    }
  }, [faq, sections, totalFaqs]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const submitData = new FormData();
      submitData.append("question", formData.question);
      submitData.append("answer", formData.answer);
      submitData.append("section_id", formData.section_id);
      submitData.append("is_active", String(formData.is_active));
      submitData.append("content_order", String(formData.content_order));

      let result;
      if (faq) {
        result = await updateFAQ(faq.id, submitData);
      } else {
        result = await createFAQ(submitData);
      }

      if (result.success) {
        window.location.reload();
      } else {
        alert("Error al guardar FAQ: " + result.error);
      }
    } catch (error) {
      alert("Error inesperado al guardar FAQ.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-black/50 sm:backdrop-blur-sm z-[100]" />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
        <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-950 p-4 sm:p-6 rounded-2xl sm:shadow-xl border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <Title>{faq ? "Editar Pregunta" : "Nueva Pregunta"}</Title>
            <Button variant="light" icon={XIcon} onClick={onClose} />
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Sección</Text>
              <Select
                value={formData.section_id}
                onValueChange={(val) => setFormData({ ...formData, section_id: val })}
                required
              >
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Pregunta</Text>
              <TextInput
                placeholder="Ej: ¿Cómo participo en el bingo?"
                value={formData.question}
                onValueChange={(val) => setFormData({ ...formData, question: val })}
                required
              />
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Respuesta</Text>
              <textarea
                className="w-full min-h-[150px] p-3 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                required
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <Switch
                  checked={formData.is_active}
                  onChange={(val) => setFormData({ ...formData, is_active: val })}
                />
                <Text className="text-sm font-bold">Estado Activo</Text>
              </div>
              <div className="flex items-center gap-3">
                <Text className="text-xs font-bold uppercase text-gray-500">Orden:</Text>
                <TextInput
                  type="number"
                  className="w-20"
                  value={String(formData.content_order)}
                  onValueChange={(val) => setFormData({ ...formData, content_order: parseInt(val) || 0 })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={onClose} disabled={isSaving}>Cancelar</Button>
              <Button icon={Save} color="blue" loading={isSaving} type="submit">
                {faq ? "Actualizar" : "Crear"} Pregunta
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
