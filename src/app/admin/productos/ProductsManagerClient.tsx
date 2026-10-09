"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Dialog, DialogPanel, Select, SelectItem } from "@tremor/react";
import {
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
  ImageIcon,
  Loader2,
  Package,
  Pencil,
  Plus,
  Trash2,
  X as XIcon,
} from "lucide-react";
import { callAction, callActionForm } from "@/lib/action-client";
import { compressImage } from "@/lib/compress-image";
import { PRODUCT_CATEGORIES, type Product } from "@/lib/validation/products";

type Result<T> = { success: true; data?: T } | { success: false; error: string };

interface ProductsManagerClientProps {
  companyId: number;
  initialProducts: Product[];
}

/** Valores del formulario (texto, tal como se capturan). */
interface FormState {
  name: string;
  description: string;
  category: string;
  price: string;
  unit: string;
  content_order: string;
  is_available: boolean;
  is_active: boolean;
}

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  category: PRODUCT_CATEGORIES[0],
  price: "",
  unit: "",
  content_order: "0",
  is_available: true,
  is_active: true,
};

const priceFormatter = new Intl.NumberFormat("es-SV", {
  style: "currency",
  currency: "USD",
});

/** Ordena igual que el servidor: categoría, orden, nombre. */
function sortProducts(list: Product[]): Product[] {
  return [...list].sort(
    (a, b) =>
      a.category.localeCompare(b.category) ||
      a.content_order - b.content_order ||
      a.name.localeCompare(b.name),
  );
}

/**
 * Gestión del catálogo de productos: listado, alta/edición en modal con foto,
 * interruptores Disponible/Publicado y eliminación. Actualiza estado local
 * sin refrescar el payload RSC.
 */
