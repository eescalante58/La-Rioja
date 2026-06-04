"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  Button,
  Select,
  SelectItem,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  Badge,
} from "@tremor/react";
import { X, Building2, Trash } from "lucide-react";
import {
  getUserCompanies,
  assignUserToCompany,
  removeUserFromCompany,
} from "@/app/admin/settings/users/actions";

interface User {
  id: string;
  full_name: string | null;
}

interface Company {
  company_id: number;
  company_name: string;
}

interface Role {
  role_id: number;
  name: string;
}

interface UserCompany {
  user_id: string;
  company_id: number;
  role_id: number;
  company: { company_name: string };
  role_data: { name: string };
}

interface UserCompaniesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  allCompanies: Company[];
  roles: Role[];
}

export default function UserCompaniesDialog({
  isOpen,
  onClose,
  user,
  allCompanies,
  roles,
}: UserCompaniesDialogProps) {
  const [loading, setLoading] = useState(false);
  const [userCompanies, setUserCompanies] = useState<UserCompany[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    if (user && isOpen) {
      loadUserCompanies();
    }
  }, [user, isOpen]);

  const loadUserCompanies = async () => {
    if (!user) return;
    setLoadingData(true);
    const data = await getUserCompanies(user.id);
    setUserCompanies(data as any);
    setLoadingData(false);
  };

  const handleAssign = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await assignUserToCompany(
      user.id,
      parseInt(formData.get("company_id") as string),
      parseInt(formData.get("role_id") as string),
    );
    if (res.success) {
      await loadUserCompanies();
      (e.target as HTMLFormElement).reset();
    } else {
      alert("Error: " + res.error);
    }
    setLoading(false);
  };

  const handleRemove = async (companyId: number) => {
    if (!user || !confirm("¿Eliminar acceso a esta empresa?")) return;
    setLoading(true);
    const res = await removeUserFromCompany(user.id, companyId);
    if (res.success) {
      await loadUserCompanies();
    } else {
      alert("Error: " + res.error);
    }
    setLoading(false);
  };

  return (
    <Dialog open={isOpen} onClose={onClose} static={true}>
      <div className="fixed inset-0 bg-gray-500/30 dark:bg-black/50 sm:backdrop-blur-sm z-50" />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
        <DialogPanel className="max-w-2xl w-full bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-2xl sm:shadow-xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[85vh] overflow-hidden">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <Building2 size={24} className="text-larioja-azul" />
              <div>
                <Title>Empresas Asignadas</Title>
                <Text className="text-xs">{user?.full_name}</Text>
              </div>
            </div>
            <Button variant="light" icon={X} onClick={onClose} />
          </div>

          <form
            onSubmit={handleAssign}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700"
          >
            <Select name="company_id" placeholder="Empresa..." required>
              {allCompanies.map((c) => (
                <SelectItem key={c.company_id} value={String(c.company_id)}>
                  {c.company_name}
                </SelectItem>
              ))}
            </Select>
            <Select name="role_id" placeholder="Rol..." required>
              {roles.map((r) => (
                <SelectItem key={r.role_id} value={String(r.role_id)}>
                  {r.name}
                </SelectItem>
              ))}
            </Select>
            <Button color="blue" loading={loading} type="submit">
              Asignar
            </Button>
          </form>

          <div className="flex-1 overflow-y-auto">
            {loadingData ? (
              <div className="py-10 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-larioja-azul mx-auto mb-2"></div>
                <Text>Cargando...</Text>
              </div>
            ) : userCompanies.length > 0 ? (
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeaderCell>Empresa</TableHeaderCell>
                    <TableHeaderCell>Rol</TableHeaderCell>
                    <TableHeaderCell className="text-right">
                      Acciones
                    </TableHeaderCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userCompanies.map((uc) => (
                    <TableRow key={uc.company_id}>
                      <TableCell className="font-bold">
                        {uc.company?.company_name}
                      </TableCell>
                      <TableCell>
                        <Badge color="blue">{uc.role_data?.name}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="light"
                          icon={Trash}
                          color="rose"
                          size="xs"
                          onClick={() => handleRemove(uc.company_id)}
                          disabled={loading}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="py-10 text-center bg-gray-50 dark:bg-gray-800 rounded-xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                <Text className="italic text-gray-400">
                  No hay empresas asignadas.
                </Text>
              </div>
            )}
          </div>
          <div className="mt-6 flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
