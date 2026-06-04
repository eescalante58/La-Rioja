"use client";

import React from "react";
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
import { ChevronDown, ChevronUp, Edit2, Trash2 } from "lucide-react";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  section_id: string | null;
  is_active: boolean;
  content_order: number;
  faq_sections?: { title: string };
}

interface FAQTableProps {
  faqs: FAQ[];
  openFaqId: string | null;
  onToggle: (id: string) => void;
  onEdit: (faq: FAQ) => void;
  onDelete: (faq: FAQ) => void;
}

export default function FAQTable({
  faqs,
  openFaqId,
  onToggle,
  onEdit,
  onDelete,
}: FAQTableProps) {
  return (
    <Card className="p-0 overflow-hidden shadow-sm sm:shadow-md border-gray-200 dark:border-gray-800 transition-all duration-300">
      <Table>
        <TableHead className="bg-gray-50 dark:bg-gray-900">
          <TableRow>
            <TableHeaderCell>Orden</TableHeaderCell>
            <TableHeaderCell>Sección</TableHeaderCell>
            <TableHeaderCell>Pregunta</TableHeaderCell>
            <TableHeaderCell>Estado</TableHeaderCell>
            <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {faqs.map((faq) => (
            <React.Fragment key={faq.id}>
              <TableRow className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                <TableCell>
                  <Badge color="amber" size="xs">
                    {faq.content_order}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge color="gray" size="xs">
                    {faq.faq_sections?.title || "Sin sección"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Text className="font-medium max-w-xs truncate">
                    {faq.question}
                  </Text>
                </TableCell>
                <TableCell>
                  <Badge color={faq.is_active ? "emerald" : "rose"}>
                    {faq.is_active ? "Activa" : "Inactiva"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="light"
                      icon={openFaqId === faq.id ? ChevronUp : ChevronDown}
                      size="xs"
                      color="gray"
                      onClick={() => onToggle(faq.id)}
                    />
                    <Button
                      variant="light"
                      icon={Edit2}
                      size="xs"
                      color="blue"
                      onClick={() => onEdit(faq)}
                    />
                    <Button
                      variant="light"
                      icon={Trash2}
                      size="xs"
                      color="rose"
                      onClick={() => onDelete(faq)}
                    />
                  </div>
                </TableCell>
              </TableRow>
              {openFaqId === faq.id && (
                <TableRow className="bg-blue-50/30 dark:bg-blue-900/10">
                  <TableCell colSpan={5}>
                    <div className="p-4 space-y-2">
                      <Text className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">
                        Respuesta Completa:
                      </Text>
                      <Text className="text-sm whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                        {faq.answer}
                      </Text>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
