"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Title, Text, Button } from "@tremor/react";
import { Plus } from "lucide-react";
import { deleteCMSContent } from "./actions";
import dynamic from "next/dynamic";

// Dynamic imports for sub-components to improve performance
const CMSFilters = dynamic(() => import("@/components/admin/cms/CMSFilters"), {
  loading: () => <div className="h-24 w-full bg-slate-900/5 animate-pulse rounded-2xl mb-6" />,
});
const CMSTable = dynamic(() => import("@/components/admin/cms/CMSTable"), {
  loading: () => <div className="h-96 w-full bg-slate-900/5 animate-pulse rounded-2xl" />,
});
const CMSViewDialog = dynamic(() => import("@/components/admin/cms/CMSViewDialog"));
const CMSCreateDialog = dynamic(() => import("@/components/admin/cms/CMSCreateDialog"));
const CMSDeleteDialog = dynamic(() => import("@/components/admin/cms/CMSDeleteDialog"));

const CMS_PAGES = [
  { value: "home", label: "Home" },
  { value: "about", label: "About" },
  { value: "programs", label: "Programs" },
  { value: "services", label: "Services (Cards)" },
  { value: "contact", label: "Contact" },
  { value: "global", label: "Global" },
  { value: "social media", label: "Social Media" },
  { value: "whatsapp message", label: "WhatsApp Message" },
] as const;

interface CMSManagerClientProps {
  initialContent: any[];
}

export default function CMSManagerClient({
  initialContent,
}: CMSManagerClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [pageFilter, setPageFilter] = useState<string>(
    searchParams.get("page") || "all",
  );
  const [searchFilter, setSearchFilter] = useState(
    searchParams.get("search") || "",
  );

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (pageFilter !== "all") params.set("page", pageFilter);
    else params.delete("page");
    if (searchFilter) params.set("search", searchFilter);
    else params.delete("search");

    const queryString = params.toString();
    router.replace(`/admin/cms${queryString ? `?${queryString}` : ""}`, {
      scroll: false,
    });
  }, [pageFilter, searchFilter, router, searchParams]);

  const sortedContent = (initialContent || [])
    .filter((item) => {
      const matchesPage = pageFilter === "all" || item.page === pageFilter;
      const matchesSearch =
        searchFilter === "" ||
        (item.section_key || "").toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.title || "").toLowerCase().includes(searchFilter.toLowerCase()) ||
        (item.description || "").toLowerCase().includes(searchFilter.toLowerCase());
      return matchesPage && matchesSearch;
    })
    .sort((a, b) => {
      const pageCompare = (a.page || "").localeCompare(b.page || "");
      if (pageCompare !== 0) return pageCompare;
      const orderCompare = (a.content_order || 0) - (b.content_order || 0);
      if (orderCompare !== 0) return orderCompare;
      return (a.section_key || "").localeCompare(b.section_key || "");
    });

  const [isViewOpen, setIsViewOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const handleDelete = async () => {
    if (!selectedItem) return;
    setIsDeleting(true);
    try {
      const result = await deleteCMSContent(selectedItem.id);
      if (result.success) {
        setIsDeleteOpen(false);
        setSelectedItem(null);
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-gray-100 dark:border-gray-800 pb-6 px-4 sm:px-0">
        <div>
          <Title className="text-xl sm:text-2xl font-black text-larioja-azul dark:text-white uppercase tracking-tight">
            Gestión de Contenido (CMS)
          </Title>
          <Text className="text-xs sm:text-sm mt-1 text-gray-500 dark:text-gray-400">
            Administra el contenido dinámico de la landing page y secciones
            informativas.
          </Text>
        </div>
        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 bg-larioja-verde hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95"
        >
          <Plus size={18} />
          Nueva Sección
        </button>
      </div>

      <CMSFilters
        pageFilter={pageFilter}
        setPageFilter={setPageFilter}
        searchFilter={searchFilter}
        setSearchFilter={setSearchFilter}
        CMS_PAGES={CMS_PAGES}
        sortedCount={sortedContent.length}
        totalCount={initialContent.length}
      />

      <CMSTable
        content={sortedContent}
        onView={(item) => { setSelectedItem(item); setIsViewOpen(true); }}
        onDelete={(item) => { setSelectedItem(item); setIsDeleteOpen(true); }}
        pageFilter={pageFilter}
        searchFilter={searchFilter}
      />

      <CMSViewDialog
        isOpen={isViewOpen}
        onClose={() => setIsViewOpen(false)}
        item={selectedItem}
      />

      <CMSCreateDialog
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        CMS_PAGES={CMS_PAGES}
      />

      <CMSDeleteDialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        loading={isDeleting}
        item={selectedItem}
      />
    </div>
  );
}
