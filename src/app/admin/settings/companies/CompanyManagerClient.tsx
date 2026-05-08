"use client";

import { useState } from "react";
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
} from "@tremor/react";
import {
  Plus,
  Edit,
  Trash2,
  Search,
  ArrowLeft,
  Building2,
  Phone,
} from "lucide-react";
import Link from "next/link";
import { saveCompany, deleteCompany } from "./actions";

interface Company {
  company_id: number;
  company_name: string;
  phone_code_area: string | null;
  phone_number: string | null;
  session_timeout_minutes: number | null;
}

/**
 * Client component for managing companies.
 */
export default function CompanyManagerClient({
  initialData,
}: {
  initialData: Company[];
}) {
  const [companies, setCompanies] = useState(initialData);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredCompanies = companies.filter((c) =>
    c.company_name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleOpenDialog = (company: Company | null = null) => {
    setEditingCompany(company);
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await saveCompany(formData);

    if (result.success) {
      window.location.reload();
    } else {
      alert("Error: " + result.error);
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      confirm(
        "¿Estás seguro de eliminar esta empresa? Esto podría afectar a usuarios vinculados.",
      )
    ) {
      const result = await deleteCompany(id);
      if (result.success) {
        window.location.reload();
      } else {
        alert("Error: " + result.error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/settings">
            <Button variant="light" icon={ArrowLeft}>
              Volver a Configuración
            </Button>
          </Link>
          <div>
            <Title className="text-lg font-bold text-larioja-azul/80 dark:text-larioja-amarillo/80">
              Gestión de Empresas
            </Title>
            <Text className="text-xs">
              Gestiona las organizaciones registradas en el sistema.
            </Text>
          </div>
        </div>
        <Button
          icon={Plus}
          onClick={() => handleOpenDialog()}
          className="bg-larioja-azul hover:bg-blue-800"
        >
          Nueva Empresa
        </Button>
      </div>

      <Card className="p-4">
        <div className="flex items-center gap-2 mb-4 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
          <Search className="text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nombre de empresa..."
            className="bg-transparent border-none outline-none text-sm flex-1 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Nombre</TableHeaderCell>
              <TableHeaderCell>ID</TableHeaderCell>
              <TableHeaderCell>Teléfono</TableHeaderCell>
              <TableHeaderCell>Timeout (min)</TableHeaderCell>
              <TableHeaderCell className="text-right">Acciones</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCompanies.map((company) => (
              <TableRow key={company.company_id}>
                <TableCell className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Building2
                    size={16}
                    className="text-larioja-azul dark:text-larioja-amarillo"
                  />
                  {company.company_name}
                </TableCell>
                <TableCell>{company.company_id}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 text-xs">
                    <Phone size={14} className="text-gray-400" />
                    <span>
                      ({company.phone_code_area || "---"}){" "}
                      {company.phone_number || "---"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-xs">
                    {company.session_timeout_minutes || 30} min
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="light"
                      icon={Edit}
                      size="xs"
                      onClick={() => handleOpenDialog(company)}
                    />
                    <Button
                      variant="light"
                      icon={Trash2}
                      size="xs"
                      color="rose"
                      onClick={() => handleDelete(company.company_id)}
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
          <DialogPanel className="max-w-md w-full bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-larioja-azul/[0.08] via-larioja-verde/[0.08] to-larioja-amarillo/[0.12] hover:shadow-larioja-azul/20 hover:shadow-2xl transition-all duration-500">
            <Title className="mb-4 text-larioja-azul dark:text-larioja-amarillo">
              {editingCompany ? "Editar Empresa" : "Nueva Empresa"}
            </Title>
            <form onSubmit={handleSave} className="space-y-4">
              {editingCompany && (
                <input
                  type="hidden"
                  name="id"
                  value={editingCompany.company_id}
                />
              )}

              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase">
                  Nombre de la Empresa
                </Text>
                <TextInput
                  name="company_name"
                  placeholder="La Rioja S.A."
                  defaultValue={editingCompany?.company_name}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Text className="text-xs font-bold uppercase text-nowrap">
                    Cód. Área
                  </Text>
                  <TextInput
                    name="phone_code_area"
                    placeholder="380"
                    defaultValue={editingCompany?.phone_code_area || ""}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Text className="text-xs font-bold uppercase">
                    Número de Teléfono
                  </Text>
                  <TextInput
                    name="phone_number"
                    placeholder="44556677"
                    defaultValue={editingCompany?.phone_number || ""}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Text className="text-xs font-bold uppercase">
                  Timeout de Sesión (Minutos)
                </Text>
                <TextInput
                  name="session_timeout_minutes"
                  type="number"
                  placeholder="30"
                  defaultValue={
                    editingCompany?.session_timeout_minutes?.toString() || "30"
                  }
                  required
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
    </div>
  );
}
