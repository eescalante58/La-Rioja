"use client";

import { useState, useMemo, useEffect } from "react";
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
  Button,
  TextInput,
  Dialog,
  DialogPanel,
  Badge,
  Flex,
} from "@tremor/react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowLeft,
  GraduationCap,
  User,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  Ticket as TicketIcon,
  Eye,
  Calendar,
  CreditCard,
  Hash,
  DollarSign,
  UserCircle,
  Mail,
  Phone as PhoneIcon,
  FileText,
} from "lucide-react";
import Link from "next/link";
import {
  saveStudent,
  deleteStudent,
  importStudents,
  logExportActivity,
  getStudentCards,
  assignCardToStudent,
  unassignCardFromStudent,
  bulkAssignCards,
  getAllAssignedCards,
} from "./actions";

interface Student {
  id: number;
  student_id: number;
  student_name: string;
  student_level: string;
  company_id: number;
  event_id: string;
  cards_count?: number;
  event?: { event_name: string } | null;
}

interface Event {
  company_id: number;
  event_id: string;
  event_name: string;
}

/**
 * Client component for managing students.
 */
export default function StudentManagerClient({
  initialData,
  events,
}: {
  initialData: any[];
  events: Event[];
}) {
  const [students, setStudents] = useState<Student[]>(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(false);
  const [isCardsDialogOpen, setIsCardsDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentCards, setStudentCards] = useState<any[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [loadingCards, setLoadingCards] = useState(false);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignMode, setAssignDialogOpen] = useState<"single" | "bulk">(
    "single",
  );
  const [assignFormLoading, setAssignFormLoading] = useState(false);
  const [quickCardNumber, setQuickCardNumber] = useState("");
  const [isProcessingAssignment, setIsProcessingAssignment] = useState(false);

  // Sync state if initialData changes
  useEffect(() => {
    if (initialData) {
      setStudents(initialData);
    }
  }, [initialData]);

  const filteredStudents = useMemo(() => {
    const search = searchTerm.toLowerCase().trim();
    if (!search) {
      return [...students].sort((a, b) =>
        a.student_name.localeCompare(b.student_name),
      );
    }

    return students
      .filter((s) => {
        const name = (s.student_name || "").toLowerCase();
        const id = (s.student_id || "").toString().toLowerCase();
        const level = (s.student_level || "").toLowerCase();
        const eventName = (s.event?.event_name || "").toLowerCase();

        return (
          name.includes(search) ||
          id.includes(search) ||
          level.includes(search) ||
          eventName.includes(search)
        );
      })
      .sort((a, b) => a.student_name.localeCompare(b.student_name));
  }, [searchTerm, students]);

  const handleOpenDialog = (student: Student | null = null) => {
    setEditingStudent(student);
    setIsDialogOpen(true);
  };

  const handleDownloadJSON = async () => {
    const dataStr = JSON.stringify(students, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "alumnos.json";
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();

    await logExportActivity(students.length);
  };

  const handleDownloadCSV = async () => {
    const headers = [
      "student_id",
      "student_name",
      "student_level",
      "company_id",
      "event_id",
    ];
    const rows = students.map((s) => [
      s.student_id,
      s.student_name,
      s.student_level,
      s.company_id,
      s.event_id,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "alumnos.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    await logExportActivity(students.length);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const isCsv = file.name.endsWith(".csv");

    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        let content = "";

        // Try UTF-8 first
        const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
        try {
          content = utf8Decoder.decode(buffer);
        } catch (e) {
          // If UTF-8 fails, try ISO-8859-1 (Common in Spanish Excel CSVs)
          const latinDecoder = new TextDecoder("iso-8859-1");
          content = latinDecoder.decode(buffer);
        }

        let data: any[] = [];

        if (isCsv) {
          const lines = content.split(/\r?\n/);
          if (lines.length < 2) throw new Error("El archivo CSV está vacío");

          const headers = lines[0]
            .split(",")
            .map((h) => h.trim().toLowerCase());
          data = lines
            .slice(1)
            .filter((line) => line.trim())
            .map((line) => {
              const values = line.split(",");
              const obj: any = {};
              headers.forEach((header, index) => {
                let val = values[index]?.trim();
                // Map user-friendly headers to db columns if necessary
                if (header === "id alumno") header = "student_id";

                if (header === "student_id" || header === "company_id") {
                  obj[header] = parseInt(val) || 0;
                } else {
                  obj[header] = val;
                }
              });
              return obj;
            });
        } else {
          data = JSON.parse(content);
          if (!Array.isArray(data))
            throw new Error("El archivo JSON debe ser un array");
        }

        if (data.length === 0)
          throw new Error("No se encontraron datos para importar");

        setLoading(true);
        const result = await importStudents(data);
        if (result.success) {
          alert("Importación exitosa de " + data.length + " alumnos");
          window.location.reload();
        } else {
          alert("Error en la importación: " + result.error);
        }
      } catch (err) {
        alert("Error al procesar el archivo: " + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset input so the same file can be uploaded again
    e.target.value = "";
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await saveStudent(formData);

    if (result.success) {
      window.location.reload();
    } else {
      alert("Error: " + result.error);
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (confirm("¿Estás seguro de eliminar este alumno?")) {
      const result = await deleteStudent(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert("Error: " + result.error);
      }
    }
  };

  const handleViewCards = async (student: Student) => {
    setSelectedStudent(student);
    setIsCardsDialogOpen(true);
    setLoadingCards(true);
    setStudentCards([]);

    try {
      const cards = await getStudentCards(
        student.student_id,
        student.company_id,
        student.event_id,
      );
      setStudentCards(cards || []);
    } catch (error) {
      console.error("Error loading cards:", error);
      alert("Error al cargar los cartones.");
    } finally {
      setLoadingCards(false);
    }
  };

  const handleViewInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setIsInvoiceDialogOpen(true);
  };

  const handleDownloadAssignments = async () => {
    try {
      const data = await getAllAssignedCards();
      if (data.length === 0) {
        alert("No hay cartones asignados para descargar.");
        return;
      }

      const headers = [
        "card_number",
        "student_name",
        "student_level",
        "company_id",
        "event_id",
      ];
      const rows = data.map((d) => [
        d.card_number,
        d.student_name,
        d.student_level,
        d.company_id,
        d.event_id,
      ]);

      const csvContent =
        "data:text/csv;charset=utf-8," +
        [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "cartones_asignados.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      await logExportActivity(data.length);
    } catch (error) {
      console.error("Error downloading assignments:", error);
      alert("Error al descargar las asignaciones.");
    }
  };

  const handleQuickAssign = async () => {
    if (!selectedStudent || !quickCardNumber) return;

    setIsProcessingAssignment(true);
    try {
      const result = await assignCardToStudent(
        selectedStudent.student_id,
        selectedStudent.company_id,
        selectedStudent.event_id,
        parseInt(quickCardNumber),
      );

      if (result.success) {
        setQuickCardNumber("");
        // Refresh cards list
        const cards = await getStudentCards(
          selectedStudent.student_id,
          selectedStudent.company_id,
          selectedStudent.event_id,
        );
        setStudentCards(cards || []);
        // Refresh students count (hacky but works)
        setStudents((prev) =>
          prev.map((s) =>
            s.id === selectedStudent.id
              ? { ...s, cards_count: (s.cards_count || 0) + 1 }
              : s,
          ),
        );
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      alert("Error al asignar el cartón.");
    } finally {
      setIsProcessingAssignment(false);
    }
  };

  const handleQuickUnassign = async (cardNumber: number) => {
    if (
      !selectedStudent ||
      !confirm(`¿Estás seguro de desasignar el cartón ${cardNumber}?`)
    )
      return;

    setIsProcessingAssignment(true);
    try {
      const result = await unassignCardFromStudent(
        selectedStudent.student_id,
        selectedStudent.company_id,
        selectedStudent.event_id,
        cardNumber,
      );

      if (result.success) {
        // Refresh cards list
        const cards = await getStudentCards(
          selectedStudent.student_id,
          selectedStudent.company_id,
          selectedStudent.event_id,
        );
        setStudentCards(cards || []);
        // Refresh students count
        setStudents((prev) =>
          prev.map((s) =>
            s.id === selectedStudent.id
              ? { ...s, cards_count: Math.max(0, (s.cards_count || 0) - 1) }
              : s,
          ),
        );
      } else {
        alert("Error: " + result.error);
      }
    } catch (error) {
      alert("Error al desasignar el cartón.");
    } finally {
      setIsProcessingAssignment(false);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setAssignFormLoading(true);

    try {
      const formData = new FormData(e.currentTarget);
      const mode = formData.get("mode") as string;

      if (mode === "single") {
        const studentId = parseInt(formData.get("student_id") as string);
        const cardNumber = parseInt(formData.get("card_number") as string);
        const eventIdInfo = formData.get("event_id_info") as string;
        const [companyId, eventId] = eventIdInfo.split("|");

        const result = await assignCardToStudent(
          studentId,
          parseInt(companyId),
          eventId,
          cardNumber,
        );

        if (result.success) {
          alert("Cartón asignado exitosamente.");
          setIsAssignDialogOpen(false);
          window.location.reload();
        } else {
          alert("Error: " + result.error);
        }
      }
    } catch (err) {
      alert("Error al procesar la asignación.");
    } finally {
      setAssignFormLoading(false);
    }
  };

  const handleBulkAssignUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const buffer = event.target?.result as ArrayBuffer;
        let content = "";

        // Try UTF-8 first
        const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
        try {
          content = utf8Decoder.decode(buffer);
        } catch (e) {
          // Fallback to ISO-8859-1
          const latinDecoder = new TextDecoder("iso-8859-1");
          content = latinDecoder.decode(buffer);
        }

        const lines = content.split(/\r?\n/);
        if (lines.length < 2) throw new Error("Archivo vacío");

        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const data = lines
          .slice(1)
          .filter((l) => l.trim())
          .map((line) => {
            const values = line.split(",");
            const obj: any = {};
            headers.forEach((h, i) => {
              const val = values[i]?.trim();
              if (h === "id alumno" || h === "student_id") obj.student_id = val;
              else if (
                h === "n° carton" ||
                h === "carton" ||
                h === "card_number"
              )
                obj.card_number = val;
              else if (h === "company_id") obj.company_id = val;
              else if (h === "event_id") obj.event_id = val;
              else obj[h] = val;
            });
            return obj;
          });

        if (
          !confirm(
            `Se han detectado ${data.length} asignaciones en el archivo. ¿Deseas proceder con la carga?`,
          )
        ) {
          e.target.value = "";
          return;
        }

        setAssignFormLoading(true);
        const result = await bulkAssignCards(data);
        if (result.success) {
          alert(`Éxito: Se asignaron ${data.length} cartones.`);
          setIsAssignDialogOpen(false);
          window.location.reload();
        } else {
          alert("Error en carga masiva: " + result.error);
        }
      } catch (err) {
        alert("Error al procesar archivo masivo: " + (err as Error).message);
      } finally {
        setAssignFormLoading(false);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="light" icon={ArrowLeft} className="rounded-full" />
          </Link>
          <div>
            <Title className="text-2xl font-black text-larioja-azul dark:text-white uppercase tracking-tight">
              Gestión de Alumnos
            </Title>
            <Text className="text-sm mt-1 text-gray-500 dark:text-gray-400">
              Registro maestro de estudiantes por evento y nivel académico.
            </Text>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-gray-100 dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700">
            <Button
              variant="light"
              icon={FileJson}
              onClick={handleDownloadJSON}
              size="xs"
              tooltip="Exportar JSON"
            >
              JSON
            </Button>
            <div className="w-px h-4 bg-gray-300 dark:bg-gray-600 mx-1" />
            <Button
              variant="light"
              icon={FileSpreadsheet}
              onClick={handleDownloadCSV}
              size="xs"
              tooltip="Exportar CSV"
            >
              CSV
            </Button>
          </div>

          <div className="relative">
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              title="Importar JSON o CSV"
            />
            <Button variant="secondary" icon={Upload}>
              Importar Alumnos
            </Button>
          </div>
          <Button
            variant="secondary"
            icon={TicketIcon}
            onClick={() => setIsAssignDialogOpen(true)}
            color="amber"
          >
            Asignar Cartones
          </Button>
          <Button
            variant="light"
            icon={Download}
            onClick={handleDownloadAssignments}
            size="xs"
            tooltip="Descargar todas las asignaciones"
          >
            Descargar Asignaciones
          </Button>
          <Button
            icon={Plus}
            onClick={() => handleOpenDialog()}
            className="bg-larioja-azul hover:bg-blue-800"
          >
            Nuevo Alumno
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre o ID de alumno..."
            className="bg-transparent border-none outline-none text-sm flex-1 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Alumno</TableHeaderCell>
              <TableHeaderCell>Id Alumno</TableHeaderCell>
              <TableHeaderCell>Nivel</TableHeaderCell>
              <TableHeaderCell>Evento</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStudents.map((student) => (
              <TableRow key={student.id}>
                <TableCell className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <User
                    size={16}
                    className="text-larioja-azul dark:text-larioja-amarillo"
                  />
                  {student.student_name}
                </TableCell>
                <TableCell>{student.student_id}</TableCell>
                <TableCell>
                  <Badge color="blue">{student.student_level}</Badge>
                </TableCell>
                <TableCell>
                  <Text className="text-xs">
                    {student.event?.event_name || student.event_id}
                  </Text>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      {student.cards_count !== undefined &&
                        student.cards_count > 0 && (
                          <span className="text-xs font-black text-amber-500 dark:text-larioja-amarillo drop-shadow-sm">
                            {student.cards_count}
                          </span>
                        )}
                      <Button
                        variant="light"
                        icon={TicketIcon}
                        size="xs"
                        tooltip="Ver Cartones"
                        onClick={() => handleViewCards(student)}
                      />
                    </div>
                    <Button
                      variant="light"
                      icon={Edit}
                      size="xs"
                      onClick={() => handleOpenDialog(student)}
                    />
                    <Button
                      variant="light"
                      icon={Trash2}
                      size="xs"
                      color="rose"
                      onClick={() => handleDelete(student.id)}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
            <Title className="mb-4 text-larioja-azul dark:text-larioja-amarillo">
              {editingStudent ? "Editar Alumno" : "Nuevo Alumno"}
            </Title>
            <form onSubmit={handleSave} className="space-y-4">
              {editingStudent && (
                <input
                  type="hidden"
                  name="id"
                  value={editingStudent.id.toString()}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-gray-500 dark:text-gray-400">
                    Id Alumno
                  </Text>
                  <TextInput
                    name="student_id"
                    placeholder="12345"
                    type="number"
                    defaultValue={editingStudent?.student_id?.toString()}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase">Nivel</Text>
                  <select
                    name="student_level"
                    defaultValue={
                      editingStudent?.student_level || "1.Terapeutico"
                    }
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="1.Terapeutico">1.Terapéutico</option>
                    <option value="2.Inicial">2.Inicial</option>
                    <option value="3.Medio">3.Medio</option>
                    <option value="4.Prelaboral">4.Prelaboral</option>
                    <option value="5.Laboral">5.Laboral</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase">
                  Nombre Completo
                </Text>
                <TextInput
                  name="student_name"
                  placeholder="Juan Pérez"
                  defaultValue={editingStudent?.student_name}
                  required
                />
              </div>

              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase">Evento</Text>
                <select
                  name="event_id_info"
                  defaultValue={
                    editingStudent
                      ? `${editingStudent.company_id}|${editingStudent.event_id}`
                      : ""
                  }
                  required
                  className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  onChange={(e) => {
                    const [companyId, eventId] = e.target.value.split("|");
                    const companyInput = document.getElementById(
                      "hidden-company-id",
                    ) as HTMLInputElement;
                    const eventInput = document.getElementById(
                      "hidden-event-id",
                    ) as HTMLInputElement;
                    if (companyInput) companyInput.value = companyId;
                    if (eventInput) eventInput.value = eventId;
                  }}
                >
                  <option value="" disabled>
                    Selecciona un evento...
                  </option>
                  {events.map((ev) => (
                    <option
                      key={`${ev.company_id}-${ev.event_id}`}
                      value={`${ev.company_id}|${ev.event_id}`}
                    >
                      {ev.event_id} - {ev.event_name}
                    </option>
                  ))}
                </select>
                <input
                  type="hidden"
                  id="hidden-company-id"
                  name="company_id"
                  defaultValue={editingStudent?.company_id?.toString()}
                />
                <input
                  type="hidden"
                  id="hidden-event-id"
                  name="event_id"
                  defaultValue={editingStudent?.event_id}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="secondary"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={loading}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  loading={loading}
                  className="bg-larioja-azul"
                >
                  Guardar
                </Button>
              </div>
            </form>
          </DialogPanel>
        </div>
      </Dialog>
      <Dialog
        open={isAssignDialogOpen}
        onClose={() => setIsAssignDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
            <div className="flex items-center gap-2 mb-6 text-amber-600 dark:text-larioja-amarillo">
              <TicketIcon size={24} />
              <Title>Asignación de Cartones</Title>
            </div>

            <div className="flex gap-2 mb-6">
              <Button
                variant={assignMode === "single" ? "primary" : "light"}
                onClick={() => setAssignDialogOpen("single")}
                className="flex-1"
                size="xs"
              >
                Individual
              </Button>
              <Button
                variant={assignMode === "bulk" ? "primary" : "light"}
                onClick={() => setAssignDialogOpen("bulk")}
                className="flex-1"
                size="xs"
              >
                Carga Masiva (CSV)
              </Button>
            </div>

            {assignMode === "single" ? (
              <form onSubmit={handleAssignSubmit} className="space-y-4">
                <input type="hidden" name="mode" value="single" />

                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase">Alumno</Text>
                  <select
                    name="student_id"
                    required
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="">Selecciona un alumno...</option>
                    {students.map((s) => (
                      <option key={s.id} value={s.student_id}>
                        {s.student_name} (ID: {s.student_id})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase">Evento</Text>
                  <select
                    name="event_id_info"
                    required
                    className="w-full p-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm"
                  >
                    <option value="">Selecciona un evento...</option>
                    {events.map((ev) => (
                      <option
                        key={`${ev.company_id}-${ev.event_id}`}
                        value={`${ev.company_id}|${ev.event_id}`}
                      >
                        {ev.event_id} - {ev.event_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase">
                    Número de Cartón
                  </Text>
                  <TextInput
                    name="card_number"
                    placeholder="Ej: 1025"
                    type="number"
                    required
                  />
                </div>

                <div className="flex justify-end gap-3 mt-8">
                  <Button
                    variant="secondary"
                    onClick={() => setIsAssignDialogOpen(false)}
                    disabled={assignFormLoading}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    loading={assignFormLoading}
                    color="amber"
                  >
                    Asignar Cartón
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                  <Text className="text-xs text-blue-700 dark:text-blue-300">
                    El archivo CSV debe tener los siguientes encabezados:
                    <br />
                    <code className="font-bold">
                      student_id, card_number, company_id, event_id
                    </code>
                  </Text>
                </div>

                <div className="relative h-32 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl flex flex-col items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Upload size={32} className="text-gray-400" />
                  <Text className="text-sm text-gray-500">
                    Haz clic para subir archivo CSV
                  </Text>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleBulkAssignUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={assignFormLoading}
                  />
                </div>

                {assignFormLoading && (
                  <div className="flex items-center gap-2 justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-amber-500"></div>
                    <Text className="text-xs italic">
                      Procesando carga masiva...
                    </Text>
                  </div>
                )}

                <div className="flex justify-end mt-4">
                  <Button
                    variant="secondary"
                    onClick={() => setIsAssignDialogOpen(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </div>
            )}
          </DialogPanel>
        </div>
      </Dialog>

      {/* Student Cards Dialog */}
      <Dialog
        open={isCardsDialogOpen}
        onClose={() => setIsCardsDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
            <div className="flex items-center justify-between mb-2">
              <div>
                <Title className="text-larioja-azul dark:text-larioja-amarillo">
                  Cartones Asignados
                </Title>
                <Text className="text-sm font-medium">
                  Alumno: {selectedStudent?.student_name}
                </Text>
              </div>
              <Badge color="blue" icon={TicketIcon}>
                {studentCards.length} Cartones
              </Badge>
            </div>

            <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
              <Text className="text-xs font-bold uppercase text-gray-400 mb-3">
                Asignación Rápida
              </Text>
              <div className="flex gap-2">
                <TextInput
                  placeholder="Número de Cartón"
                  type="number"
                  value={quickCardNumber}
                  onValueChange={setQuickCardNumber}
                  className="flex-1"
                  icon={TicketIcon}
                />
                <Button
                  loading={isProcessingAssignment}
                  onClick={handleQuickAssign}
                  color="blue"
                  className="bg-larioja-azul"
                  disabled={!quickCardNumber}
                >
                  Asignar
                </Button>
              </div>
            </div>

            {loadingCards ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-larioja-azul"></div>
                <Text>Cargando cartones...</Text>
              </div>
            ) : studentCards.length > 0 ? (
              <div className="max-h-[60vh] overflow-y-auto pr-2">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableHeaderCell>N° Cartón</TableHeaderCell>
                      <TableHeaderCell>Tipo</TableHeaderCell>
                      <TableHeaderCell>Estado</TableHeaderCell>
                      <TableHeaderCell>Factura</TableHeaderCell>
                      <TableHeaderCell className="text-right">
                        Acciones
                      </TableHeaderCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {studentCards.map((card, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-bold text-larioja-azul dark:text-larioja-amarillo">
                          {card.card_number}
                        </TableCell>
                        <TableCell>
                          <Badge size="xs">{card.card_type}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            color={
                              card.card_status === "Vendido"
                                ? "emerald"
                                : "blue"
                            }
                            size="xs"
                          >
                            {card.card_status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {card.invoice_number ? (
                            <button
                              onClick={() => handleViewInvoice(card.invoices)}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium underline transition-colors"
                            >
                              <Eye size={14} />
                              {card.invoice_number}
                            </button>
                          ) : (
                            <Text className="text-gray-400 italic">
                              Sin venta
                            </Text>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="xs"
                            variant="light"
                            color="rose"
                            icon={Trash2}
                            tooltip="Desasignar cartón"
                            disabled={
                              card.card_status === "Vendido" ||
                              isProcessingAssignment
                            }
                            onClick={() =>
                              handleQuickUnassign(card.card_number)
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl">
                <TicketIcon size={48} className="text-gray-200" />
                <Text className="text-gray-400 italic">
                  No hay cartones asignados a este alumno.
                </Text>
              </div>
            )}

            <div className="flex justify-end mt-8">
              <Button
                variant="secondary"
                onClick={() => setIsCardsDialogOpen(false)}
              >
                Cerrar
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Invoice Detail Dialog */}
      <Dialog
        open={isInvoiceDialogOpen}
        onClose={() => setIsInvoiceDialogOpen(false)}
        static={true}
      >
        <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 backdrop-blur-sm z-50" />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <DialogPanel className="max-w-lg w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 text-larioja-azul dark:text-larioja-amarillo">
                <FileText size={24} />
                <Title>Detalle de Factura</Title>
              </div>
              {selectedInvoice && (
                <Badge
                  color="blue"
                  size="sm"
                  icon={Hash}
                  className="text-white"
                >
                  {selectedInvoice.invoice_number}
                </Badge>
              )}
            </div>

            {selectedInvoice ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="p-3 bg-gray-50 dark:bg-gray-800 border-none">
                    <Text className="text-[10px] font-bold uppercase text-gray-400">
                      Fecha de Emisión
                    </Text>
                    <Flex justifyContent="start" className="gap-2 mt-1">
                      <Calendar size={14} className="text-larioja-azul" />
                      <Text className="font-medium text-sm">
                        {new Date(
                          selectedInvoice.invoice_date,
                        ).toLocaleDateString()}
                      </Text>
                    </Flex>
                  </Card>
                  <Card className="p-3 bg-gray-50 dark:bg-gray-800 border-none">
                    <Text className="text-[10px] font-bold uppercase text-gray-400">
                      Estado de Pago
                    </Text>
                    <div className="mt-1">
                      <Badge
                        size="xs"
                        color={
                          selectedInvoice.status === "pagada"
                            ? "emerald"
                            : "amber"
                        }
                        className="capitalize"
                      >
                        {selectedInvoice.status}
                      </Badge>
                    </div>
                  </Card>
                </div>

                <Card className="p-4 bg-gray-50 dark:bg-gray-800 border-none">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <UserCircle
                        className="text-larioja-azul mt-1"
                        size={20}
                      />
                      <div className="flex-1">
                        <Text className="text-[10px] font-bold uppercase text-gray-400">
                          Cliente
                        </Text>
                        <Text className="font-bold text-gray-900 dark:text-white">
                          {selectedInvoice.customer_name}
                        </Text>
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Mail size={12} />
                            <span>
                              {selectedInvoice.customer_email || "Sin email"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <PhoneIcon size={12} />
                            <span>
                              {selectedInvoice.phone_area &&
                              selectedInvoice.phone_number
                                ? `(${selectedInvoice.phone_area}) ${selectedInvoice.phone_number}`
                                : "Sin teléfono"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center gap-3">
                        <CreditCard className="text-larioja-azul" size={18} />
                        <div>
                          <Text className="text-[10px] font-bold uppercase text-gray-400">
                            Método de Pago
                          </Text>
                          <Text className="font-medium text-sm capitalize">
                            {selectedInvoice.payment_method}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <div className="flex items-center justify-between p-4 bg-larioja-azul dark:bg-blue-900 rounded-xl text-white shadow-lg">
                  <div className="flex items-center gap-2">
                    <DollarSign size={20} />
                    <span className="font-bold">Total Facturado</span>
                  </div>
                  <span className="text-2xl font-black">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(selectedInvoice.total_amount)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-20 text-center">
                <Text className="italic text-gray-500">
                  No hay información de factura disponible.
                </Text>
              </div>
            )}

            <div className="flex justify-end mt-8">
              <Button
                variant="secondary"
                onClick={() => setIsInvoiceDialogOpen(false)}
              >
                Cerrar
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>
    </div>
  );
}
