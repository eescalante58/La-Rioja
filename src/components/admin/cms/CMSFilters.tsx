"use client";

import { Text, TextInput, Select, SelectItem, Button } from "@tremor/react";
import { Search, Filter } from "lucide-react";

interface CMSFiltersProps {
  pageFilter: string;
  setPageFilter: (val: string) => void;
  searchFilter: string;
  setSearchFilter: (val: string) => void;
  CMS_PAGES: readonly { value: string; label: string }[];
  sortedCount: number;
  totalCount: number;
}

export default function CMSFilters({
  pageFilter,
  setPageFilter,
  searchFilter,
  setSearchFilter,
  CMS_PAGES,
  sortedCount,
  totalCount,
}: CMSFiltersProps) {
  return (
    <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="space-y-2">
          <Text className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
            <Filter size={14} />
            Filtrar por Página
          </Text>
          <Select value={pageFilter} onValueChange={setPageFilter}>
            <SelectItem value="all">Todas las Páginas</SelectItem>
            {CMS_PAGES.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </Select>
        </div>
        <div className="md:col-span-1 lg:col-span-3 space-y-2">
          <Text className="text-xs font-bold uppercase text-gray-500 flex items-center gap-2">
            <Search size={14} />
            Buscar Sección, Título o Descripción
          </Text>
          <TextInput
            icon={Search}
            placeholder="Ej: hero, programas, historia..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
          />
        </div>
      </div>
      {(pageFilter !== "all" || searchFilter !== "") && (
        <div className="mt-4 flex justify-between items-center border-t border-gray-50 dark:border-gray-800 pt-4">
          <Text className="text-xs text-gray-500 italic">
            Mostrando {sortedCount} de {totalCount} resultados
          </Text>
          <Button
            variant="light"
            size="xs"
            color="gray"
            onClick={() => {
              setPageFilter("all");
              setSearchFilter("");
            }}
          >
            Limpiar Filtros
          </Button>
        </div>
      )}
    </div>
  );
}
