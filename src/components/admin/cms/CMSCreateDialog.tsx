"use client";

import React, { useState, useRef } from "react";
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
  Callout,
} from "@tremor/react";
import { X as XIcon, Save, ImageIcon, AlertCircle, CheckCircle } from "lucide-react";
import { createCMSContent } from "@/app/admin/cms/actions";

interface CMSCreateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  CMS_PAGES: readonly { value: string; label: string }[];
}

export default function CMSCreateDialog({ isOpen, onClose, CMS_PAGES }: CMSCreateDialogProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [newFormData, setNewFormData] = useState({
    page: "home" as any,
    section_key: "",
    title: "",
    description: "",
    is_active: true,
    content_order: 0,
    metadata: {},
  });
  const [newJsonString, setNewJsonString] = useState("{}");
  const [newJsonError, setNewJsonError] = useState<string | null>(null);
  const [newSelectedFile, setNewSelectedFile] = useState<File | null>(null);
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  const handleJsonChange = (val: string) => {
    setNewJsonString(val);
    try {
      if (val.trim() === "") {
        setNewFormData({ ...newFormData, metadata: {} });
        setNewJsonError(null);
        return;
      }
      const parsed = JSON.parse(val);
      setNewFormData({ ...newFormData, metadata: parsed });
      setNewJsonError(null);
    } catch (e: any) {
      setNewJsonError(e.message);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newJsonError) {
      setCreateStatus({ type: "error", message: "Por favor corrija el error en los metadatos JSON." });
      return;
    }
    setIsCreating(true);
    setCreateStatus(null);
    try {
      const submitData = new FormData();
      submitData.append("page", newFormData.page);
      submitData.append("section_key", newFormData.section_key);
      submitData.append("title", newFormData.title);
      submitData.append("description", newFormData.description);
      submitData.append("is_active", String(newFormData.is_active));
      submitData.append("content_order", String(newFormData.content_order));
      submitData.append("metadata", JSON.stringify(newFormData.metadata));
      if (newSelectedFile) submitData.append("file", newSelectedFile);

      const result = await createCMSContent(submitData);
      if (result.success) {
        setCreateStatus({ type: "success", message: "Sección creada correctamente." });
        setTimeout(() => {
          onClose();
          setCreateStatus(null);
          setNewFormData({ page: "home", section_key: "", title: "", description: "", is_active: true, content_order: 0, metadata: {} });
          setNewJsonString("{}");
          setNewSelectedFile(null);
          setNewPreviewUrl(null);
        }, 1500);
      } else {
        setCreateStatus({ type: "error", message: result.error || "Error al crear." });
      }
    } catch (error) {
      setCreateStatus({ type: "error", message: "Error inesperado al crear." });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-black/50 sm:backdrop-blur-sm z-[100]" />
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
        <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-950 p-4 sm:p-6 rounded-2xl sm:shadow-xl border border-gray-200 dark:border-gray-800 max-h-[90vh] overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <Title>Nueva Sección de Contenido</Title>
            <Button variant="light" icon={XIcon} onClick={onClose} />
          </div>
          <form onSubmit={handleCreate} className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
            {createStatus && (
              <Callout title={createStatus.type === "success" ? "Éxito" : "Error"} color={createStatus.type === "success" ? "emerald" : "rose"} icon={createStatus.type === "success" ? CheckCircle : AlertCircle}>
                {createStatus.message}
              </Callout>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Página Target</Text>
                <Select value={newFormData.page} onValueChange={(val) => setNewFormData({ ...newFormData, page: val })}>
                  {CMS_PAGES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                </Select>
              </div>
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">Identificador (Key)</Text>
                <TextInput placeholder="Ej: hero_section" value={newFormData.section_key} onValueChange={(val) => setNewFormData({ ...newFormData, section_key: val })} required />
              </div>
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Título</Text>
              <TextInput placeholder="Título de la sección" value={newFormData.title} onValueChange={(val) => setNewFormData({ ...newFormData, title: val })} />
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Descripción / Contenido</Text>
              <textarea className="w-full min-h-[100px] p-3 text-sm rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={newFormData.description} onChange={(e) => setNewFormData({ ...newFormData, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Text className="text-xs font-bold uppercase text-gray-500">Imagen de Sección</Text>
              <div className="flex items-center gap-4">
                <button type="button" onClick={() => newFileInputRef.current?.click()} className="flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors">
                  <ImageIcon size={16} /> {newPreviewUrl ? "Cambiar Imagen" : "Subir Imagen"}
                </button>
                {newPreviewUrl && <button type="button" onClick={() => { setNewSelectedFile(null); setNewPreviewUrl(null); }} className="text-rose-500 text-xs font-bold hover:underline">Eliminar</button>}
              </div>
              <input type="file" ref={newFileInputRef} className="hidden" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setNewSelectedFile(f); setNewPreviewUrl(URL.createObjectURL(f)); } }} />
              {newPreviewUrl && <div className="mt-2 relative aspect-video w-48 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800"><img src={newPreviewUrl} className="w-full h-full object-cover" alt="Preview" /></div>}
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">Metadata Adicional (JSON)</Text>
              <textarea className={`w-full min-h-[100px] p-3 font-mono text-xs rounded-xl border ${newJsonError ? "border-rose-500" : "border-gray-200 dark:border-gray-800"} bg-white dark:bg-gray-900 outline-none`} value={newJsonString} onChange={(e) => handleJsonChange(e.target.value)} />
              {newJsonError && <Text className="text-xs text-rose-500 mt-1">{newJsonError}</Text>}
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-3">
                <Switch checked={newFormData.is_active} onChange={(val) => setNewFormData({ ...newFormData, is_active: val })} />
                <Text className="text-sm font-bold">Estado Activo</Text>
              </div>
              <div className="flex items-center gap-3">
                <Text className="text-xs font-bold uppercase text-gray-500">Orden:</Text>
                <TextInput type="number" className="w-20" value={String(newFormData.content_order)} onValueChange={(val) => setNewFormData({ ...newFormData, content_order: parseInt(val) || 0 })} />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 sticky bottom-0 bg-white dark:bg-gray-950 py-4 border-t border-gray-100 dark:border-gray-800">
              <Button variant="secondary" onClick={onClose} disabled={isCreating}>Cancelar</Button>
              <Button icon={Save} color="emerald" loading={isCreating} type="submit">Crear Sección</Button>
            </div>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
