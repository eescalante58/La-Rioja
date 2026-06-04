"use client";

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
import { Edit2, Trash2 } from "lucide-react";

interface FAQSection {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  content_order: number;
}

interface FAQSectionTableProps {
  sections: FAQSection[];
  onEdit: (section: FAQSection) => void;
  onDelete: (section: FAQSection) => void;
}

export default function FAQSectionTable({
  sections,
  onEdit,
  onDelete,
}: FAQSectionTableProps) {
  return (
    <Card className="p-0 overflow-hidden shadow-sm sm:shadow-md border-gray-200 dark:border-gray-800 transition-all duration-300">
      <Table>
        <TableHead className="bg-gray-50 dark:bg-gray-900">
          <TableRow>
            <TableHeaderCell>Orden</TableHeaderCell>
            <TableHeaderCell>Título</TableHeaderCell>
            <TableHeaderCell>Descripción</TableHeaderCell>
            <TableHeaderCell>Estado</TableHeaderCell>
            <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sections.map((section) => (
            <TableRow
              key={section.id}
              className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
            >
              <TableCell>
                <Badge color="amber" size="xs">
                  {section.content_order}
                </Badge>
              </TableCell>
              <TableCell>
                <Text className="font-bold">{section.title}</Text>
              </TableCell>
              <TableCell>
                <Text className="text-xs text-gray-400 truncate max-w-xs">
                  {section.description || "Sin descripción"}
                </Text>
              </TableCell>
              <TableCell>
                <Badge color={section.is_active ? "emerald" : "rose"}>
                  {section.is_active ? "Activa" : "Inactiva"}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="light"
                    icon={Edit2}
                    size="xs"
                    color="blue"
                    onClick={() => onEdit(section)}
                  />
                  <Button
                    variant="light"
                    icon={Trash2}
                    size="xs"
                    color="rose"
                    onClick={() => onDelete(section)}
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
