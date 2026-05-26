"use client";

import React, { useState, useRef } from "react";
import {
  Card,
  Title,
  Text,
  TextInput,
  Switch,
  Button,
  Flex,
  Callout,
} from "@tremor/react";
import {
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Upload,
  X as XIcon,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";
import { updateCMSContent } from "./actions";
import { useRouter } from "next/navigation";

/**
 * Edit form for CMS content sections.
 * @param {Object} props - Component props.
 * @param {any} props.item - The content item to edit.
 * @returns {JSX.Element} The edit form.
 */
export default function CMSEditForm({ item }: { item: any }) {
  const [formData, setFormData] = useState({
    title: item.title || "",
    description: item.description || "",
    is_active: item.is_active,
    content_order: item.content_order || 0,
    metadata: item.metadata || {},
  });
  const [jsonString, setJsonString] = useState(
    JSON.stringify(item.metadata || {}, null, 2),
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    item.image_url || null,
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (jsonError) {
      setStatus({
        type: "error",
        message: "Por favor corrija el error en los metadatos JSON.",
      });
      return;
    }

    setLoading(true);
    setStatus(null);

    try {
      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("is_active", String(formData.is_active));
      submitData.append("content_order", String(formData.content_order));
      submitData.append("metadata", JSON.stringify(formData.metadata));
      submitData.append("old_image_url", item.image_url || "");
      submitData.append("section_key", item.section_key);

      if (selectedFile) {
        submitData.append("file", selectedFile);
      }

      const result = await updateCMSContent(item.id, submitData);

      if (result.success) {
        setStatus({
          type: "success",
          message: "Contenido actualizado correctamente.",
        });
        setTimeout(() => router.push("/admin/cms"), 1500);
      } else {
        setStatus({
          type: "error",
          message: result.error || "Error al actualizar.",
        });
        setLoading(false);
      }
    } catch (error: any) {
      console.error("Submit error:", error);
      setStatus({
        type: "error",
        message: "Error de red o de servidor. Intente nuevamente.",
      });
      setLoading(false);
    }
  };

  const handleJsonChange = (val: string) => {
    setJsonString(val);
    try {
      if (val.trim() === "") {
        setFormData({ ...formData, metadata: {} });
        setJsonError(null);
        return;
      }
      const parsed = JSON.parse(val);
      setFormData({ ...formData, metadata: parsed });
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const triggerFileInput = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const removeFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl(item.image_url || null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href="/admin/cms"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
      >
        <ArrowLeft size={16} />
        Volver al listado
      </Link>

      <Card>
        <div className="flex justify-between items-start mb-8">
          <div>
            <Title className="dark:text-white">Editar Sección</Title>
            <Text className="dark:text-gray-400">
              Página: <span className="uppercase font-bold">{item.page}</span> |
              Clave: <span className="font-mono">{item.section_key}</span>
            </Text>
          </div>
          <Badge color="gray">ID: {item.id.slice(0, 8)}...</Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Título
            </label>
            <TextInput
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="Ingrese el título de la sección"
            />
          </div>

          {/* Upload de Imagen - Estilo Instagram */}
          <div className="space-y-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Imagen de la Sección
            </label>
            <div className="relative group">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              {previewUrl ? (
                <div className="relative w-full aspect-square max-h-[400px] overflow-hidden rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Vista previa"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="cursor-pointer bg-white text-black p-3 rounded-full hover:bg-gray-100 transition-colors shadow-xl scale-90 group-hover:scale-100 transition-transform"
                    >
                      <Upload size={20} />
                    </button>
                    {selectedFile && (
                      <button
                        type="button"
                        onClick={removeFile}
                        className="bg-rose-500 text-white p-3 rounded-full hover:bg-rose-600 transition-colors shadow-xl scale-90 group-hover:scale-100 transition-transform"
                      >
                        <XIcon size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  onClick={triggerFileInput}
                  className="flex flex-col items-center justify-center w-full aspect-square max-h-[300px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all cursor-pointer group"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-4 group-hover:scale-105 transition-transform">
                      <ImageIcon size={32} className="text-blue-500" />
                    </div>
                    <p className="mb-2 text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold text-blue-600 dark:text-blue-400">
                        Haz clic para subir
                      </span>{" "}
                      o arrastra una imagen
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      PNG, JPG o WEBP (Recomendado 1080x1080)
                    </p>
                  </div>
                </div>
              )}
            </div>
            {selectedFile && (
              <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium">
                <CheckCircle size={14} />
                <span>Nueva imagen seleccionada: {selectedFile.name}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción / Contenido
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Ingrese la descripción o contenido principal"
              rows={12}
              className="w-full p-4 text-base bg-white dark:bg-gray-950 border-2 border-gray-200 dark:border-gray-800 rounded-xl focus:ring-4 focus:ring-larioja-azul/20 focus:border-larioja-azul dark:focus:border-larioja-amarillo outline-none transition-all resize-y dark:text-gray-100 min-h-[300px] leading-normal"
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                overflowWrap: "break-word",
              }}
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Metadatos Adicionales (JSON)
            </label>
            <div className="relative">
              <textarea
                value={jsonString}
                onChange={(e) => handleJsonChange(e.target.value)}
                placeholder='{ "key": "value" }'
                rows={8}
                className={`w-full p-4 font-mono text-xs bg-slate-900 text-emerald-400 border-2 rounded-xl focus:ring-4 outline-none transition-all resize-y ${
                  jsonError
                    ? "border-rose-500 focus:ring-rose-500/20"
                    : "border-slate-800 focus:ring-emerald-500/20 focus:border-emerald-500"
                }`}
                spellCheck={false}
              />
              {jsonError && (
                <div className="absolute bottom-2 right-2 bg-rose-600 text-white text-[10px] px-2 py-1 rounded shadow-lg animate-pulse">
                  JSON Inválido
                </div>
              )}
            </div>
            {jsonError && (
              <Text className="text-xs text-rose-500 italic mt-1">
                Error: {jsonError}
              </Text>
            )}
            <Text className="text-[10px] text-gray-400">
              Usa este campo para configuraciones extra como links de botones,
              colores personalizados, etc.
            </Text>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Orden de contenido
              </label>
              <TextInput
                type="number"
                value={formData.content_order.toString()}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    content_order: parseInt(e.target.value) || 0,
                  })
                }
              />
            </div>
            <div className="flex flex-col justify-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Estado Visible
              </label>
              <Flex justifyContent="start" className="gap-3">
                <Switch
                  checked={formData.is_active}
                  onChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Text>{formData.is_active ? "Activo" : "Inactivo"}</Text>
              </Flex>
            </div>
          </div>

          {status && (
            <Callout
              className="mt-6"
              title={status.type === "success" ? "Éxito" : "Error"}
              icon={status.type === "success" ? CheckCircle : AlertCircle}
              color={status.type === "success" ? "emerald" : "rose"}
            >
              {status.message}
            </Callout>
          )}

          <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
            <Link href="/admin/cms">
              <button
                type="button"
                className="px-6 py-2 bg-[#FFFF00] hover:bg-yellow-400 text-[#012060] rounded-lg shadow-md transition-all font-bold border border-yellow-300"
              >
                Cancelar
              </button>
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-larioja-azul hover:bg-blue-800 text-white rounded-lg shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save size={18} />
              )}
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}

// Separate Badge import because it was missing in the code but I need it
function Badge({
  children,
  color,
}: {
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <span
      className={`px-2 py-1 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase`}
    >
      {children}
    </span>
  );
}
