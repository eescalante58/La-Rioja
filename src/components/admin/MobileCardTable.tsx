"use client";

import { useEffect, useRef, type ReactNode } from "react";

interface MobileCardTableProps {
  children: ReactNode;
  /** Clases del contenedor (p. ej. el ancho mínimo de la tabla en escritorio). */
  className?: string;
}

/**
 * Envoltorio para las tablas de detalle del dashboard. En celular
 * (< 640 px, ver `.mobile-card-table` en globals.css) cada fila se muestra
 * como una tarjeta y cada celda como un renglón "Etiqueta: valor"; en
 * escritorio la tabla se ve igual que siempre.
 *
 * La etiqueta de cada celda se copia del encabezado de su columna a
 * `data-label` (y se marcan con `data-card-hide` las celdas sin valor, como
 * las vacías o el "└" de las filas hijas), así no hay que modificar el
 * contenido de las celdas: botones, badges y clics siguen igual. Un
 * MutationObserver vuelve a etiquetar cuando cambian las filas (expandir un
 * grupo, cargar otra página de datos).
 */
export default function MobileCardTable({ children, className }: MobileCardTableProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const applyLabels = () => {
      const table = root.querySelector("table");
      if (!table) return;
      const headers = Array.from(table.querySelectorAll("thead th")).map(
        (th) => th.textContent?.trim() ?? "",
      );
      table.querySelectorAll("tbody tr").forEach((row) => {
        Array.from(row.children).forEach((cell, index) => {
          if (!(cell instanceof HTMLTableCellElement)) return;
          // Celdas que abarcan varias columnas (mensajes de "sin datos") van sin etiqueta.
          const label = cell.colSpan > 1 ? "" : (headers[index] ?? "");
          if (cell.dataset.label !== label) cell.dataset.label = label;

          const text = cell.textContent?.trim() ?? "";
          const hasControl = cell.querySelector("button, a, img, svg") !== null;
          const isEmpty = (text === "" && !hasControl) || text === "└";
          if (isEmpty && !("cardHide" in cell.dataset)) cell.dataset.cardHide = "";
          if (!isEmpty && "cardHide" in cell.dataset) delete cell.dataset.cardHide;
        });
      });
    };

    applyLabels();
    // Solo se observan cambios de nodos y texto: los atributos que escribe
    // applyLabels no vuelven a disparar el observer.
    const observer = new MutationObserver(applyLabels);
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`mobile-card-table ${className ?? ""}`}>
      {children}
    </div>
  );
}
