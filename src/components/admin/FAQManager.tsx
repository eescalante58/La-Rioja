"use client";

import React, { useState } from "react";
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
  Dialog,
  DialogPanel,
  TextInput,
  Switch,
  Flex,
} from "@tremor/react";
import {
  Edit2,
  Plus,
  Trash2,
  X as XIcon,
  Save,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { createFAQ, updateFAQ, deleteFAQ } from "@/app/admin/cms/actions";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  is_active: boolean;
  content_order: number;
}

interface FAQManagerProps {
  initialFaqs: FAQ[];
}

/**
 * FAQ Manager component for the CMS admin dashboard.
 * @param {FAQManagerProps} props - Component props.
 * @returns {JSX.Element} The FAQ management interface.
 */
export default function FAQManager({ initialFaqs }: FAQManagerProps) {
  const [faqs, setFaqs] = useState<FAQ[]>(initialFaqs);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    is_active: true,
    content_order: 0,
  });

  const openModal = (faq?: FAQ) => {
    if (faq) {
      setSelectedFaq(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        is_active: faq.is_active,
        content_order: faq.content_order,
      });
    } else {
      setSelectedFaq(null);
      setFormData({
        question: "",
        answer: "",
        is_active: true,
        content_order: faqs.length,
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const submitData = new FormData();
      submitData.append("question", formData.question);
      submitData.append("answer", formData.answer);
      submitData.append("is_active", String(formData.is_active));
      submitData.append("content_order", String(formData.content_order));

      let result;
      if (selectedFaq) {
        result = await updateFAQ(selectedFaq.id, submitData);
      } else {
        result = await createFAQ(submitData);
      }

      if (result.success) {
        setIsModalOpen(false);
        // La página se recargará automáticamente por el revalidatePath en el action
        window.location.reload();
      } else {
        alert("Error al guardar: " + result.error);
      }
    } catch (error) {
      alert("Error inesperado al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedFaq) return;
    setIsDeleting(true);
    try {
      const result = await deleteFAQ(selectedFaq.id);
      if (result.success) {
        setIsDeleteOpen(false);
        window.location.reload();
      } else {
        alert("Error al eliminar: " + result.error);
      }
    } catch (error) {
      alert("Error inesperado al eliminar.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Title className="text-lg font-bold text-larioja-azul/80 dark:text-larioja-amarillo/80">
            Gestión de FAQs
          </Title>
          <Text className="text-xs">
            Administra las preguntas frecuentes que se muestran en la landing
            page.
          </Text>
        </div>
        <Button icon={Plus} color="blue" size="sm" onClick={() => openModal()}>
          Nueva FAQ
        </Button>
      </div>

      <Card className="p-0 overflow-hidden shadow-xl border-gray-200 dark:border-gray-800">
        <Table>
          <TableHead className="bg-gray-50 dark:bg-gray-900">
            <TableRow>
              <TableHeaderCell>Orden</TableHeaderCell>
              <TableHeaderCell>Pregunta</TableHeaderCell>
              <TableHeaderCell>Respuesta</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {faqs.map((faq) => (
              <TableRow
                key={faq.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
              >
                <TableCell>
                  <Badge color="amber" size="xs">
                    {faq.content_order}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Text className="font-medium max-w-xs truncate">
                    {faq.question}
                  </Text>
                </TableCell>
                <TableCell>
                  <Text className="text-xs text-gray-400 max-w-md truncate">
                    {faq.answer}
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
                      onClick={() => toggleFaq(faq.id)}
                    />
                    <Button
                      variant="light"
                      icon={Edit2}
                      size="xs"
                      color="blue"
                      onClick={() => openModal(faq)}
                    />
                    <Button
                      variant="light"
                      icon={Trash2}
                      size="xs"
                      color="rose"
                      onClick={() => {
                        setSelectedFaq(faq);
                        setIsDeleteOpen(true);
                      }}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {faqs.map(
              (faq) =>
                openFaqId === faq.id && (
                  <TableRow
                    key={`${faq.id}-detail`}
                    className="bg-blue-50/30 dark:bg-blue-900/10"
                  >
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
                ),
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Modal de Crear/Editar */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        static={true}
      >
        <DialogPanel className="max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <Title>{selectedFaq ? "Editar FAQ" : "Nueva FAQ"}</Title>
            <Button
              variant="light"
              icon={XIcon}
              onClick={() => setIsModalOpen(false)}
            />
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">
                Pregunta
              </Text>
              <TextInput
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
                placeholder="Escribe la pregunta aquí..."
                required
              />
            </div>

            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">
                Respuesta
              </Text>
              <textarea
                value={formData.answer}
                onChange={(e) =>
                  setFormData({ ...formData, answer: e.target.value })
                }
                rows={5}
                className="w-full p-3 text-sm bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-y"
                placeholder="Escribe la respuesta aquí..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">
                  Orden
                </Text>
                <TextInput
                  type="number"
                  value={formData.content_order.toString()}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      content_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={formData.is_active}
                  onChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
                <Text className="text-sm">
                  {formData.is_active ? "Activa" : "Inactiva"}
                </Text>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button icon={Save} loading={isSaving} onClick={handleSave}>
                {selectedFaq ? "Guardar Cambios" : "Crear FAQ"}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </Dialog>

      {/* Modal de Eliminación */}
      <Dialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        static={true}
      >
        <DialogPanel className="max-w-sm">
          <Title className="text-rose-600">¿Eliminar esta FAQ?</Title>
          <Text className="mt-2 text-sm">
            Esta acción no se puede deshacer.
          </Text>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button color="rose" onClick={handleDelete} loading={isDeleting}>
              Eliminar
            </Button>
          </div>
        </DialogPanel>
      </Dialog>
    </div>
  );
}
