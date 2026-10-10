"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Dialog, DialogPanel, Select, SelectItem } from "@tremor/react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Eye,
  EyeOff,
  GripVertical,
  ImageIcon,
  Loader2,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
  X as XIcon,
} from "lucide-react";
import { callAction, callActionForm } from "@/lib/action-client";
import { compressImage } from "@/lib/compress-image";
import { usd } from "@/lib/validation/shop-orders";
import type { Product, ProductLine } from "@/lib/validation/products";
import { ErrorBox, FieldLabel, inputClass, type Result, type ShopTabProps } from "./shared";

/** Fila del editor de presentaciones (texto tal como se captura). */
interface VariantRow {
  key: string;
  id?: number;
  label: string;
  price: string;
  unit: string;
  is_available: boolean;
}

/** Valores del formulario de producto. */
interface FormState {
  name: string;
  description: string;
  line_id: string;
  content_order: string;
  is_active: boolean;
  variants: VariantRow[];
}

const ALL = "all";

let rowSeq = 0;
const newRow = (partial: Partial<VariantRow> = {}): VariantRow => ({
  key: `row-${++rowSeq}`,
  label: "",
  price: "",
  unit: "",
  is_available: true,
  ...partial,
});

const emptyForm = (lineId = ""): FormState => ({
  name: "",
  description: "",
  line_id: lineId,
  content_order: "0",
  is_active: true,
  variants: [newRow()],
});

