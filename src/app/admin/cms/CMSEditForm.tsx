"use client";

import { useState } from "react";
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
import { Save, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";
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
  });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const result = await updateCMSContent(item.id, formData);

    if (result.success) {
      setStatus({
        type: "success",
        message: "Contenido actualizado correctamente.",
      });
      setTimeout(() => router.push("/admin/cms"), 2000);
    } else {
      setStatus({
        type: "error",
        message: result.error || "Error al actualizar.",
      });
    }
    setLoading(false);
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

        {status && (
          <Callout
            className="mb-6"
            title={status.type === "success" ? "Éxito" : "Error"}
            icon={status.type === "success" ? CheckCircle : AlertCircle}
            color={status.type === "success" ? "emerald" : "rose"}
          >
            {status.message}
          </Callout>
        )}

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

          <div className="grid grid-cols-2 gap-6">
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
