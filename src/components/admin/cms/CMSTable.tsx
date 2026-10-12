"use client";

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
import { Eye, Edit2, Trash2 } from "lucide-react";
import type { SiteContent } from "@/types/cms";

interface CMSTableProps {
  content: SiteContent[];
  onView: (item: SiteContent) => void;
  onDelete: (item: SiteContent) => void;
  pageFilter: string;
  searchFilter: string;
}

/** Encabezado fijo: sticky en cada th (no en thead) para que funcione
 *  en todos los navegadores dentro del contenedor con scroll. */
const HEADER_CELL_CLASS =
  "sticky top-0 z-10 bg-gray-50 dark:bg-gray-900 px-3 shadow-[inset_0_-1px_0] shadow-gray-200 dark:shadow-gray-800";

/** Celdas más compactas que el p-4 por defecto de Tremor para que las
 *  siete columnas (incluidas Estado y Acciones) quepan al 100 % de zoom. */
const CELL_CLASS = "px-3 py-3";

/**
 * Tabla de secciones del CMS. El wrapper `overflow-auto` de Tremor `<Table>`
 * es el contenedor de scroll (vertical y horizontal): el `max-h` va ahí para
 * que el encabezado quede fijo mientras se desplazan las filas.
 */
export default function CMSTable({
  content,
  onView,
  onDelete,
  pageFilter,
  searchFilter,
}: CMSTableProps) {
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
          {content?.map((item) => (
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
                    href={`/admin/cms/${item.id}?page=${pageFilter}&search=${searchFilter}`}
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
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