/** Texto de precio de un producto: «$10.00» o «$10.00 – $15.00». */
function priceRange(p: Product): string {
  if (p.variants.length === 0) return "Sin precio";
  const prices = p.variants.map((v) => v.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return min === max ? usd.format(min) : `${usd.format(min)} – ${usd.format(max)}`;
}

/**
 * Pestaña Productos: listado agrupado por catálogo y línea, alta/edición en
 * diálogo con foto y presentaciones (precio por variante), disponibilidad por
 * presentación, publicar/ocultar y eliminación.
 */
export default function ProductsTab({ companyId, data, setData }: ShopTabProps) {
  const [catalogFilter, setCatalogFilter] = useState<string>(ALL);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const catalogName = useMemo(
    () => new Map(data.catalogs.map((c) => [c.id, c.name])),
    [data.catalogs],
  );

  /** Líneas ordenadas por catálogo y luego por orden propio. */
  const orderedLines = useMemo(() => {
    const catalogOrder = new Map(data.catalogs.map((c, i) => [c.id, i]));
    return [...data.lines].sort(
      (a, b) =>
        (catalogOrder.get(a.catalog_id) ?? 99) - (catalogOrder.get(b.catalog_id) ?? 99) ||
        a.content_order - b.content_order,
    );
  }, [data.catalogs, data.lines]);

  const lineLabel = (line: ProductLine) =>
    `${catalogName.get(line.catalog_id) ?? "Catálogo"} · ${line.name}`;

  /** Grupos visibles (línea → productos) según filtro y búsqueda. */
  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matches = (p: Product) => !q || p.name.toLowerCase().includes(q);
    const result = orderedLines
      .filter((l) => catalogFilter === ALL || String(l.catalog_id) === catalogFilter)
      .map((line) => ({
        key: String(line.id),
        lineId: line.id as number | null,
        title: lineLabel(line),
        inactive: !line.is_active,
        products: data.products.filter((p) => p.line_id === line.id && matches(p)),
      }));
    const orphans = data.products.filter((p) => p.line_id === null && matches(p));
    if (orphans.length > 0 && catalogFilter === ALL) {
      result.push({
        key: "none",
        lineId: null,
        title: "Sin línea asignada",
        inactive: false,
        products: orphans,
      });
    }
    return result.filter((g) => g.products.length > 0 || (!q && catalogFilter !== ALL));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderedLines, data.products, catalogFilter, search, catalogName]);

  /**
   * Sensores de dnd-kit (mismo esquema que la galería del CMS): PointerSensor
   * cubre mouse, touch y stylus; KeyboardSensor permite reordenar con teclado
   * desde el asa. `distance` evita que un click inicie un arrastre.
   */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const [reorderingLine, setReorderingLine] = useState<number | null>(null);

  /**
   * Fin del arrastre dentro de una línea: reordena con `arrayMove`, renumera
   * `content_order` (1, 2, 3…), actualiza en local y persiste. Si el servidor
   * falla, restaura el orden anterior.
   */
  const handleDragEnd = async (lineId: number, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const lineProducts = data.products.filter((p) => p.line_id === lineId);
    const oldIndex = lineProducts.findIndex((p) => p.id === active.id);
    const newIndex = lineProducts.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(lineProducts, oldIndex, newIndex).map((p, i) => ({
      ...p,
      content_order: i + 1,
    }));
    const previous = data.products;
    setData((prev) => ({
      ...prev,
      products: [...prev.products.filter((p) => p.line_id !== lineId), ...reordered].sort(
        (a, b) => a.content_order - b.content_order || a.name.localeCompare(b.name),
      ),
    }));

    setReorderingLine(lineId);
    setError(null);
    const revert = (message: string) => {
      setData((prev) => ({ ...prev, products: previous }));
      setError(message);
    };
    try {
      const res = await callAction<Result<undefined>>("productos.reorderProducts", [
        lineId,
        reordered.map((p) => p.id),
      ]);
      if (!res.success) revert(`No se guardó el nuevo orden: ${res.error}`);
    } catch {
      revert("No se guardó el nuevo orden: error de conexión. Intenta de nuevo.");
    } finally {
      setReorderingLine(null);
    }
  };

  /** Orden para un producto nuevo o movido de línea: al final de la línea destino. */
  const nextOrderIn = (lineId: string) =>
    data.products
      .filter((p) => String(p.line_id) === lineId)
      .reduce((max, p) => Math.max(max, p.content_order), 0) + 1;

  /** Reemplaza (o agrega) un producto en el estado compartido. */
  const upsertLocal = (product: Product) =>
    setData((prev) => ({
      ...prev,
      products: [...prev.products.filter((p) => p.id !== product.id), product].sort(
        (a, b) => a.content_order - b.content_order || a.name.localeCompare(b.name),
      ),
    }));

  const openCreate = () => {
    const firstLine =
      orderedLines.find((l) => catalogFilter === ALL || String(l.catalog_id) === catalogFilter) ??
      orderedLines[0];
    setEditing(null);
    setForm(emptyForm(firstLine ? String(firstLine.id) : ""));
    setImageFile(null);
    setImagePreview(null);
    setRemoveImage(false);
    setFormError(null);
    setModalOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditing(product);
    setForm({
      name: product.name,
      description: product.description ?? "",
      line_id: product.line_id ? String(product.line_id) : "",
      content_order: String(product.content_order),
      is_active: product.is_active,
      variants:
        product.variants.length > 0
          ? product.variants.map((v) =>
              newRow({
                id: v.id,
                label: v.label ?? "",
                price: String(v.price),
                unit: v.unit ?? "",
                is_available: v.is_available,
              }),
            )
          : [newRow()],
    });
    setImageFile(null);
    setImagePreview(product.image_url);
    setRemoveImage(false);
    setFormError(null);
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

  const updateRow = (key: string, patch: Partial<VariantRow>) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)),
    }));

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    if (!form.line_id) {
      setFormError("Selecciona la línea del producto.");
      return;
    }
    const variants = form.variants.map((v) => ({
      ...(v.id ? { id: v.id } : {}),
      label: v.label.trim() || null,
      price: Number(v.price.replace(",", ".")),
      unit: v.unit.trim() || null,
      is_available: v.is_available,
    }));
    if (variants.some((v) => !Number.isFinite(v.price) || v.price < 0)) {
      setFormError("Revisa los precios: deben ser números mayores o iguales a 0.");
      return;
    }

    setSaving(true);
    const fd = new FormData();
    fd.append("company_id", String(companyId));
    if (editing) fd.append("id", editing.id);
    fd.append("line_id", form.line_id);
    fd.append("name", form.name);
    fd.append("description", form.description);
    // El orden se cambia arrastrando; aquí solo se conserva o se va al final de la línea.
    const keepsPlace = editing && String(editing.line_id) === form.line_id;
    fd.append(
      "content_order",
      String(keepsPlace ? editing.content_order : nextOrderIn(form.line_id)),
    );
    fd.append("is_active", String(form.is_active));
    fd.append("variants", JSON.stringify(variants));
    if (imageFile) fd.append("image", imageFile);
    if (removeImage) fd.append("remove_image", "true");

    try {
      const res = await callActionForm<Result<Product>>(
        editing ? "productos.updateProduct" : "productos.createProduct",
        fd,
      );
      if (!res.success || !res.data) {
        setFormError(res.success ? "Respuesta inválida del servidor." : res.error);
        return;
      }
      upsertLocal(res.data);
      setModalOpen(false);
    } catch {
      setFormError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  /** Ejecuta una acción sobre un producto y actualiza el estado con el resultado. */
  const runOnProduct = async (product: Product, name: string, args: unknown[]) => {
    setBusyId(product.id);
    setError(null);
    try {
      const res = await callAction<Result<Product>>(name, args);
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
      if (res.success)
        setData((prev) => ({
          ...prev,
          products: prev.products.filter((p) => p.id !== product.id),
        }));
      else setError(res.error);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setBusyId(null);
    }
  };

  const noLines = data.lines.length === 0;

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-64">
          <Select value={catalogFilter} onValueChange={setCatalogFilter} enableClear={false}>
            <SelectItem value={ALL}>Todos los catálogos</SelectItem>
            {data.catalogs.map((c) => (
              <SelectItem key={c.id} value={String(c.id)}>
                {c.name}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="relative w-full sm:w-64">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar producto…"
            className={`${inputClass} pl-9`}
          />
        </div>
        <button
          type="button"
          onClick={openCreate}
          disabled={noLines}
          title={noLines ? "Primero crea una línea en «Catálogos y líneas»" : undefined}
          className="sm:ml-auto inline-flex items-center gap-2 rounded-lg bg-larioja-azul px-4 py-2 text-sm font-semibold text-white hover:bg-larioja-azul/90 disabled:opacity-50"
        >
          <Plus size={16} />
          Nuevo producto
        </button>
      </div>

      <ErrorBox message={!modalOpen ? error : null} />

      {noLines ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 py-16 text-center text-gray-500 dark:text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-50" />
          Primero crea las líneas de productos en la pestaña «Catálogos y líneas».
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 py-16 text-center text-gray-500 dark:text-gray-400">
          <Package size={40} className="mx-auto mb-3 opacity-50" />
          {search ? "Ningún producto coincide con la búsqueda." : "Aún no hay productos."}
        </div>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="space-y-3">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              {group.title}
              <span className="font-normal normal-case">({group.products.length})</span>
              {group.inactive && (
                <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-white normal-case">
                  Línea oculta
                </span>
              )}
            </h2>
            {group.products.length === 0 ? (
              <p className="text-sm text-gray-400 italic">Sin productos en esta línea.</p>
            ) : (
              (() => {
                const lineId = group.lineId;
                // Solo se reordena la línea completa: no con búsqueda activa ni sin línea.
                const sortable = lineId !== null && !search.trim() && group.products.length > 1;
                const grid = (
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {group.products.map((p) => (
                      <SortableProductCard
                        key={p.id}
                        product={p}
                        sortable={sortable && reorderingLine !== lineId}
                        busy={busyId === p.id}
                        onEdit={() => openEdit(p)}
                        onDelete={() => handleDelete(p)}
                        onToggleActive={() =>
                          runOnProduct(p, "productos.setProductActive", [p.id, !p.is_active])
                        }
                        onToggleVariant={(variantId, value) =>
                          runOnProduct(p, "productos.setVariantAvailability", [variantId, value])
                        }
                      />
                    ))}
                  </div>
                );
                if (!sortable || lineId === null) return grid;
                return (
                  <>
                    {reorderingLine === lineId && (
                      <p className="flex items-center gap-2 text-xs text-gray-500">
                        <Loader2 size={14} className="animate-spin" />
                        Guardando nuevo orden...
                      </p>
                    )}
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={(event) => handleDragEnd(lineId, event)}
                    >
                      <SortableContext
                        items={group.products.map((p) => p.id)}
                        strategy={rectSortingStrategy}
                      >
                        {grid}
                      </SortableContext>
                    </DndContext>
                  </>
                );
              })()
            )}
          </section>
        ))
      )}

      {/* Dialog de Tremor: gestiona el apilado de portales (Select por encima). */}
      <Dialog open={modalOpen} onClose={closeModal} static={true}>
        <DialogPanel className="max-w-xl w-full p-0 overflow-hidden rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-2xl">
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
                <FieldLabel>Foto</FieldLabel>
                <div className="flex items-center gap-4">
                  <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-[#f3efe7] dark:bg-gray-900">
                    {imagePreview ? (
                      <Image
                        src={imagePreview}
                        alt="Vista previa"
                        fill
                        unoptimized
                        className="object-contain p-1"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-700">
                        <ImageIcon size={32} />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 min-w-0">
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
                <FieldLabel>Nombre *</FieldLabel>
                <input
                  required
                  minLength={2}
                  maxLength={120}
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass}
                  placeholder="Tote bag floral"
                />
              </label>

              <label className="block">
                <FieldLabel>Descripción</FieldLabel>
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className={inputClass}
                />
              </label>

              <div>
                <div>
                  <FieldLabel>Catálogo y línea *</FieldLabel>
                  <Select
                    value={form.line_id}
                    onValueChange={(line_id) => setForm({ ...form, line_id })}
                    enableClear={false}
                    placeholder="Selecciona una línea"
                  >
                    {orderedLines.map((l) => (
                      <SelectItem key={l.id} value={String(l.id)}>
                        {lineLabel(l)}
                      </SelectItem>
                    ))}
                  </Select>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Para cambiar el orden en la tienda, arrastra la tarjeta desde el asa ⋮⋮ en el
                  listado.
                </p>
              </div>

              {/* Presentaciones y precios */}
              <div>
                <FieldLabel>Precios *</FieldLabel>
                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  Un precio si el producto tiene una sola presentación. Para varias (p. ej. Pequeño
                  / Grande), ponle nombre a cada una.
                </p>
                <div className="space-y-2">
                  {form.variants.map((v) => (
                    <div
                      key={v.key}
                      className="grid grid-cols-2 sm:grid-cols-[1fr_6rem_1fr_auto_auto] items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-800 p-2"
                    >
                      <input
                        aria-label="Presentación"
                        maxLength={40}
                        value={v.label}
                        onChange={(e) => updateRow(v.key, { label: e.target.value })}
                        className={inputClass}
                        placeholder={form.variants.length > 1 ? "Presentación *" : "Presentación"}
                        required={form.variants.length > 1}
                      />
                      <input
                        aria-label="Precio en USD"
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={v.price}
                        onChange={(e) => updateRow(v.key, { price: e.target.value })}
                        className={inputClass}
                        placeholder="$"
                      />
                      <input
                        aria-label="Unidad"
                        maxLength={40}
                        value={v.unit}
                        onChange={(e) => updateRow(v.key, { unit: e.target.value })}
                        className={inputClass}
                        placeholder="Unidad (2 unidades…)"
                      />
                      <label className="inline-flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={v.is_available}
                          onChange={(e) => updateRow(v.key, { is_available: e.target.checked })}
                          className="h-4 w-4 accent-larioja-verde"
                        />
                        Disponible
                      </label>
                      <button
                        type="button"
                        disabled={form.variants.length === 1}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            variants: f.variants.filter((r) => r.key !== v.key),
                          }))
                        }
                        className="justify-self-end rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 disabled:opacity-30 disabled:hover:bg-transparent"
                        aria-label="Quitar presentación"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
                {form.variants.length < 10 && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, variants: [...f.variants, newRow()] }))}
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-larioja-azul dark:text-larioja-amarillo hover:underline"
                  >
                    <Plus size={14} />
                    Agregar presentación
                  </button>
                )}
              </div>

              <label className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="h-4 w-4 accent-larioja-azul"
                />
                Publicado en la tienda
              </label>

              <ErrorBox message={formError} />
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

