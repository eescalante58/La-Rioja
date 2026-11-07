"use client";

import { useEffect } from "react";
import { Card, Title, Text, Button } from "@tremor/react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import Link from "next/link";

/**
 * Error boundary global del panel de administración.
 * Captura errores de Server Components y renderiza un mensaje amigable
 * en lugar del "This page couldn't load" nativo de Next.js.
 */
export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log en consola para debugging (no exponemos el mensaje al usuario)
    console.error("[admin/error]", error.digest ?? error.message);
  }, [error]);

  const isAuthError =
    error.message?.toLowerCase().includes("permission") ||
    error.message?.toLowerCase().includes("unauthorized") ||
    error.message?.toLowerCase().includes("forbidden") ||
    error.message?.toLowerCase().includes("role");

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
          <ShieldAlert size={30} className="text-amber-500" />
        </div>
        <Title className="text-xl">
          {isAuthError ? "Sin permisos para esta sección" : "No se pudo cargar la página"}
        </Title>
        <Text className="mt-2 text-gray-600 dark:text-gray-400">
          {isAuthError
            ? "No tienes los permisos necesarios para acceder a este módulo. Solicita acceso a un Administrador."
            : "Ocurrió un error al cargar esta sección. Puedes intentarlo de nuevo o volver al panel."}
        </Text>
        {error.digest && (
          <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-4 py-2 text-xs text-gray-400 font-mono">
            ref: {error.digest}
          </div>
        )}
        <div className="mt-5 flex flex-col items-center gap-3">
          <Button icon={RefreshCw} onClick={reset}>
            Intentar de nuevo
          </Button>
          <Link
            href="/admin"
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Volver al panel
          </Link>
        </div>
      </Card>
    </div>
  );
}
