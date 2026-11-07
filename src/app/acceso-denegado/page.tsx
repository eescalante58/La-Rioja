import Link from "next/link";
import { Card, Title, Text, Button } from "@tremor/react";
import { ShieldX, ArrowLeft } from "lucide-react";

export default async function AccesoDenegadoPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="flex items-center justify-center min-h-screen p-6 bg-gray-50 dark:bg-black">
      <Card className="max-w-md w-full text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
          <ShieldX size={30} className="text-red-500" />
        </div>
        <Title className="text-xl">Acceso denegado</Title>
        <Text className="mt-2 text-gray-600 dark:text-gray-400">
          Tu usuario no tiene roles asignados en el sistema.
        </Text>
        {params.from && (
          <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-4 py-2 text-xs text-gray-500 font-mono break-all">
            {params.from}
          </div>
        )}
        <Text className="mt-3 text-sm text-gray-500">
          Comunícate con el Administrador para que te asigne los roles correspondientes.
        </Text>
        <div className="mt-5 flex flex-col items-center gap-3">
          <Link href="/admin/profile">
            <Button variant="secondary" icon={ArrowLeft}>
              Ir a mi perfil
            </Button>
          </Link>
          <Text className="text-xs text-gray-400">Desde tu perfil puedes cerrar sesión.</Text>
        </div>
      </Card>
    </div>
  );
}
