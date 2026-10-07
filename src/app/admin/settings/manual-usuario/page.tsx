import { readFileSync } from "fs";
import path from "path";
import { Title, Text } from "@tremor/react";
import { BookUser } from "lucide-react";
import MarkdownDoc from "@/components/admin/MarkdownDoc";

export const dynamic = "force-dynamic";

/**
 * Página "Manual de Usuario — Configuración": renderiza
 * Documentacion/Manual_Usuario_Configuracion.md leído del
 * repositorio en tiempo de petición (fuente única).
 */
export default function ManualUsuarioSettingsPage() {
  const filePath = path.join(
    process.cwd(),
    "Documentacion",
    "Manual_Usuario_Configuracion.md",
  );
  let markdown = "";
  try {
    markdown = readFileSync(filePath, "utf8");
  } catch {
    markdown = "No se encontró Documentacion/Manual_Usuario_Configuracion.md.";
  }

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <div className="flex items-center gap-3 mb-6 pt-4">
        <div className="p-2 bg-larioja-verde/10 rounded-lg text-larioja-verde dark:text-green-400">
          <BookUser size={24} />
        </div>
        <div>
          <Title className="text-2xl font-bold text-larioja-azul dark:text-larioja-amarillo">
            Manual de Usuario — Configuración
          </Title>
          <Text className="text-gray-500 dark:text-gray-400">
            Guía de uso de la sección Configuración (Documentacion/Manual_Usuario_Configuracion.md).
          </Text>
        </div>
      </div>
      <MarkdownDoc markdown={markdown} />
    </div>
  );
}
