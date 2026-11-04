import React from "react";

/**
 * Esqueleto de carga visual inmediato (Skeleton UI) para Gestión CMS.
 * Proporciona feedback instantáneo durante la navegación hacia `/admin/cms`.
 */
export default function CMSLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Botón superior de manual */}
      <div className="flex justify-end pt-2">
        <div className="h-5 w-36 bg-gray-200 dark:bg-gray-800 rounded-md" />
      </div>

      {/* Barra de pestañas simulada */}
      <div className="flex gap-4 border-b border-gray-200 dark:border-gray-800 pb-3 flex-wrap">
        <div className="h-9 w-44 bg-larioja-azul/20 dark:bg-larioja-azul/30 rounded-xl" />
        <div className="h-9 w-56 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="h-9 w-36 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
        <div className="h-9 w-32 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>

      {/* Encabezado del panel de contenido */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-100 dark:border-gray-800 pb-6 px-4 sm:px-0">
        <div className="space-y-2">
          <div className="h-7 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg" />
          <div className="h-4 w-96 max-w-full bg-gray-100 dark:bg-gray-900 rounded-md" />
        </div>
        <div className="h-10 w-36 bg-green-200/50 dark:bg-green-900/30 rounded-xl" />
      </div>

      {/* Tarjeta de filtros */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2">
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-10 w-full bg-gray-100 dark:bg-gray-850 rounded-xl border border-gray-200/60 dark:border-gray-800" />
          </div>
          <div className="space-y-2">
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-10 w-full bg-gray-100 dark:bg-gray-850 rounded-xl border border-gray-200/60 dark:border-gray-800" />
          </div>
          <div className="md:col-span-2 lg:col-span-2 space-y-2">
            <div className="h-4 w-48 bg-gray-200 dark:bg-gray-800 rounded" />
            <div className="h-10 w-full bg-gray-100 dark:bg-gray-850 rounded-xl border border-gray-200/60 dark:border-gray-800" />
          </div>
        </div>
      </div>

      {/* Tabla simulada */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden shadow-sm">
        {/* Cabecera de la tabla */}
        <div className="h-12 bg-gray-50 dark:bg-gray-850 border-b border-gray-200 dark:border-gray-800 flex items-center px-4 gap-4">
          <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-4 flex-1 bg-gray-300 dark:bg-gray-700 rounded hidden sm:block" />
          <div className="h-4 w-16 bg-gray-300 dark:bg-gray-700 rounded" />
          <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded" />
        </div>

        {/* Filas con efecto pulso */}
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {[...Array(7)].map((_, idx) => (
            <div key={idx} className="h-16 flex items-center px-4 gap-4">
              <div className="h-5 w-20 bg-gray-200 dark:bg-gray-800 rounded-full" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-800 rounded" />
              <div className="h-5 w-8 bg-amber-100 dark:bg-amber-950/40 rounded-full" />
              <div className="h-5 w-24 bg-blue-100 dark:bg-blue-950/40 rounded" />
              <div className="h-4 flex-1 bg-gray-100 dark:bg-gray-800 rounded hidden sm:block" />
              <div className="h-5 w-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full" />
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-800 rounded-lg ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
