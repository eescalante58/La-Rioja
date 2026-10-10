"use client";

import { useRef, useState } from "react";
import { FileText, Loader2, Trash2, Upload } from "lucide-react";
import { callAction } from "@/lib/action-client";
import { createClient } from "@/lib/supabase/client";
import { CATALOG_PDF_MAX_BYTES, formatBytes, type ProductCatalog } from "@/lib/validation/products";
import { ErrorBox, type Result } from "./shared";

const PDF_BUCKET = "product_catalog_pdfs";

const dateFormatter = new Intl.DateTimeFormat("es-SV", {
  dateStyle: "medium",
  timeZone: "America/El_Salvador",
});

interface CatalogPdfRowProps {
  catalog: ProductCatalog;
  /** Catálogo actualizado tras subir o quitar el PDF. */
  onUpdated: (catalog: ProductCatalog) => void;
}

/**
 * Fila «Catálogo en PDF» de un catálogo: subir, reemplazar o quitar el PDF
 * descargable en la tienda. El archivo se sube directo del navegador a
 * Storage con una URL firmada (no pasa por Vercel, que limita a ~4.5 MB).
 */
export function CatalogPdfRow({ catalog, onUpdated }: CatalogPdfRowProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = status !== null;

  const upload = async (file: File) => {
    setError(null);
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("El archivo debe ser un PDF.");
      return;
    }
    if (file.size > CATALOG_PDF_MAX_BYTES) {
      setError(`El PDF pesa ${formatBytes(file.size)}; el máximo es 50 MB.`);
      return;
    }

    setStatus(`Subiendo… (${formatBytes(file.size)})`);
    let path: string | null = null;
    try {
      const prep = await callAction<Result<{ path: string; token: string }>>(
        "productos.createCatalogPdfUpload",
        [catalog.id, file.name, file.size],
      );
      if (!prep.success || !prep.data) {
        setError(prep.success ? "Respuesta inválida del servidor." : prep.error);
        return;
      }
      path = prep.data.path;

      const { error: uploadError } = await createClient()
        .storage.from(PDF_BUCKET)
        .uploadToSignedUrl(prep.data.path, prep.data.token, file, {
          contentType: "application/pdf",
        });
      if (uploadError) {
        setError(`No se pudo subir el PDF: ${uploadError.message}`);
        return;
      }

      setStatus("Guardando…");
      const res = await callAction<Result<ProductCatalog>>("productos.setCatalogPdf", [
        catalog.id,
        prep.data.path,
      ]);
      if (!res.success || !res.data) {
        setError(res.success ? "Respuesta inválida del servidor." : res.error);
        await callAction("productos.discardCatalogPdfUpload", [catalog.id, prep.data.path]);
        return;
      }
      path = null;
      onUpdated(res.data);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
      if (path)
        await callAction("productos.discardCatalogPdfUpload", [catalog.id, path]).catch(() => {});
    } finally {
      setStatus(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async () => {
    if (!confirm(`¿Quitar el PDF del catálogo «${catalog.name}»? Dejará de poder descargarse.`))
      return;
    setError(null);
    setStatus("Quitando…");
    try {
      const res = await callAction<Result<ProductCatalog>>("productos.removeCatalogPdf", [
        catalog.id,
      ]);
      if (res.success && res.data) onUpdated(res.data);
      else setError(res.success ? "Respuesta inválida del servidor." : res.error);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setStatus(null);
    }
  };

  const btn =
    "inline-flex items-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-700 px-3 py-1.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50";

  return (
    <div className="space-y-2 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <FileText size={18} className="text-red-600 shrink-0" />
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold text-gray-900 dark:text-white">Catálogo en PDF</p>
          {catalog.pdf_url ? (
            <a
              href={catalog.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-larioja-azul dark:text-larioja-amarillo hover:underline"
            >
              Ver PDF · {formatBytes(catalog.pdf_size_bytes)}
              {catalog.pdf_updated_at &&
                ` · subido el ${dateFormatter.format(new Date(catalog.pdf_updated_at))}`}
            </a>
          ) : (
            <p className="text-xs text-gray-500">
              Sin PDF: en la tienda no aparece el botón de descarga.
            </p>
          )}
        </div>
        {busy ? (
          <span className="inline-flex items-center gap-2 text-xs text-gray-500">
            <Loader2 size={14} className="animate-spin" />
            {status}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => inputRef.current?.click()} className={btn}>
              <Upload size={14} />
              {catalog.pdf_url ? "Reemplazar" : "Subir PDF"}
            </button>
            {catalog.pdf_url && (
              <button
                type="button"
                onClick={remove}
                className={`${btn} hover:!bg-red-50 hover:text-red-600 dark:hover:!bg-red-950/40`}
              >
                <Trash2 size={14} />
                Quitar
              </button>
            )}
          </div>
        )}
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </div>
      <ErrorBox message={error} />
    </div>
  );
}
