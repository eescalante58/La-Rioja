"use client";

import { useState } from "react";
import { Card, Title, Text, Button, TextInput } from "@tremor/react";
import { Search, Plus } from "lucide-react";
import { callAction } from "@/lib/action-client";
import dynamic from "next/dynamic";

const UserTable = dynamic(() => import("@/components/admin/users/UserTable"), {
  loading: () => <div className="h-96 w-full bg-slate-900/5 animate-pulse rounded-2xl" />,
});
const UserDialog = dynamic(() => import("@/components/admin/users/UserDialog"));
const CreateUserDialog = dynamic(() => import("@/components/admin/users/CreateUserDialog"));
const UserCompaniesDialog = dynamic(() => import("@/components/admin/users/UserCompaniesDialog"));

interface User {
  id: string;
  email: string;
  full_name: string | null;
  secondary_email: string | null;
  phone: string | null;
  status: string;
  avatar_url: string | null;
}

interface Company {
  company_id: number;
  company_name: string;
}

interface CountryCode {
  iso2: string;
  name: string;
  phone_code: string;
  flag_emoji: string;
}

export default function UserManagerClient({
  initialUsers,
  companies,
  countryCodes,
  currentUserId,
}: {
  initialUsers: User[];
  companies: Company[];
  countryCodes: CountryCode[];
  currentUserId?: string;
}) {
  const [users] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [selectedUserForCompanies, setSelectedUserForCompanies] = useState<User | null>(null);

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.full_name || "").toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleDeleteUser = async (id: string) => {
    if (!confirm("¿Eliminar usuario?")) return;
    const res = await callAction<{ success?: boolean; error?: string }>("users.deleteUser", [id]);
    if (res.success) window.location.reload();
    else alert("Error: " + res.error);
  };

  return (
    <div className="space-y-6">
      <Card className="p-4 mt-4 shadow-sm sm:shadow-md border-gray-200 dark:border-gray-800">
        <div className="flex gap-4 mb-6">
          <TextInput
            icon={Search}
            placeholder="Buscar..."
            value={searchTerm}
            onValueChange={setSearchTerm}
            className="flex-1"
          />
          <Button
            icon={Plus}
            className="bg-larioja-azul"
            onClick={() => setIsCreateUserDialogOpen(true)}
          >
            Nuevo Usuario
          </Button>
        </div>
        <UserTable
          users={filteredUsers}
          currentUserId={currentUserId}
          onEdit={(user) => {
            setEditingUser(user);
            setIsUserDialogOpen(true);
          }}
          onDelete={handleDeleteUser}
          onManageCompanies={(user) => {
            setSelectedUserForCompanies(user);
            setIsCompanyDialogOpen(true);
          }}
        />
      </Card>

      <UserDialog
        isOpen={isUserDialogOpen}
        onClose={() => setIsUserDialogOpen(false)}
        user={editingUser}
        countryCodes={countryCodes}
      />

      <CreateUserDialog
        isOpen={isCreateUserDialogOpen}
        onClose={() => setIsCreateUserDialogOpen(false)}
        countryCodes={countryCodes}
      />

      <UserCompaniesDialog
        isOpen={isCompanyDialogOpen}
        onClose={() => setIsCompanyDialogOpen(false)}
        user={selectedUserForCompanies}
        allCompanies={companies}
      />
    </div>
  );
}
