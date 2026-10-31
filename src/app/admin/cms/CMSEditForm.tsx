"use client";

import React, { useState, useRef } from "react";
import { Card, Title, Text, TextInput, Switch, Button, Flex, Callout } from "@tremor/react";
import {
  Save,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Upload,
  X as XIcon,
  ImageIcon,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { callActionForm } from "@/lib/action-client";
import { compressImage } from "@/lib/compress-image";
import { useRouter, useSearchParams } from "next/navigation";
import { getErrorMessage, formatFriendlyError } from "@/lib/utils";
import { MatriculaFieldsEditor } from "@/components/admin/cms/MatriculaFieldsEditor";
import { AdmissionFieldsEditor } from "@/components/admin/cms/AdmissionFieldsEditor";
import { InstalacionesFieldsEditor } from "@/components/admin/cms/InstalacionesFieldsEditor";
import dynamic from "next/dynamic";

const SiteGalleryManager = dynamic(
  () =>
    import("@/components/admin/cms/SiteGalleryManager").then(
      (mod) => mod.SiteGalleryManager,
    ),
  {
    ssr: false,
    loading: () => (
      <p className="text-xs text-gray-500 py-4">Cargando gestor de galería…</p>
    ),
  },
);
import type { SiteContent } from "@/types/cms";

/**
 * Edit form for CMS content sections.
 * @param {Object} props - Component props.
 * @param {SiteContent} props.item - The content item to edit.
 * @returns {JSX.Element} The edit form.
 */
export default function CMSEditForm({ item }: { item: SiteContent }) {
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    is_active: boolean;
    content_order: number;
    metadata: Record<string, unknown>;
    image_url: string;
  }>({
    title: item.title || "",
    description: item.description || "",
    is_active: Boolean(item.is_active),
    content_order: item.content_order || 0,
    metadata: (item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata) ? item.metadata : {}) as Record<string, unknown>,
    image_url: item.image_url || "",
  });
  const [jsonString, setJsonString] = useState(JSON.stringify(item.metadata || {}, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(item.image_url || null);
  const [clearImage, setClearImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Update preview when manual URL changes
  const handleUrlChange = (url: string) => {
    setFormData({ ...formData, image_url: url });
    if (!selectedFile) {
      setPreviewUrl(url || item.image_url || null);
    }
  };

  // Obtener filtros de la URL para regresar al mismo estado
  const pageFilter = searchParams.get("page") || "all";
  const searchFilter = searchParams.get("search") || "";
  const statusFilter = searchParams.get("status") || "all";
  const backUrl = `/admin/cms?page=${pageFilter}&search=${searchFilter}&status=${statusFilter}`;

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
      // Validar tamaño de archivo en el cliente (límite de Vercel/Next.js es ~4.5MB)
      if (selectedFile && selectedFile.size > 4 * 1024 * 1024) {
        throw new Error(
          `El archivo es demasiado grande (${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB). El límite máximo permitido es 4MB. Por favor use la "URL Directa" para archivos más grandes o comprima el video.`,
        );
      }

      const submitData = new FormData();
      submitData.append("title", formData.title);
      submitData.append("description", formData.description);
      submitData.append("is_active", String(formData.is_active));
      submitData.append("content_order", String(formData.content_order));
      submitData.append("metadata", JSON.stringify(formData.metadata));
      submitData.append("old_image_url", item.image_url || "");
      submitData.append("image_url", formData.image_url);
      submitData.append("section_key", item.section_key);
      if (item.updated_at) {
        submitData.append("expected_updated_at", item.updated_at);
      }

      if (clearImage) {
        submitData.append("clear_image", "true");
      }

      if (selectedFile) {
        submitData.append("file", selectedFile);
      }

      const result = await callActionForm<{ success?: boolean; error?: string }>(
        "cms.updateCMSContent",
        submitData,
        [item.id],
      );

      if (result.success) {
        setStatus({
          type: "success",
          message: "Contenido actualizado correctamente.",
        });
        setTimeout(() => router.push(backUrl), 1500);
      } else {
        setStatus({
          type: "error",
          message: formatFriendlyError(result.error) || "Error al actualizar.",
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Submit error:", error);
      setStatus({
        type: "error",
        message: formatFriendlyError(error) || "Error de red o de servidor. Intente nuevamente.",
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
    } catch (e) {
      setJsonError(getErrorMessage(e));
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const compressed = await compressImage(file);
      setSelectedFile(compressed);
      const url = URL.createObjectURL(compressed);
      setPreviewUrl(url);
      setClearImage(false);
    }
  };

  const handleClearImage = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setClearImage(true);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFormData({ ...formData, image_url: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCancelClear = (e: React.MouseEvent) => {
    e.preventDefault();
    setClearImage(false);
    setPreviewUrl(item.image_url || null);
    setFormData({ ...formData, image_url: item.image_url || "" });
  };

  const triggerFileInput = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const isVideo = (url: string | null) => {
    if (!url) return false;
    const lower = url.toLowerCase();
    return (
      lower.endsWith(".mp4") ||
      lower.endsWith(".webm") ||
      lower.endsWith(".ogg") ||
      lower.endsWith(".mov") ||
      lower.endsWith(".m4v") ||
      lower.includes("/video")
    );
  };

  const getYouTubeEmbed = (url: string | null) => {
    if (!url) return null;
    const match = url.match(
      /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/,
    );
    return match ? `https://www.youtube-nocookie.com/embed/${match[1]}` : null;
  };

  const getVimeoEmbed = (url: string | null) => {
    if (!url) return null;
    const match = url.match(
      /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|video\/|)(\d+)/,
    );
    const id = match ? match[3] || match[2] : null;
    return id ? `https://player.vimeo.com/video/${id}` : null;
  };

  const removeFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl(item.image_url || null);
    setClearImage(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const ytEmbedUrl = getYouTubeEmbed(previewUrl);
  const vimeoEmbedUrl = getVimeoEmbed(previewUrl);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link
        href={backUrl}
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
              Página: <span className="uppercase font-bold">{item.page}</span> | Clave:{" "}
              <span className="font-mono">{item.section_key}</span>
            </Text>
          </div>
          <Badge color="gray">ID: {item.id.slice(0, 8)}...</Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
            <TextInput
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
              {previewUrl ? (
                <div className="relative w-full aspect-square max-h-[400px] overflow-hidden rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                  {ytEmbedUrl ? (
                    <iframe
                      src={ytEmbedUrl}
                      title="Vista previa YouTube"
                      className="w-full h-full border-0 rounded-2xl"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : vimeoEmbedUrl ? (
                    <iframe
                      src={vimeoEmbedUrl}
                      title="Vista previa Vimeo"
                      className="w-full h-full border-0 rounded-2xl"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  ) : isVideo(previewUrl) ? (
                    <video
                      key={previewUrl}
                      controls
                      playsInline
                      preload="metadata"
                      crossOrigin="anonymous"
                      className="w-full h-full object-contain"
                    >
                      <source src={previewUrl} type="video/mp4" />
                      Tu navegador no soporta la reproducción de videos.
                    </video>
                  ) : (
                    <img
                      src={previewUrl}
                      alt="Vista previa"
                      className="w-full h-full object-contain"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="cursor-pointer bg-white text-black p-3 rounded-full hover:bg-gray-100 transition-colors shadow-xl scale-90 group-hover:scale-100 transition-transform"
                      title="Reemplazar foto"
                    >
                      <Upload size={20} />
                    </button>
                    {selectedFile ? (
                      <button
                        type="button"
                        onClick={removeFile}
                        className="bg-rose-500 text-white p-3 rounded-full hover:bg-rose-600 transition-colors shadow-xl scale-90 group-hover:scale-100 transition-transform"
                        title="Cancelar selección"
                      >
                        <XIcon size={20} />
                      </button>
                    ) : item.image_url ? (
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="bg-rose-600 text-white p-3 rounded-full hover:bg-rose-700 transition-colors shadow-xl scale-90 group-hover:scale-100 transition-transform"
                        title="Eliminar foto"
                      >
                        <Trash2 size={20} />
                      </button>
                    ) : null}
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
            {clearImage && item.image_url && (
              <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-medium">
                  <AlertCircle size={14} />
                  <span>La foto actual se eliminará al guardar.</span>
                </div>
                <button
                  type="button"
                  onClick={handleCancelClear}
                  className="text-xs font-semibold text-rose-600 dark:text-rose-400 underline underline-offset-2 hover:text-rose-800"
                >
                  Deshacer
                </button>
              </div>
            )}

            <div className="space-y-1">
              <Text className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">
                URL Directa (Opcional)
              </Text>
              <TextInput
                placeholder="https://ejemplo.com/archivo.mp4 o enlace de YouTube/Vimeo"
                value={formData.image_url}
                onChange={(e) => handleUrlChange(e.target.value)}
              />
              <Text className="text-[10px] text-gray-400 italic">
                Usa esto para archivos en Supabase, enlaces directos de video/imagen, o videos de YouTube y Vimeo.
              </Text>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Descripción / Contenido
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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

          {item.section_key === "cl_admision" && (
            <div className="space-y-4">
              <AdmissionFieldsEditor
                metadata={formData.metadata}
                onChange={(updatedMeta) => {
                  setFormData({ ...formData, metadata: updatedMeta });
                  setJsonString(JSON.stringify(updatedMeta, null, 2));
                }}
              />
              <div className="flex justify-end">
                <Link
                  href="/programs#admision"
                  target="_blank"
                  className="text-xs text-larioja-azul hover:underline dark:text-larioja-amarillo font-semibold inline-flex items-center gap-1"
                >
                  Abrir vista previa de /programs#admision ↗
                </Link>
              </div>
            </div>
          )}

          {(item.page === "quienes somos" || item.page === "about") && item.section_key === "cl_instalaciones" && (
            <div className="space-y-6">
              <InstalacionesFieldsEditor
                metadata={formData.metadata}
                onChange={(updatedMeta) => {
                  setFormData({ ...formData, metadata: updatedMeta });
                  setJsonString(JSON.stringify(updatedMeta, null, 2));
                }}
              />
              <SiteGalleryManager
                page={item.page}
                galleryKey={item.section_key}
              />
              <div className="flex justify-end">
                <Link
                  href="/about#instalaciones"
                  target="_blank"
                  className="text-xs text-larioja-azul hover:underline dark:text-larioja-amarillo font-semibold inline-flex items-center gap-1"
                >
                  Abrir vista previa de /about#instalaciones ↗
                </Link>
              </div>
            </div>
          )}

          {item.page === "matricula" && (
            <div className="space-y-4">
              <MatriculaFieldsEditor
                sectionKey={item.section_key}
                metadata={formData.metadata}
                onChange={(updatedMeta) => {
                  setFormData({ ...formData, metadata: updatedMeta });
                  setJsonString(JSON.stringify(updatedMeta, null, 2));
                }}
                isActive={Boolean(formData.is_active)}
                onToggleActive={(active) => setFormData({ ...formData, is_active: active })}
              />
              <div className="flex justify-end">
                <Link
                  href="/matricula"
                  target="_blank"
                  className="text-xs text-larioja-azul hover:underline dark:text-larioja-amarillo font-semibold inline-flex items-center gap-1"
                >
                  Abrir vista previa de /matricula ↗
                </Link>
              </div>
            </div>
          )}

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
              <Text className="text-xs text-rose-500 italic mt-1">Error: {jsonError}</Text>
            )}
            <Text className="text-[10px] text-gray-400">
              Usa este campo para configuraciones extra como links de botones, colores
              personalizados, etc.
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
                  checked={formData.is_active ?? false}
                  onChange={(checked) => setFormData({ ...formData, is_active: checked })}
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
            <Link href={backUrl}>
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
function Badge({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className={`px-2 py-1 rounded text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 uppercase`}
    >
      {children}
    </span>
  );
}
