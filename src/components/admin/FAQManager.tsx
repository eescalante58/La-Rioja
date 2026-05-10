"use client";

import React, { useState } from "react";
import {
  TabGroup,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
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
  Select,
  SelectItem,
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
  LayoutGrid,
} from "lucide-react";
import {
  createFAQ,
  updateFAQ,
  deleteFAQ,
  createFAQSection,
  updateFAQSection,
  deleteFAQSection,
} from "@/app/admin/cms/actions";

interface FAQSection {
  id: string;
  title: string;
  description: string | null;
  is_active: boolean;
  content_order: number;
}

interface FAQ {
  id: string;
  question: string;
  answer: string;
  section_id: string | null;
  is_active: boolean;
  content_order: number;
  faq_sections?: { title: string };
}

interface FAQManagerProps {
  initialFaqs: FAQ[];
  faqSections: FAQSection[];
}

/**
 * FAQ Manager component for the CMS admin dashboard.
 * @param {FAQManagerProps} props - Component props.
 * @returns {JSX.Element} The FAQ management interface.
 */
export default function FAQManager({
  initialFaqs,
  faqSections,
}: FAQManagerProps) {
  const [faqs] = useState<FAQ[]>(initialFaqs);
  const [sections] = useState<FAQSection[]>(faqSections);

  // FAQ Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<FAQ | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Section Modal states
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<FAQSection | null>(
    null,
  );
  const [isSectionDeleteOpen, setIsSectionDeleteOpen] = useState(false);

  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    question: "",
    answer: "",
    section_id: "",
    is_active: true,
    content_order: 0,
  });

  const [sectionFormData, setSectionFormData] = useState({
    title: "",
    description: "",
    is_active: true,
    content_order: 0,
  });

  const toggleFaq = (id: string) => {
    setOpenFaqId(openFaqId === id ? null : id);
  };

  const openModal = (faq?: FAQ) => {
    if (faq) {
      setSelectedFaq(faq);
      setFormData({
        question: faq.question,
        answer: faq.answer,
        section_id: faq.section_id || "",
        is_active: faq.is_active,
        content_order: faq.content_order,
      });
    } else {
      setSelectedFaq(null);
      setFormData({
        question: "",
        answer: "",
        section_id: sections[0]?.id || "",
        is_active: true,
        content_order: faqs.length,
      });
    }
    setIsModalOpen(true);
  };

  const openSectionModal = (section?: FAQSection) => {
    if (section) {
      setSelectedSection(section);
      setSectionFormData({
        title: section.title,
        description: section.description || "",
        is_active: section.is_active,
        content_order: section.content_order,
      });
    } else {
      setSelectedSection(null);
      setSectionFormData({
        title: "",
        description: "",
        is_active: true,
        content_order: sections.length,
      });
    }
    setIsSectionModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const submitData = new FormData();
      submitData.append("question", formData.question);
      submitData.append("answer", formData.answer);
      submitData.append("section_id", formData.section_id);
      submitData.append("is_active", String(formData.is_active));
      submitData.append("content_order", String(formData.content_order));

      let result;
      if (selectedFaq) {
        result = await updateFAQ(selectedFaq.id, submitData);
      } else {
        result = await createFAQ(submitData);
      }

      if (result.success) {
        window.location.reload();
      } else {
        alert("Error al guardar FAQ: " + result.error);
      }
    } catch (error) {
      alert("Error inesperado al guardar FAQ.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSectionSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const submitData = new FormData();
      submitData.append("title", sectionFormData.title);
      submitData.append("description", sectionFormData.description);
      submitData.append("is_active", String(sectionFormData.is_active));
      submitData.append("content_order", String(sectionFormData.content_order));

      let result;
      if (selectedSection) {
        result = await updateFAQSection(selectedSection.id, submitData);
      } else {
        result = await createFAQSection(submitData);
      }

      if (result.success) {
        window.location.reload();
      } else {
        alert("Error al guardar sección: " + result.error);
      }
    } catch (error) {
      alert("Error inesperado al guardar sección.");
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
        window.location.reload();
      } else {
        alert("Error al eliminar FAQ: " + result.error);
      }
    } catch (error) {
      alert("Error inesperado al eliminar FAQ.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSectionDelete = async () => {
    if (!selectedSection) return;
    setIsDeleting(true);
    try {
      const result = await deleteFAQSection(selectedSection.id);
      if (result.success) {
        window.location.reload();
      } else {
        alert("Error al eliminar sección: " + result.error);
      }
    } catch (error) {
      alert("Error inesperado al eliminar sección.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <TabGroup>
        <TabList variant="solid" color="zinc" className="mb-4">
          <Tab icon={HelpCircle}>Preguntas</Tab>
          <Tab icon={LayoutGrid}>Secciones</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {/* Gestión de Preguntas */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Title className="text-lg font-bold text-larioja-azul/80 dark:text-larioja-amarillo/80">
                    Preguntas Frecuentes
                  </Title>
                </div>
                <Button
                  icon={Plus}
                  color="blue"
                  size="sm"
                  onClick={() => openModal()}
                >
                  Nueva Pregunta
                </Button>
              </div>

              <Card className="p-0 overflow-hidden shadow-xl border-gray-200 dark:border-gray-800">
                <Table>
                  <TableHead className="bg-gray-50 dark:bg-gray-900">
                    <TableRow>
                      <TableHeaderCell>Orden</TableHeaderCell>
                      <TableHeaderCell>Sección</TableHeaderCell>
                      <TableHeaderCell>Pregunta</TableHeaderCell>
                      <TableHeaderCell>Estado</TableHeaderCell>
                      <TableHeaderCell className="text-right">
                        Acciones
                      </TableHeaderCell>
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
                                icon={
                                  openFaqId === faq.id ? ChevronUp : ChevronDown
                                }
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
            </div>
          </TabPanel>

          <TabPanel>
            {/* Gestión de Secciones */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <Title className="text-lg font-bold text-larioja-azul/80 dark:text-larioja-amarillo/80">
                    Secciones de FAQ
                  </Title>
                </div>
                <Button
                  icon={Plus}
                  color="blue"
                  size="sm"
                  onClick={() => openSectionModal()}
                >
                  Nueva Sección
                </Button>
              </div>

              <Card className="p-0 overflow-hidden shadow-xl border-gray-200 dark:border-gray-800">
                <Table>
                  <TableHead className="bg-gray-50 dark:bg-gray-900">
                    <TableRow>
                      <TableHeaderCell>Orden</TableHeaderCell>
                      <TableHeaderCell>Título</TableHeaderCell>
                      <TableHeaderCell>Descripción</TableHeaderCell>
                      <TableHeaderCell>Estado</TableHeaderCell>
                      <TableHeaderCell className="text-right">
                        Acciones
                      </TableHeaderCell>
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
                              onClick={() => openSectionModal(section)}
                            />
                            <Button
                              variant="light"
                              icon={Trash2}
                              size="xs"
                              color="rose"
                              onClick={() => {
                                setSelectedSection(section);
                                setIsSectionDeleteOpen(true);
                              }}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>
          </TabPanel>
        </TabPanels>
      </TabGroup>

      {/* Modal FAQ */}
      <Dialog
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        static={true}
      >
        <DialogPanel className="max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <Title>{selectedFaq ? "Editar Pregunta" : "Nueva Pregunta"}</Title>
            <Button
              variant="light"
              icon={XIcon}
              onClick={() => setIsModalOpen(false)}
            />
          </div>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">
                Sección
              </Text>
              <Select
                value={formData.section_id}
                onValueChange={(val) =>
                  setFormData({ ...formData, section_id: val })
                }
                required
              >
                {sections.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">
                Pregunta
              </Text>
              <TextInput
                value={formData.question}
                onChange={(e) =>
                  setFormData({ ...formData, question: e.target.value })
                }
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
                {selectedFaq ? "Guardar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </Dialog>

      {/* Modal Sección */}
      <Dialog
        open={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        static={true}
      >
        <DialogPanel className="max-w-2xl">
          <div className="flex justify-between items-center mb-6">
            <Title>
              {selectedSection ? "Editar Sección" : "Nueva Sección"}
            </Title>
            <Button
              variant="light"
              icon={XIcon}
              onClick={() => setIsSectionModalOpen(false)}
            />
          </div>
          <form onSubmit={handleSectionSave} className="space-y-4">
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">
                Título
              </Text>
              <TextInput
                value={sectionFormData.title}
                onChange={(e) =>
                  setSectionFormData({
                    ...sectionFormData,
                    title: e.target.value,
                  })
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Text className="text-xs font-bold uppercase text-gray-500">
                Descripción
              </Text>
              <TextInput
                value={sectionFormData.description}
                onChange={(e) =>
                  setSectionFormData({
                    ...sectionFormData,
                    description: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase text-gray-500">
                  Orden
                </Text>
                <TextInput
                  type="number"
                  value={sectionFormData.content_order.toString()}
                  onChange={(e) =>
                    setSectionFormData({
                      ...sectionFormData,
                      content_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <Switch
                  checked={sectionFormData.is_active}
                  onChange={(checked) =>
                    setSectionFormData({
                      ...sectionFormData,
                      is_active: checked,
                    })
                  }
                />
                <Text className="text-sm">
                  {sectionFormData.is_active ? "Activa" : "Inactiva"}
                </Text>
              </div>
            </div>
            <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
              <Button
                variant="secondary"
                onClick={() => setIsSectionModalOpen(false)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                icon={Save}
                loading={isSaving}
                onClick={handleSectionSave}
              >
                {selectedSection ? "Guardar" : "Crear"}
              </Button>
            </div>
          </form>
        </DialogPanel>
      </Dialog>

      {/* Modal Eliminación FAQ */}
      <Dialog
        open={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        static={true}
      >
        <DialogPanel className="max-w-sm">
          <Title className="text-rose-600">¿Eliminar esta pregunta?</Title>
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

      {/* Modal Eliminación Sección */}
      <Dialog
        open={isSectionDeleteOpen}
        onClose={() => setIsSectionDeleteOpen(false)}
        static={true}
      >
        <DialogPanel className="max-w-sm">
          <Title className="text-rose-600">¿Eliminar esta sección?</Title>
          <Text className="mt-2 text-sm">
            Se eliminará la sección. Las preguntas asociadas quedarán sin
            sección.
          </Text>
          <div className="mt-6 flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsSectionDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancelar
            </Button>
            <Button
              color="rose"
              onClick={handleSectionDelete}
              loading={isDeleting}
            >
              Eliminar
            </Button>
          </div>
        </DialogPanel>
      </Dialog>
    </div>
  );
}