export default function ProductsManagerClient({
  companyId,
  initialProducts,
}: ProductsManagerClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categoryOptions = useMemo(
    () => Array.from(new Set([...PRODUCT_CATEGORIES, ...products.map((p) => p.category)])),
    [products],
  );

  /** Reemplaza (o agrega) un producto en el estado local. */
  const upsertLocal = (product: Product) =>
    setProducts((prev) => sortProducts([...prev.filter((p) => p.id !== product.id), product]));

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    setError(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? "",
      category: product.category,
      price: product.price !== null ? String(product.price) : "",
      unit: product.unit ?? "",
      content_order: String(product.content_order),
      is_available: product.is_available,
      is_active: product.is_active,
    });
    setImageFile(null);
    setImagePreview(product.image_url);
    setRemoveImage(false);
    setError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file, 1200);
    setImageFile(compressed);
    setImagePreview(URL.createObjectURL(compressed));
    setRemoveImage(false);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const fd = new FormData();
    fd.append("company_id", String(companyId));
    if (editing) fd.append("id", editing.id);
    fd.append("name", form.name);
    fd.append("description", form.description);
    fd.append("category", form.category);
    fd.append("price", form.price);
    fd.append("unit", form.unit);
    fd.append("content_order", form.content_order);
    fd.append("is_available", String(form.is_available));
    fd.append("is_active", String(form.is_active));
    if (imageFile) fd.append("image", imageFile);
    if (removeImage) fd.append("remove_image", "true");

    try {
      const res = await callActionForm<Result<Product>>(
        editing ? "productos.updateProduct" : "productos.createProduct",
        fd,
      );
      if (!res.success || !res.data) {
        setError(res.success ? "Respuesta inválida del servidor." : res.error);
        return;
      }
      upsertLocal(res.data);
      setModalOpen(false);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  const toggleFlag = async (product: Product, flag: "is_available" | "is_active") => {
    setBusyId(product.id);
    setError(null);
    try {
      const res = await callAction<Result<Product>>("productos.setProductFlag", [
        product.id,
        flag,
        !product[flag],
      ]);
      if (res.success && res.data) upsertLocal(res.data);
      else setError(res.success ? "Respuesta inválida del servidor." : res.error);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (product: Product) => {
    if (!confirm(`¿Eliminar el producto «${product.name}»? Esta acción no se puede deshacer.`))
      return;
    setBusyId(product.id);
    setError(null);
    try {
      const res = await callAction<Result<undefined>>("productos.deleteProduct", [product.id]);
      if (res.success) setProducts((prev) => prev.filter((p) => p.id !== product.id));
      else setError(res.error);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setBusyId(null);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-larioja-azul/40";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Productos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Catálogo público de productos de los talleres ({products.length}).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/productos"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ExternalLink size={16} />
            Ver página
          </a>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-2 rounded-lg bg-larioja-azul px-4 py-2 text-sm font-semibold text-white hover:bg-larioja-azul/90"
          >
            <Plus size={16} />
            Nuevo producto
          </button>
        </div>
      </div>

      {error && !modalOpen && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 py-16 text-center text-gray-500 dark:text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-50" />
          Aún no hay productos. Crea el primero con «Nuevo producto».
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {products.map((p) => (
            <div
              key={p.id}
              className={`flex flex-col rounded-xl border bg-white dark:bg-gray-950 overflow-hidden ${
                p.is_active
                  ? "border-gray-200 dark:border-gray-800"
                  : "border-dashed border-gray-300 dark:border-gray-700 opacity-70"
              }`}
            >
              <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-900">
                {p.image_url ? (
                  <Image
                    src={p.image_url}
                    alt={p.name}
                    fill
                    sizes="(max-width: 640px) 100vw, 33vw"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-700">
                    <ImageIcon size={40} />
                  </div>
                )}
                <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                  <span className="rounded-full bg-white/90 dark:bg-black/80 px-2 py-0.5 text-xs font-semibold text-gray-800 dark:text-gray-100">
                    {p.category}
                  </span>
                  {!p.is_active && (
                    <span className="rounded-full bg-gray-800 px-2 py-0.5 text-xs font-semibold text-white">
                      Oculto
                    </span>
                  )}
                  {!p.is_available && (
                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white">
                      Agotado
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-1 flex-col p-4 gap-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-900 dark:text-white break-words">{p.name}</h3>
                  <span className="shrink-0 text-sm font-semibold text-larioja-azul dark:text-larioja-amarillo">
                    {p.price !== null ? priceFormatter.format(p.price) : "A consultar"}
                    {p.price !== null && p.unit ? ` / ${p.unit}` : ""}
                  </span>
                </div>
                {p.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {p.description}
                  </p>
                )}

                <div className="mt-auto pt-3 flex flex-wrap items-center gap-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => toggleFlag(p, "is_available")}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                      p.is_available
                        ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                        : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300"
                    }`}
                    title="Cambiar disponibilidad"
                  >
                    {p.is_available ? "Disponible" : "Agotado"}
                  </button>
                  <button
                    type="button"
                    disabled={busyId === p.id}
                    onClick={() => toggleFlag(p, "is_active")}
                    className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-50"
                    title={p.is_active ? "Ocultar del sitio público" : "Publicar en el sitio"}
                  >
                    {p.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                    {p.is_active ? "Publicado" : "Oculto"}
                  </button>
                  <div className="ml-auto flex items-center gap-1">
                    {busyId === p.id && (
                      <Loader2 size={16} className="animate-spin text-gray-400" />
                    )}
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-larioja-azul dark:hover:bg-gray-800 dark:hover:text-white"
                      aria-label={`Editar ${p.name}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={busyId === p.id}
                      onClick={() => handleDelete(p)}
                      className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 disabled:opacity-50"
                      aria-label={`Eliminar ${p.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de Tremor (como los diálogos de Bingo): gestiona el apilado de
          portales, así el desplegable del Select queda por encima del modal. */}
      <Dialog open={modalOpen} onClose={closeModal} static={true}>
        <DialogPanel className="max-w-lg w-full p-0 overflow-hidden rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-2xl">
          <form onSubmit={handleSubmit} className="max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? "Editar producto" : "Nuevo producto"}
              </h2>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-white"
                aria-label="Cerrar"
              >
                <XIcon size={20} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-4">
              {/* Foto */}
              <div>
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Foto
                </span>
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-900">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Vista previa"
                        fill
                        unoptimized
                        className="object-cover"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-700">
                        <ImageIcon size={32} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="text-sm text-gray-600 dark:text-gray-300 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 dark:file:bg-gray-800 file:px-3 file:py-1.5 file:text-sm file:font-semibold"
                    />
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={clearImage}
                        className="self-start text-xs font-semibold text-red-600 hover:underline"
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <label className="block">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre *
                </span>
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  placeholder="Pan dulce artesanal"
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descripción
                </span>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Categoría *
                </span>
                <Select
                  value={form.category}
                  onValueChange={(category) => setForm({ ...form, category })}
                  enableClear={false}
                >
                  {categoryOptions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </Select>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="block">
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio (USD)
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={inputClass}
                    placeholder="A consultar"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Unidad
                  </span>
                  <input
                    maxLength={40}
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className={inputClass}
                    placeholder="unidad, docena…"
                  />
                </label>
                <label className="block">
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Orden
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={form.content_order}
                    onChange={(e) => setForm({ ...form, content_order: e.target.value })}
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.is_available}
                    onChange={(e) => setForm({ ...form, is_available: e.target.checked })}
                    className="h-4 w-4 accent-larioja-verde"
                  />
                  Disponible (desmarcar = Agotado)
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                    className="h-4 w-4 accent-larioja-azul"
                  />
                  Publicado en el sitio
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-gray-100 dark:border-gray-800 px-5 py-4">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-larioja-azul px-4 py-2 text-sm font-semibold text-white hover:bg-larioja-azul/90 disabled:opacity-50"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {editing ? "Guardar cambios" : "Crear producto"}
              </button>
            </div>
          </form>
        </DialogPanel>
      </Dialog>
    </div>
  );
}
