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

interface CMSTableProps {
  content: any[];
  onView: (item: any) => void;
  onDelete: (item: any) => void;
  pageFilter: string;
  searchFilter: string;
}

export default function CMSTable({
  content,
  onView,
  onDelete,
  pageFilter,
  searchFilter,
}: CMSTableProps) {
  return (
    <Card className="p-0 overflow-hidden shadow-md border-gray-200 dark:border-gray-800 transition-all duration-300">
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
                <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {content?.map((item) => (
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
                    <Text className="font-mono text-xs">{item.section_key}</Text>
                  </TableCell>
                  <TableCell>
                    <Badge color="amber" size="xs">
                      {item.content_order}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {item.metadata && Object.keys(item.metadata).length > 0 ? (
                      <div className="flex gap-1 flex-wrap max-w-[200px]">
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
                        onClick={() => onView(item)}
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
                        onClick={() => onDelete(item)}
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
  );
}
