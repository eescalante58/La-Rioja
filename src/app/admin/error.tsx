"use client";

import { useEffect } from "react";
import { Card, Title, Text, Button } from "@tremor/react";
import { ShieldAlert, LogIn } from "lucide-react";
import Link from "next/link";

/**
 * Error boundary del panel de administración.
 * Captura errores de Server Components dentro de /admin y muestra un
 * mensaje amigable con opción de regresar al inicio de sesión.
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
      <Card className="max-w-md w-full text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
          <ShieldAlert size={30} className="text-amber-500" />
        </div>
        <Title className="text-xl">Sin acceso a esta sección</Title>
        <Text className="mt-2 text-gray-600 dark:text-gray-400">
          Tu cuenta no tiene los permisos necesarios para acceder a esta sección del sistema.
        </Text>
        <Text className="mt-1 text-sm text-gray-500 dark:text-gray-500">
          Comunícate con el Administrador para que te asigne los roles correspondientes.
        </Text>
        {error.digest && (
          <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-4 py-2 text-xs text-gray-400 font-mono">
            ref: {error.digest}
          </div>
        )}
        <div className="mt-5 flex flex-col items-center gap-3">
          <Link href="/login">
            <Button icon={LogIn}>Ir al inicio de sesión</Button>
          </Link>
          <button
            onClick={reset}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline"
          >
            Intentar de nuevo
          </button>
        </div>
      </Card>
    </div>
  );
}
