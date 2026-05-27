"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Text,
  Title,
  Badge,
  Button,
  Dialog,
  DialogPanel,
  TextInput,
  Switch,
  Flex,
  Select,
  SelectItem,
  Callout,
} from "@tremor/react";
import {
  Edit2,
  Eye,
  Plus,
  Trash2,
  X as XIcon,
  Save,
  Upload,
  ImageIcon,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
} from "lucide-react";
import { deleteCMSContent, createCMSContent } from "./actions";

const CMS_PAGES = [
  { value: "home", label: "Home" },
  { value: "about", label: "About" },
  { value: "programs", label: "Programs" },
  { value: "services", label: "Services (Cards)" },
  { value: "contact", label: "Contact" },
  { value: "global", label: "Global" },
  { value: "social media", label: "Social Media" },
  { value: "whatsapp message", label: "WhatsApp Message" },
] as const;

type CMSPage = (typeof CMS_PAGES)[number]["value"];

interface CMSManagerClientProps {
  initialContent: any[];
}

/**
 * Client-side component for CMS Management.
 * @param {CMSManagerClientProps} props - Component props.
 * @returns {JSX.Element} The CMS management interface.
 */
export default function CMSManagerClient({
  initialContent,
}: CMSManagerClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Filtros
  const [pageFilter, setPageFilter] = useState<string>(
    searchParams.get("page") || "all",
  );
  const [searchFilter, setSearchFilter] = useState(
    searchParams.get("search") || "",
  );

  // Actualizar URL cuando cambian los filtros (opcional pero recomendado para persistencia)
  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (pageFilter !== "all") {
      params.set("page", pageFilter);
    } else {
      params.delete("page");
    }

    if (searchFilter) {
      params.set("search", searchFilter);
    } else {
      params.delete("search");
    }

    // Actualizamos la URL sin recargar la página
    const queryString = params.toString();
    router.replace(`/admin/cms${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }, [pageFilter, searchFilter, router, searchParams]);

  // Filtrar el contenido
  const filteredContent = (initialContent || []).filter((item) => {
    const matchesPage = pageFilter === "all" || item.page === pageFilter;
    const matchesSearch =
      searchFilter === "" ||
      (item.section_key || "")
        .toLowerCase()
        .includes(searchFilter.toLowerCase()) ||
      (item.title || "").toLowerCase().includes(searchFilter.toLowerCase()) ||
      (item.description || "")
        .toLowerCase()
        .includes(searchFilter.toLowerCase());

    return matchesPage && matchesSearch;
  });

  // Ordenar el contenido filtrado
  const sortedContent = [...filteredContent].sort((a, b) => {
    const pageCompare = (a.page || "").localeCompare(b.page || "");
    if (pageCompare !== 0) return pageCompare;

    // Priorizar content_order sobre section_key para que el usuario pueda organizar visualmente
    const orderCompare = (a.content_order || 0) - (b.content_order || 0);
    if (orderCompare !== 0) return orderCompare;

    return (a.section_key || "").localeCompare(b.section_key || "");
  });

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para Nueva Sección
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createStatus, setCreateStatus] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [newFormData, setNewFormData] = useState({
    page: "home" as CMSPage,
    section_key: "",
    title: "",
    description: "",
    is_active: true,
    content_order: 0,
    metadata: {},
  });
  const [newJsonString, setNewJsonString] = useState("{}");
  const [newJsonError, setNewJsonError] = useState<string | null>(null);

  // Estados para Imagen en Nueva Sección
  const [newSelectedFile, setNewSelectedFile] = useState<File | null>(null);
  const [newPreviewUrl, setNewPreviewUrl] = useState<string | null>(null);
  const newFileInputRef = useRef<HTMLInputElement>(null);

  const handleView = (item: any) => {
    setSelectedItem(item);
    setIsViewOpen(true);
  };

  const confirmDelete = (item: any) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      const result = await deleteCMSContent(selectedItem.id);
      if (result.success) {
        setIsDeleteOpen(false);
        setSelectedItem(null);
      } else {
        alert("Error al eliminar: " + result.error);
      }
    } catch (error) {
      alert("Error inesperado al eliminar.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleNewJsonChange = (val: string) => {
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

  const handleNewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewSelectedFile(file);
      const url = URL.createObjectURL(file);
      setNewPreviewUrl(url);
    }
  };

  const triggerNewFileInput = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    newFileInputRef.current?.click();
  };

  const removeNewFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setNewSelectedFile(null);
    setNewPreviewUrl(null);
    if (newFileInputRef.current) newFileInputRef.current.value = "";
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newJsonError) {
      setCreateStatus({
        type: "error",
        message: "Por favor corrija el error en los metadatos JSON.",
      });
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

      if (newSelectedFile) {
        submitData.append("file", newSelectedFile);
      }

      const result = await createCMSContent(submitData);
      if (result.success) {
        setCreateStatus({
          type: "success",
          message: "Sección creada correctamente.",
        });
        setTimeout(() => {
          setIsCreateOpen(false);
          setCreateStatus(null);
          setNewFormData({
            page: "home",
            section_key: "",
            title: "",
            description: "",
            is_active: true,
            content_order: 0,
            metadata: {},
          });
          setNewJsonString("{}");
          setNewSelectedFile(null);
          setNewPreviewUrl(null);
        }, 1500);
      } else {
        setCreateStatus({
          type: "error",
          message: result.error || "Error al crear.",
        });
      }
    } catch (error) {
      setCreateStatus({
        type: "error",
        message: "Error inesperado al crear.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div>
          <Title className="text-2xl font-black text-larioja-azul dark:text-white uppercase tracking-tight">
            Gestión de Contenido (CMS)
          </Title>
          <Text className="text-sm mt-1 text-gray-500 dark:text-gray-400">
            Administra el contenido dinámico de la landing page y secciones
            informativas.
          </Text>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-larioja-verde hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95"
        >
          <Plus size={18} />
          Nueva Sección
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Text className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
              <Filter size={14} />
              Filtrar por Página
            </Text>
            <Select value={pageFilter} onValueChange={setPageFilter}>
              <SelectItem value="all">Todas las Páginas</SelectItem>
              {CMS_PAGES.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </Select>
          </div>
          <div className="md:col-span-1 lg:col-span-3 space-y-2">
            <Text className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
              <Search size={14} />
              Buscar Sección, Título o Descripción
            </Text>
            <TextInput
              icon={Search}
              placeholder="Ej: hero, programas, historia..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
          </div>
        </div>
        {(pageFilter !== "all" || searchFilter !== "") && (
          <div className="mt-4 flex justify-between items-center border-t border-gray-50 dark:border-gray-800 pt-4">
            <Text className="text-xs text-gray-500 italic">
              Mostrando {sortedContent.length} de {initialContent.length}{" "}
              resultados
            </Text>
            <Button
              variant="light"
              size="xs"
              color="gray"
              onClick={() => {
                setPageFilter("all");
                setSearchFilter("");
              }}
            >
              Limpiar Filtros
            </Button>
          </div>
        )}
      </div>

      <Card className="p-0 overflow-hidden shadow-md border-gray-200 dark:border-gray-800 transition-all duration-300">
        {/* Barra de desplazamiento superior (Trick: transform rotate) */}
        <div style={{ transform: "rotateX(180deg)", overflowX: "auto" }}>
          <div style={{ transform: "rotateX(180deg)" }}>
            <Table>
              <TableHead className="bg-gray-50 dark:bg-gray-900">
                <TableRow>
                  <TableHeaderCell>Página</TableHeaderCell>
                  <TableHeaderCell>Sección</TableHeaderCell>
                  <TableHeaderCell>Orden</TableHeaderCell>
                  <TableHeaderCell>Metadata (JSON)</TableHeaderCell>
                  <TableHeaderCell>Título / Descripción</TableHeaderCell>
                  <TableHeaderCell>Estado</TableHeaderCell>
                  <TableHeaderCell className="text-right">
                    Acciones
                  </TableHeaderCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sortedContent?.map((item) => (
                  <TableRow
                    key={item.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <TableCell>
                      <Badge color="gray" size="xs" className="uppercase">
                        {item.page}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Text className="font-mono text-xs">
                        {item.section_key}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Badge color="amber" size="xs">
                        {item.content_order}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.metadata &&
                      Object.keys(item.metadata).length > 0 ? (
                        <div className="flex gap-1 flex-wrap max-w-[200px]">
                          {Object.keys(item.metadata).map((key) => (
                            <Badge key={key} size="xs" color="blue">
                              {key}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <Text className="text-xs italic text-gray-400">
                          Ninguno
                        </Text>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-md">
                        <Text className="font-medium truncate">
                          {item.title || "Sin título"}
                        </Text>
                        <Text className="text-xs truncate text-gray-400">
                          {item.description || "Sin descripción"}
                        </Text>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge color={item.is_active ? "emerald" : "rose"}>
                        {item.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="light"
                          icon={Eye}
                          size="xs"
                          color="gray"
                          onClick={() => handleView(item)}
                        />
                        <Link
                          href={`/admin/cms/${item.id}?page=${pageFilter}&search=${searchFilter}`}
                        >
                          <Button
                            variant="light"
                            icon={Edit2}
                            size="xs"
                            color="blue"
                          />
                        </Link>
                        <Button
                          variant="light"
                          icon={Trash2}
                          size="xs"
                          color="rose"
                          onClick={() => confirmDelete(item)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </Card>

      {/* Modal de Vista Detallada */}
      <Dialog
        open={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        static={true}
      >
        <DialogPanel className="max-w-xl">
          <div className="flex justify-between items-center mb-4">
            <Title>Detalle de Contenido</Title>
            <Button
              variant="light"
              icon={XIcon}
              onClick={() => setIsViewOpen(false)}
            />
          </div>
          {selectedItem && (
            <div className="space-y-4">
              <div>
                <Text className="text-[10px] uppercase font-bold text-gray-500">
                  Ubicación
                </Text>
                <div className="flex gap-2 mt-1">
                  <Badge color="gray">{selectedItem.page}</Badge>
                  <Badge color="blue">{selectedItem.section_key}</Badge>
                  <Badge color="amber">
                    Orden: {selectedItem.content_order}
                  </Badge>
                </div>
              </div>
              <div>
                <Text className="text-[10px] uppercase font-bold text-gray-500">
                  Título
                </Text>
                <Text className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedItem.title || "Sin título"}
                </Text>
              </div>
              <div>
                <Text className="text-[10px] uppercase font-bold text-gray-500">
                  Descripción
                </Text>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                  <Text className="whitespace-pre-wrap">
                    {selectedItem.description || "Sin descripción"}
                  </Text>
                </div>
              </div>
              {selectedItem.image_url && (
                <div>
                  <Text className="text-[10px] uppercase font-bold text-gray-500">
                    Imagen / Multimedia
                  </Text>
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.title}
                    className="mt-2 rounded-lg max-h-48 w-full object-cover"
                  />
                  <Text className="text-[10px] mt-1 break-all text-gray-400">
                    {selectedItem.image_url}
                  </Text>
                </div>
              )}
              {selectedItem.metadata &&
                Object.keys(selectedItem.metadata).length > 0 && (
                  <div>
                    <Text className="text-[10px] uppercase font-bold text-gray-500">
                      Metadatos (JSON)
                    </Text>
                    <pre className="mt-1 p-3 bg-slate-900 text-slate-300 rounded-lg text-xs overflow-auto max-h-32">
                      {JSON.stringify(selectedItem.metadata, null, 2)}
                    </pre>
                  </div>
                )}
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Button onClick={() => setIsViewOpen(false)}>Cerrar</Button>
          </div>
        </DialogPanel>
      </Dialog>

      {/* Modal de Confirmación de Eliminación */}
      <Dialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        static={true}
      >
        <DialogPanel className="max-w-sm">
          <Title className="text-rose-600">¿Eliminar esta sección?</Title>
          <Text className="mt-2 text-sm">
            Esta acción no se puede deshacer. Se eliminará el registro{" "}
            <span className="font-bold">{selectedItem?.section_key}</span> de la
            página {selectedItem?.page}.
          </Text>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button color="rose" onClick={handleDelete} loading={isDeleting}>
              Confirmar Eliminación
            </Button>
          </div>
        </DialogPanel>
      </Dialog>

      {/* Modal de Nueva Sección */}
      <Dialog
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        static={true}
      >
        <DialogPanel className="max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <Title>Crear Nueva Sección CMS</Title>
            <Button
              variant="light"
              icon={XIcon}
              onClick={() => setIsCreateOpen(false)}
            />
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">
                  Página
                </Text>
                <Select
                  value={newFormData.page}
                  onValueChange={(val) =>
                    setNewFormData({ ...newFormData, page: val as CMSPage })
                  }
                >
                  {CMS_PAGES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">
                  Clave de Sección (Unica)
                </Text>
                <TextInput
                  value={newFormData.section_key}
                  onChange={(e) =>
                    setNewFormData({
                      ...newFormData,
                      section_key: e.target.value,
                    })
                  }
                  placeholder="ej: hero_main"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">
                Título
              </Text>
              <TextInput
                value={newFormData.title}
                onChange={(e) =>
                  setNewFormData({ ...newFormData, title: e.target.value })
                }
                placeholder="Título de la sección"
              />
            </div>

            {/* Upload de Imagen - Estilo Instagram */}
            <div className="space-y-2">
              <Text className="text-xs font-bold uppercase text-gray-500">
                Imagen de la Sección
              </Text>
              <div className="relative group">
                {newPreviewUrl ? (
                  <div className="relative w-full aspect-square max-h-[300px] overflow-hidden rounded-2xl border-2 border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                    <img
                      src={newPreviewUrl}
                      alt="Vista previa"
                      className="w-full h-full object-contain"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <button
                        type="button"
                        onClick={triggerNewFileInput}
                        className="cursor-pointer bg-white text-black p-3 rounded-full hover:bg-gray-100 transition-colors shadow-xl"
                      >
                        <Upload size={18} />
                      </button>
                      <button
                        type="button"
                        onClick={removeNewFile}
                        className="bg-rose-500 text-white p-3 rounded-full hover:bg-rose-600 transition-colors shadow-xl"
                      >
                        <XIcon size={18} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={triggerNewFileInput}
                    className="flex flex-col items-center justify-center w-full aspect-square max-h-[250px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-all cursor-pointer group"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-full mb-3 group-hover:scale-105 transition-transform">
                        <ImageIcon size={28} className="text-blue-500" />
                      </div>
                      <p className="mb-1 text-xs text-gray-700 dark:text-gray-300 text-center">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          Haz clic para subir
                        </span>
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        PNG, JPG o WEBP
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={newFileInputRef}
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleNewFileChange}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">
                Descripción / Contenido
              </Text>
              <textarea
                value={newFormData.description}
                onChange={(e) =>
                  setNewFormData({
                    ...newFormData,
                    description: e.target.value,
                  })
                }
                rows={4}
                className="w-full p-3 text-sm bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y"
              />
            </div>

            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">
                Metadatos Adicionales (JSON)
              </Text>
              <div className="relative">
                <textarea
                  value={newJsonString}
                  onChange={(e) => handleNewJsonChange(e.target.value)}
                  placeholder='{ "key": "value" }'
                  rows={5}
                  className={`w-full p-3 font-mono text-[10px] bg-slate-900 text-emerald-400 border rounded-lg focus:ring-2 outline-none transition-all resize-y ${
                    newJsonError
                      ? "border-rose-500 focus:ring-rose-500/20"
                      : "border-slate-800 focus:ring-emerald-500/20"
                  }`}
                  spellCheck={false}
                />
                {newJsonError && (
                  <div className="absolute bottom-2 right-2 bg-rose-600 text-white text-[10px] px-2 py-1 rounded shadow-lg">
                    JSON Inválido
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">
                  Orden
                </Text>
                <TextInput
                  type="number"
                  value={newFormData.content_order.toString()}
                  onChange={(e) =>
                    setNewFormData({
                      ...newFormData,
                      content_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-3 pt-0 sm:pt-6">
                <Switch
                  checked={newFormData.is_active}
                  onChange={(checked) =>
                    setNewFormData({ ...newFormData, is_active: checked })
                  }
                />
                <Text className="text-sm">
                  {newFormData.is_active ? "Activo" : "Inactivo"}
                </Text>
              </div>
            </div>

            {createStatus && (
              <Callout
                className="mt-4"
                title={createStatus.type === "success" ? "Éxito" : "Error"}
                icon={
                  createStatus.type === "success" ? CheckCircle : AlertCircle
                }
                color={createStatus.type === "success" ? "emerald" : "rose"}
              >
                {createStatus.message}
              </Callout>
            )}

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="secondary"
                onClick={() => setIsCreateOpen(false)}
                disabled={isCreating}
              >
                Cancelar
              </Button>
              <Button icon={Save} loading={isCreating} onClick={handleCreate}>
                Crear Sección
              </Button>
            </div>
          </form>
        </DialogPanel>
      </Dialog>
    </div>
  );
}
