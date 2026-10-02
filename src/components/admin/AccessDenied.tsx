import Link from "next/link";
import { Card, Title, Text, Button } from "@tremor/react";
import { ShieldX, ArrowLeft } from "lucide-react";

/**
 * Etiqueta legible del nivel de rol (authorization.ts:
 * Ventas 4, Editor 6, Admin 8, Super Admin 10).
 */
function roleLabel(level: number): string {
  const labels: Record<number, string> = {
    10: "Super Administrador",
    8: "Administrador",
    6: "Editor",
    4: "Ventas",
  };
  const known = Object.keys(labels)
    .map(Number)
    .sort((a, b) => b - a)
    .find((l) => level >= l);
  return known !== undefined ? labels[known] : `Nivel ${level}`;
}

interface AccessDeniedProps {
  /** Nivel mínimo requerido por la sección. */
  requiredLevel: number;
  /** Nivel actual del usuario (0 si no autenticado). */
  currentLevel: number;
  /** Nombre de la sección a la que se intentó acceder. */
  section?: string;
}

/**
 * Mensaje amigable cuando el usuario no tiene permisos para una página
 * de administración. Evita que las páginas protegidas con withRole
 * revienten al recibir {success:false} en lugar de datos.
 */
export default function AccessDenied({
  requiredLevel,
  currentLevel,
  section,
}: AccessDeniedProps) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <Card className="max-w-md w-full text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-900/20">
          <ShieldX size={30} className="text-amber-500" />
        </div>
        <Title className="text-xl">Acceso restringido</Title>
        <Text className="mt-2 text-gray-600 dark:text-gray-400">
          {section
            ? `No tienes permisos para acceder a "${section}".`
            : "No tienes permisos para acceder a esta sección."}
        </Text>
        <div className="mt-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <div>
            Tu perfil:{" "}
            <span className="font-bold text-gray-700 dark:text-gray-200">
              {roleLabel(currentLevel)} (nivel {currentLevel})
            </span>
          </div>
          <div>
            Requiere:{" "}
            <span className="font-bold text-gray-700 dark:text-gray-200">
              {roleLabel(requiredLevel)} (nivel {requiredLevel}) o superior
            </span>
          </div>
        </div>
        <Text className="mt-3 text-xs text-gray-400">
          Si necesitas acceso, solicítalo a un administrador del sistema.
        </Text>
        <Link href="/admin" className="inline-block mt-5">
          {/* icon={ArrowLeft} pasa una función a un Client Component de
              Tremor y rompe la serialización RSC; se renderiza como
              elemento hijo en su lugar. */}
          <Button variant="secondary">
            <ArrowLeft size={16} className="mr-1.5 -ml-1 inline-block" />
            Volver al panel
          </Button>
        </Link>
      </Card>
    </div>
  );
}
