"use client";

import { useState } from "react";
import { Dialog, DialogPanel, Select, SelectItem } from "@tremor/react";
import { Eye, EyeOff, Layers, Loader2, Pencil, Plus, Trash2, X as XIcon } from "lucide-react";
import { callAction } from "@/lib/action-client";
import type {
  CatalogInput,
  LineInput,
  ProductCatalog,
  ProductLine,
} from "@/lib/validation/products";
import {
  byOrder,
  ErrorBox,
  FieldLabel,
  inputClass,
  type Result,
  type ShopTabProps,
} from "./shared";
import { CatalogPdfRow } from "./CatalogPdfRow";

/** Diálogo abierto: catálogo o línea, nuevo (id indefinido) o en edición. */
type Editing = { kind: "catalog"; value: CatalogInput } | { kind: "line"; value: LineInput } | null;

/** Convierte un nombre en identificador de URL («Arte y Costura» → «arte-y-costura»). */
function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Pestaña Catálogos y líneas: talleres (con lema y «Quiénes somos») y sus
 * líneas de productos (con texto y eslogan), tal como se ven en /productos.
 */
export default function CatalogsTab({ companyId, data, setData }: ShopTabProps) {
  const [editing, setEditing] = useState<Editing>(null);
  const [saving, setSaving] = useState(false);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const productCount = (lineId: number) => data.products.filter((p) => p.line_id === lineId).length;

  const openCatalog = (c?: ProductCatalog) => {
    setFormError(null);
    setEditing({
      kind: "catalog",
      value: c
        ? {
            id: c.id,
            company_id: c.company_id,
            slug: c.slug,
            name: c.name,
            tagline: c.tagline,
            description: c.description,
            content_order: c.content_order,
            is_active: c.is_active,
          }
        : {
            company_id: companyId,
            slug: "",
            name: "",
            tagline: null,
            description: null,
            content_order: data.catalogs.length + 1,
            is_active: true,
          },
    });
  };

  const openLine = (catalogId: number, l?: ProductLine) => {
    setFormError(null);
    setEditing({
      kind: "line",
      value: l
        ? {
            id: l.id,
            catalog_id: l.catalog_id,
            name: l.name,
            description: l.description,
            slogan: l.slogan,
            content_order: l.content_order,
            is_active: l.is_active,
          }
        : {
            catalog_id: catalogId,
            name: "",
            description: null,
            slogan: null,
            content_order: data.lines.filter((x) => x.catalog_id === catalogId).length + 1,
            is_active: true,
          },
    });
  };

  const closeModal = () => {
    if (!saving) setEditing(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setFormError(null);
    try {
      if (editing.kind === "catalog") {
        const res = await callAction<Result<ProductCatalog>>("productos.saveCatalog", [
          editing.value,
        ]);
        if (!res.success || !res.data) {
          setFormError(res.success ? "Respuesta inválida del servidor." : res.error);
          return;
        }
        const saved = res.data;
        setData((prev) => ({
          ...prev,
          catalogs: byOrder([...prev.catalogs.filter((c) => c.id !== saved.id), saved]),
        }));
      } else {
        const res = await callAction<Result<ProductLine>>("productos.saveLine", [editing.value]);
        if (!res.success || !res.data) {
          setFormError(res.success ? "Respuesta inválida del servidor." : res.error);
          return;
        }
        const saved = res.data;
        setData((prev) => ({
          ...prev,
          lines: byOrder([...prev.lines.filter((l) => l.id !== saved.id), saved]),
        }));
      }
      setEditing(null);
    } catch {
      setFormError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  };

  /** Publica u oculta un catálogo o una línea. */
  const toggleActive = async (
    target: { kind: "catalog"; item: ProductCatalog } | { kind: "line"; item: ProductLine },
  ) => {
    const key = `${target.kind}-${target.item.id}`;
    setBusyKey(key);
    setError(null);
    try {
      if (target.kind === "catalog") {
        const c = target.item;
        const res = await callAction<Result<ProductCatalog>>("productos.saveCatalog", [
          { ...c, is_active: !c.is_active },
        ]);
        if (res.success && res.data) {
          const saved = res.data;
          setData((prev) => ({
            ...prev,
            catalogs: byOrder([...prev.catalogs.filter((x) => x.id !== saved.id), saved]),
          }));
        } else setError(res.success ? "Respuesta inválida del servidor." : res.error);
      } else {
        const l = target.item;
        const res = await callAction<Result<ProductLine>>("productos.saveLine", [
          { ...l, is_active: !l.is_active },
        ]);
        if (res.success && res.data) {
          const saved = res.data;
          setData((prev) => ({
            ...prev,
            lines: byOrder([...prev.lines.filter((x) => x.id !== saved.id), saved]),
          }));
        } else setError(res.success ? "Respuesta inválida del servidor." : res.error);
      }
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setBusyKey(null);
    }
  };

  const removeCatalog = async (c: ProductCatalog) => {
    if (!confirm(`¿Eliminar el catálogo «${c.name}» y sus líneas vacías?`)) return;
    setBusyKey(`catalog-${c.id}`);
    setError(null);
    try {
      const res = await callAction<Result<undefined>>("productos.deleteCatalog", [c.id]);
      if (res.success)
        setData((prev) => ({
          ...prev,
          catalogs: prev.catalogs.filter((x) => x.id !== c.id),
          lines: prev.lines.filter((l) => l.catalog_id !== c.id),
        }));
      else setError(res.error);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setBusyKey(null);
    }
  };

  const removeLine = async (l: ProductLine) => {
    if (!confirm(`¿Eliminar la línea «${l.name}»?`)) return;
    setBusyKey(`line-${l.id}`);
    setError(null);
    try {
      const res = await callAction<Result<undefined>>("productos.deleteLine", [l.id]);
      if (res.success)
        setData((prev) => ({ ...prev, lines: prev.lines.filter((x) => x.id !== l.id) }));
      else setError(res.error);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setBusyKey(null);
    }
  };

  const iconBtn =
    "rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-larioja-azul dark:hover:bg-gray-800 dark:hover:text-white disabled:opacity-50";
  const deleteBtn =
    "rounded-lg p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 disabled:opacity-50";

  return (
    <div className="space-y-6 pt-6">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => openCatalog()}
          className="inline-flex items-center gap-2 rounded-lg bg-larioja-azul px-4 py-2 text-sm font-semibold text-white hover:bg-larioja-azul/90"
        >
          <Plus size={16} />
          Nuevo catálogo
        </button>
      </div>

      <ErrorBox message={!editing ? error : null} />

      {data.catalogs.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 py-16 text-center text-gray-500 dark:text-gray-400">
          <Layers size={40} className="mx-auto mb-3 opacity-50" />
          Aún no hay catálogos. Crea uno por taller (p. ej. «Arte y Costura»).
        </div>
      )}

      {data.catalogs.map((c) => {
        const lines = data.lines.filter((l) => l.catalog_id === c.id);
        const busy = busyKey === `catalog-${c.id}`;
        return (
          <section
            key={c.id}
            className={`rounded-xl border bg-white dark:bg-gray-950 ${
              c.is_active
                ? "border-gray-200 dark:border-gray-800"
                : "border-dashed border-gray-300 dark:border-gray-700"
            }`}
          >
            <header className="flex flex-wrap items-start gap-3 border-b border-gray-100 dark:border-gray-800 p-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {c.name} <span className="text-xs font-normal text-gray-400">/{c.slug}</span>
                </h2>
                {c.tagline && <p className="text-sm italic text-larioja-verde">“{c.tagline}”</p>}
                {c.description && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                    {c.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                {busy && <Loader2 size={16} className="animate-spin text-gray-400" />}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => toggleActive({ kind: "catalog", item: c })}
                  className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-50"
                >
                  {c.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                  {c.is_active ? "Publicado" : "Oculto"}
                </button>
                <button
                  type="button"
                  onClick={() => openCatalog(c)}
                  className={iconBtn}
                  aria-label={`Editar ${c.name}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => removeCatalog(c)}
                  className={deleteBtn}
                  aria-label={`Eliminar ${c.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </header>

            <CatalogPdfRow
              catalog={c}
              onUpdated={(saved) =>
                setData((prev) => ({
                  ...prev,
                  catalogs: prev.catalogs.map((x) => (x.id === saved.id ? saved : x)),
                }))
              }
            />

            <ul className="divide-y divide-gray-100 dark:divide-gray-800">
              {lines.map((l) => {
                const lineBusy = busyKey === `line-${l.id}`;
                return (
                  <li
                    key={l.id}
                    className={`flex flex-wrap items-center gap-3 px-4 py-3 ${l.is_active ? "" : "opacity-60"}`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {l.name}{" "}
                        <span className="text-xs font-normal text-gray-400">
                          ({productCount(l.id)} productos)
                        </span>
                      </p>
                      {l.slogan && <p className="text-xs italic text-gray-500">“{l.slogan}”</p>}
                    </div>
                    {lineBusy && <Loader2 size={16} className="animate-spin text-gray-400" />}
                    <button
                      type="button"
                      disabled={lineBusy}
                      onClick={() => toggleActive({ kind: "line", item: l })}
                      className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-700 dark:text-gray-200 disabled:opacity-50"
                    >
                      {l.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                      {l.is_active ? "Publicada" : "Oculta"}
                    </button>
                    <button
                      type="button"
                      onClick={() => openLine(c.id, l)}
                      className={iconBtn}
                      aria-label={`Editar ${l.name}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      disabled={lineBusy}
                      onClick={() => removeLine(l)}
                      className={deleteBtn}
                      aria-label={`Eliminar ${l.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                );
              })}
              <li className="px-4 py-3">
                <button
                  type="button"
                  onClick={() => openLine(c.id)}
                  className="inline-flex items-center gap-1 text-sm font-semibold text-larioja-azul dark:text-larioja-amarillo hover:underline"
                >
                  <Plus size={14} />
                  Agregar línea
                </button>
              </li>
            </ul>
          </section>
        );
      })}

      <Dialog open={editing !== null} onClose={closeModal} static={true}>
        <DialogPanel className="max-w-lg w-full p-0 overflow-hidden rounded-2xl bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 shadow-2xl">
          {editing && (
            <form onSubmit={handleSubmit} className="max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  {editing.kind === "catalog"
                    ? editing.value.id
                      ? "Editar catálogo"
                      : "Nuevo catálogo"
                    : editing.value.id
                      ? "Editar línea"
                      : "Nueva línea"}
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
                {editing.kind === "catalog" ? (
                  <CatalogFields
                    value={editing.value}
                    onChange={(value) => setEditing({ kind: "catalog", value })}
                  />
                ) : (
                  <LineFields
                    value={editing.value}
                    catalogs={data.catalogs}
                    onChange={(value) => setEditing({ kind: "line", value })}
                  />
                )}
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
                  Guardar
                </button>
              </div>
            </form>
          )}
        </DialogPanel>
      </Dialog>
    </div>
  );
}

/** Campos del formulario de catálogo. */
function CatalogFields({
  value,
  onChange,
}: {
  value: CatalogInput;
  onChange: (v: CatalogInput) => void;
}) {
  return (
    <>
      <label className="block">
        <FieldLabel>Nombre *</FieldLabel>
        <input
          required
          minLength={2}
          maxLength={80}
          value={value.name}
          onChange={(e) =>
            onChange({
              ...value,
              name: e.target.value,
              // Sugerir el identificador solo al crear.
              slug: value.id ? value.slug : slugify(e.target.value),
            })
          }
          className={inputClass}
          placeholder="Arte y Costura"
        />
      </label>
      <label className="block">
        <FieldLabel>Identificador en la URL *</FieldLabel>
        <input
          required
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          maxLength={60}
          value={value.slug}
          onChange={(e) => onChange({ ...value, slug: e.target.value })}
          className={inputClass}
          placeholder="arte-y-costura"
        />
      </label>
      <label className="block">
        <FieldLabel>Lema</FieldLabel>
        <input
          maxLength={160}
          value={value.tagline ?? ""}
          onChange={(e) => onChange({ ...value, tagline: e.target.value || null })}
          className={inputClass}
          placeholder="Arte y costura en cada creación."
        />
      </label>
      <label className="block">
        <FieldLabel>Quiénes somos</FieldLabel>
        <textarea
          rows={4}
          maxLength={2000}
          value={value.description ?? ""}
          onChange={(e) => onChange({ ...value, description: e.target.value || null })}
          className={inputClass}
        />
      </label>
      <OrderAndActive
        order={value.content_order}
        active={value.is_active}
        onChange={(content_order, is_active) => onChange({ ...value, content_order, is_active })}
      />
    </>
  );
}

/** Campos del formulario de línea. */
function LineFields({
  value,
  catalogs,
  onChange,
}: {
  value: LineInput;
  catalogs: ProductCatalog[];
  onChange: (v: LineInput) => void;
}) {
  return (
    <>
      <div>
        <FieldLabel>Catálogo *</FieldLabel>
        <Select
          value={String(value.catalog_id)}
          onValueChange={(v) => onChange({ ...value, catalog_id: Number(v) })}
          enableClear={false}
        >
          {catalogs.map((c) => (
            <SelectItem key={c.id} value={String(c.id)}>
              {c.name}
            </SelectItem>
          ))}
        </Select>
      </div>
      <label className="block">
        <FieldLabel>Nombre *</FieldLabel>
        <input
          required
          minLength={2}
          maxLength={80}
          value={value.name}
          onChange={(e) => onChange({ ...value, name: e.target.value })}
          className={inputClass}
          placeholder="Tote Bags"
        />
      </label>
      <label className="block">
        <FieldLabel>Descripción</FieldLabel>
        <textarea
          rows={3}
          maxLength={1000}
          value={value.description ?? ""}
          onChange={(e) => onChange({ ...value, description: e.target.value || null })}
          className={inputClass}
        />
      </label>
      <label className="block">
        <FieldLabel>Eslogan</FieldLabel>
        <input
          maxLength={160}
          value={value.slogan ?? ""}
          onChange={(e) => onChange({ ...value, slogan: e.target.value || null })}
          className={inputClass}
          placeholder="¡Usá calidad, usá conciencia!"
        />
      </label>
      <OrderAndActive
        order={value.content_order}
        active={value.is_active}
        onChange={(content_order, is_active) => onChange({ ...value, content_order, is_active })}
      />
    </>
  );
}

/** Orden y publicado (compartido por catálogo y línea). */
function OrderAndActive({
  order,
  active,
  onChange,
}: {
  order: number;
  active: boolean;
  onChange: (order: number, active: boolean) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-6">
      <label className="block w-28">
        <FieldLabel>Orden</FieldLabel>
        <input
          type="number"
          min="0"
          step="1"
          value={order}
          onChange={(e) => onChange(Number(e.target.value) || 0, active)}
          className={inputClass}
        />
      </label>
      <label className="inline-flex items-center gap-2 pb-2 text-sm text-gray-700 dark:text-gray-300">
        <input
          type="checkbox"
          checked={active}
          onChange={(e) => onChange(order, e.target.checked)}
          className="h-4 w-4 accent-larioja-azul"
        />
        Publicado en la tienda
      </label>
    </div>
  );
}
