"use client";

import { useEffect } from "react";
import { Card, Title, Text, Button } from "@tremor/react";
import { AlertTriangle, RefreshCw } from "lucide-react";
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
            <Title className="text-xl">No se pudo cargar la página</Title>
            <Text className="mt-2 text-gray-600">
              Ocurrió un error inesperado. Puedes intentarlo de nuevo o volver al panel.
            </Text>
            {error.digest && (
              <div className="mt-3 rounded-lg bg-gray-50 px-4 py-2 text-xs text-gray-400 font-mono">
                ref: {error.digest}
              </div>
            )}
            <div className="mt-5 flex flex-col items-center gap-3">
              <Button icon={RefreshCw} onClick={reset}>
                Intentar de nuevo
              </Button>
              <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
                Volver al panel
              </Link>
            </div>
          </Card>
        </div>
      </body>
    </html>
  );
}