interface ProductAdminCardProps {
  product: Product;
  /** Muestra el asa ⋮⋮ y permite arrastrar (dentro de un `SortableContext`). */
  sortable: boolean;
  busy: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onToggleVariant: (variantId: number, value: boolean) => void;
}

/**
 * Tarjeta de producto en el admin con soporte de reordenamiento mediante
 * dnd-kit: el asa ⋮⋮ recibe los listeners y atributos de accesibilidad de
 * `useSortable`, de modo que los botones de la tarjeta siguen funcionando.
 */
function SortableProductCard({
  product: p,
  sortable,
  busy,
  onEdit,
  onDelete,
  onToggleActive,
  onToggleVariant,
}: ProductAdminCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: p.id,
    disabled: !sortable,
  });
  const soldOut = p.variants.length > 0 && p.variants.every((v) => !v.is_available);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative flex flex-col rounded-xl border bg-white dark:bg-gray-950 overflow-hidden ${
        isDragging ? "z-20 opacity-40 border-larioja-azul" : ""
      } ${
        p.is_active
          ? "border-gray-200 dark:border-gray-800"
          : "border-dashed border-gray-300 dark:border-gray-700 opacity-70"
      }`}
    >
      <div className="flex gap-3 p-3">
        {sortable && (
          <button
            type="button"
            {...attributes}
            {...listeners}
            className="-ml-1 self-start rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 cursor-grab active:cursor-grabbing touch-none"
            aria-label={`Arrastrar para reordenar ${p.name}`}
            title="Arrastrar para reordenar"
          >
            <GripVertical size={16} />
          </button>
        )}
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#f3efe7] dark:bg-gray-900">
          {p.image_url ? (
            <Image
              src={p.image_url}
              alt={p.name}
              fill
              sizes="80px"
              className="object-contain p-1"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-700">
              <ImageIcon size={28} />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-gray-900 dark:text-white break-words leading-tight">
            {p.name}
          </h3>
          <p className="text-sm font-semibold text-larioja-azul dark:text-larioja-amarillo">
            {priceRange(p)}
          </p>
          <div className="mt-1 flex flex-wrap gap-1">
            {!p.is_active && (
              <span className="rounded-full bg-gray-800 px-2 py-0.5 text-[10px] font-semibold text-white">
                Oculto
              </span>
            )}
            {soldOut && (
              <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-semibold text-white">
                Agotado
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 px-3 pb-3">
        {p.variants.map((v) => (
          <button
            key={v.id}
            type="button"
            disabled={busy}
            onClick={() => onToggleVariant(v.id, !v.is_available)}
            title={v.is_available ? "Marcar como agotado" : "Marcar como disponible"}
            className={`rounded-full px-2.5 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
              v.is_available
                ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300"
                : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 line-through"
            }`}
          >
            {v.label ? `${v.label} · ` : ""}
            {usd.format(v.price)}
            {v.unit ? ` / ${v.unit}` : ""}
          </button>
        ))}
      </div>

      <div className="mt-auto flex items-center gap-2 border-t border-gray-100 dark:border-gray-800 px-3 py-2">
        <button
          type="button"
          disabled={busy}
          onClick={onToggleActive}
          className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-50"
          title={p.is_active ? "Ocultar de la tienda" : "Publicar en la tienda"}
        >
          {p.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
          {p.is_active ? "Publicado" : "Oculto"}
        </button>
        <div className="ml-auto flex items-center gap-1">
          {busy && <Loader2 size={16} className="animate-spin text-gray-400" />}
          <button
            type="button"
            onClick={onEdit}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-larioja-azul dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label={`Editar ${p.name}`}
          >
            <Pencil size={16} />
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDelete}
            className="rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 disabled:opacity-50"
            aria-label={`Eliminar ${p.name}`}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
