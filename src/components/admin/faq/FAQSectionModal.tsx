"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  TextInput,
  Button,
  Switch,
} from "@tremor/react";
import { X as XIcon, Save } from "lucide-react";
import { createFAQSection, updateFAQSection } from "@/app/admin/cms/actions";

interface FAQSection {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  content_order: number;
}

interface FAQSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  section: FAQSection | null;
  totalSections: number;
}

export default function FAQSectionModal({
  isOpen,
  onClose,
  section,
  totalSections,
}: FAQSectionModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    is_active: true,
    content_order: 0,
  });

  useEffect(() => {
    if (section) {
      setFormData({
        title: section.title,
        description: section.description || "",
        is_active: section.is_active,
        content_order: section.content_order,
      });
    } else {
      setFormData({
        title: "",
        description: "",
        is_active: true,
        content_order: totalSections,
      });
    }
  }, [section, totalSections]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("is_active", String(formData.is_active));
      submitData.append("content_order", String(formData.content_order));

      let result;
      if (section) {
        result = await updateFAQSection(section.id, submitData);
      } else {
        result = await createFAQSection(submitData);
      }

      if (result.success) {
        window.location.reload();
      } else {
        alert("Error al guardar sección: " + result.error);
      }
    } catch (error) {
      alert("Error inesperado al guardar sección.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-black/50 sm:backdrop-blur-sm z-[100]" />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
        <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-950 p-4 sm:p-6 rounded-2xl sm:shadow-xl border border-gray-200 dark:border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <Title>{section ? "Editar Sección" : "Nueva Sección"}</Title>
            <Button variant="light" icon={XIcon} onClick={onClose} />
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Título</Text>
              <TextInput
                placeholder="Ej: General, Premios, etc."
                value={formData.title}
                onValueChange={(val) => setFormData({ ...formData, title: val })}
                required
              />
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Descripción (Opcional)</Text>
              <TextInput
                placeholder="Breve descripción de la sección"
                value={formData.description}
                onValueChange={(val) => setFormData({ ...formData, description: val })}
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
                {section ? "Actualizar" : "Crear"} Sección
              </Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
