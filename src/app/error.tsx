"use client";

import { useEffect } from "react";
import { Card, Title, Text, Button } from "@tremor/react";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

/**
 * Error boundary global de la aplicación.
 * Captura errores que escapen del layout de /admin u otros segmentos.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error.digest ?? error.message);
  }, [error]);

  return (
    <html lang="es">
      <body>
        <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50">
          <Card className="max-w-md w-full text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50">
              <AlertTriangle size={30} className="text-amber-500" />
            </div>
            <Title className="text-xl">Sin acceso al panel</Title>
            <Text className="mt-2 text-gray-600">
              Tu cuenta no tiene los permisos necesarios para acceder a esta sección.
            </Text>
            <Text className="mt-1 text-sm text-gray-500">
              Comunícate con el Administrador para que te asigne los roles correspondientes.
            </Text>
            {error.digest && (
              <div className="mt-3 rounded-lg bg-gray-100 px-4 py-2 text-xs text-gray-400 font-mono">
                ref: {error.digest}
              </div>
            )}
            <div className="mt-5 flex flex-col items-center gap-3">
              <Link href="/login">
                <Button>Ir al inicio de sesión</Button>
              </Link>
              <button
                onClick={reset}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Intentar de nuevo
              </button>
            </div>
          </Card>
        </div>
      </body>
    </html>
  );
}
