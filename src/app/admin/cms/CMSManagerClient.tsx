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
  Title,
  Badge,
  Button,
} from "@tremor/react";
import { Edit2, Eye, Plus } from "lucide-react";

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
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title className="text-lg font-bold text-larioja-azul/80 dark:text-larioja-amarillo/80">
            Gestión de Contenido (CMS)
          </Title>
          <Text className="text-xs">
            Administra el contenido dinámico de la landing page y secciones.
          </Text>
        </div>
        <Button icon={Plus} color="blue" size="sm">
          Nueva Sección
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <Table>
          <TableHead className="bg-gray-50 dark:bg-gray-900">
            <TableRow>
              <TableHeaderCell>Página</TableHeaderCell>
              <TableHeaderCell>Sección</TableHeaderCell>
              <TableHeaderCell>Título / Descripción</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {initialContent?.map((item) => (
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
                    <Button variant="light" icon={Eye} size="xs" color="gray" />
                    <Link href={`/admin/cms/${item.id}`}>
                      <Button
                        variant="light"
                        icon={Edit2}
                        size="xs"
                        color="blue"
                      />
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
