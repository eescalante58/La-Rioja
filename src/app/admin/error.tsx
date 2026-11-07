"use client";

import { useEffect } from "react";
import Link from "next/link";

/**
 * Error boundary del panel de administración.
 * Sin dependencias de Tremor ni lucide para evitar fallos de bundle en producción.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin/error]", error.digest ?? error.message);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-md w-full text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-8 shadow-sm">
        <div className="mx-auto mb-4 h-14 w-14 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-2xl">
          ⚠️
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Sin acceso a esta sección
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Tu cuenta no tiene los permisos necesarios para acceder a esta sección del sistema.
        </p>
        <p className="mt-1 text-sm text-gray-500">
          Comunícate con el Administrador para que te asigne los roles correspondientes.
        </p>
        {error.digest && (
          <div className="mt-3 rounded-lg bg-gray-100 dark:bg-gray-800 px-4 py-2 text-xs text-gray-400 font-mono">
            ref: {error.digest}
          </div>
        )}
        <div className="mt-5 flex flex-col items-center gap-3">
          <Link
            href="/login"
            className="inline-block rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Ir al inicio de sesión
          </Link>
          <button
            onClick={reset}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    </div>
  );
}
