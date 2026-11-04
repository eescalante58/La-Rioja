"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Card,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Text,
  Badge,
  Button,
} from "@tremor/react";
import { Eye, Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import type { SiteContent } from "@/types/cms";

interface CMSTableProps {
  content: SiteContent[];
  onView: (item: SiteContent) => void;
  onDelete: (item: SiteContent) => void;
  pageFilter: string;
  searchFilter: string;
  statusFilter?: string;
}

const PAGE_SIZE = 20;

/** Encabezado fijo: sticky en cada th (no en thead) para que funcione
 *  en todos los navegadores dentro del contenedor con scroll. */
const HEADER_CELL_CLASS =
  "sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 px-3 shadow-[inset_0_-1px_0] shadow-gray-200 dark:shadow-gray-800";

/** Celdas más compactas que el p-4 por defecto de Tremor para que las
 *  siete columnas (incluidas Estado y Acciones) quepan al 100 % de zoom. */
const CELL_CLASS = "px-3 py-3";

/**
 * Tabla de secciones del CMS con paginación de cliente para óptimo rendimiento en el DOM.
 */
export default function CMSTable({
  content,
  onView,
  onDelete,
  pageFilter,
  searchFilter,
  statusFilter,
}: CMSTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reiniciar a la primera página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [pageFilter, searchFilter, statusFilter]);

  const totalItems = content?.length || 0;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  const paginatedContent = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return (content || []).slice(start, start + PAGE_SIZE);
  }, [content, currentPage]);

  const startRecord = totalItems === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endRecord = Math.min(currentPage * PAGE_SIZE, totalItems);

  return (
    <Card className="p-0 overflow-hidden shadow-md border-gray-200 dark:border-gray-800 transition-all duration-300">
      <Table className="max-h-[70vh]">
        <TableHead>
          <TableRow>
            <TableHeaderCell className={HEADER_CELL_CLASS}>Página</TableHeaderCell>
            <TableHeaderCell className={HEADER_CELL_CLASS}>Sección</TableHeaderCell>
            <TableHeaderCell className={`${HEADER_CELL_CLASS} text-center`}>Orden</TableHeaderCell>
            <TableHeaderCell className={HEADER_CELL_CLASS}>Metadata</TableHeaderCell>
            <TableHeaderCell className={`${HEADER_CELL_CLASS} w-full`}>
              Título / Descripción
            </TableHeaderCell>
            <TableHeaderCell className={HEADER_CELL_CLASS}>Estado</TableHeaderCell>
            <TableHeaderCell className={`${HEADER_CELL_CLASS} text-right`}>
              Acciones
            </TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {paginatedContent.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-12 text-gray-400">
                No se encontraron secciones con los filtros aplicados.
              </TableCell>
            </TableRow>
          ) : (
            paginatedContent.map((item) => (
              <TableRow
                key={item.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <TableCell className={CELL_CLASS}>
                  <Badge color="gray" size="xs" className="uppercase">
                    {item.page}
                  </Badge>
                </TableCell>
                <TableCell className={CELL_CLASS}>
                  <Text className="font-mono text-xs truncate max-w-[180px]" title={item.section_key}>
                    {item.section_key}
                  </Text>
                </TableCell>
                <TableCell className={`${CELL_CLASS} text-center`}>
                  <Badge color="amber" size="xs">
                    {item.content_order}
                  </Badge>
                </TableCell>
                <TableCell className={CELL_CLASS}>
                  {item.metadata && Object.keys(item.metadata).length > 0 ? (
                    <div className="flex gap-1 flex-wrap max-w-[160px]">
                      {Object.keys(item.metadata).map((key) => (
                        <Badge key={key} size="xs" color="blue">
                          {key}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <Text className="text-xs italic text-gray-400">Ninguno</Text>
                  )}
                </TableCell>
                <TableCell className={`${CELL_CLASS} max-w-0 min-w-[200px]`}>
                  <Text className="font-medium truncate" title={item.title || undefined}>
                    {item.title || "Sin título"}
                  </Text>
                  <Text
                    className="text-xs truncate text-gray-400"
                    title={item.description || undefined}
                  >
                    {item.description || "Sin descripción"}
                  </Text>
                </TableCell>
                <TableCell className={CELL_CLASS}>
                  <Badge color={item.is_active ? "emerald" : "rose"} size="xs">
                    {item.is_active ? "Activo" : "Inactivo"}
                  </Badge>
                </TableCell>
                <TableCell className={`${CELL_CLASS} text-right`}>
                  <div className="flex justify-end gap-1">
                    <Button
                      variant="light"
                      icon={Eye}
                      size="xs"
                      color="gray"
                      onClick={() => onView(item)}
                      title="Ver"
                    />
                    <Link
                      href={`/admin/cms/${item.id}?page=${pageFilter}&search=${searchFilter}&status=${statusFilter || "all"}`}
                      title="Editar"
                    >
                      <Button variant="light" icon={Edit2} size="xs" color="blue" />
                    </Link>
                    <Button
                      variant="light"
                      icon={Trash2}
                      size="xs"
                      color="rose"
                      onClick={() => onDelete(item)}
                      title="Eliminar"
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Barra de paginación */}
      {totalItems > PAGE_SIZE && (
        <div className="flex flex-col sm:flex-row justify-between items-center px-4 py-3 border-t border-gray-150 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 gap-3">
          <Text className="text-xs text-gray-500 dark:text-gray-400">
            Mostrando <span className="font-semibold">{startRecord}</span> - <span className="font-semibold">{endRecord}</span> de <span className="font-semibold">{totalItems}</span> secciones
          </Text>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="xs"
              icon={ChevronLeft}
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="text-xs"
            >
              Anterior
            </Button>
            <span className="text-xs font-semibold px-2 text-gray-600 dark:text-gray-300">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="secondary"
              size="xs"
              icon={ChevronRight}
              iconPosition="right"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="text-xs"
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
