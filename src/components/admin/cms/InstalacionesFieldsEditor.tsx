"use client";

import React from "react";
import { Card, Title, Text, TextInput, Switch, Select, SelectItem } from "@tremor/react";
import { Sliders, HelpCircle, Link as LinkIcon } from "lucide-react";
import { cmsInternalHrefSchema } from "@/lib/validation/cms";

interface InstalacionesFieldsEditorProps {
  metadata: Record<string, unknown>;
  onChange: (updatedMeta: Record<string, unknown>) => void;
}

export function InstalacionesFieldsEditor({
  metadata,
  onChange,
}: InstalacionesFieldsEditorProps) {
  const chip = typeof metadata.chip === "string" ? metadata.chip : "Instalaciones";
  const fotosVisibles =
    metadata.fotos_visibles === 9 || metadata.fotos_visibles === "9" ? 9 : 5;
  const mostrarLeyendas =
    typeof metadata.mostrar_leyendas === "boolean"
      ? metadata.mostrar_leyendas
      : true;
  const boton = typeof metadata.boton === "string" ? metadata.boton : "";
  const enlace = typeof metadata.enlace === "string" ? metadata.enlace : "";

  const update = (patch: Record<string, unknown>) => {
    onChange({
      ...metadata,
      ...patch,
    });
  };

  const isEnlaceValid = enlace === "" || cmsInternalHrefSchema.safeParse(enlace).success;

  return (
    <Card className="p-6 border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-xl space-y-6">
      <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 pb-3">
        <Sliders size={20} className="text-larioja-azul dark:text-larioja-amarillo" />
        <div>
          <Title className="text-base font-semibold text-gray-900 dark:text-white">
            Configuración de la sección «Instalaciones»
          </Title>
          <Text className="text-xs text-gray-500">
            Parámetros visuales del mosaico, chip de navegación y botón de acción. Se guardan al pulsar «Guardar cambios».
          </Text>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Chip en la barra de secciones */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Texto del chip en barra de navegación
            </label>
            <span className="text-xs text-gray-400">{chip.length}/24</span>
          </div>
          <TextInput
            value={chip}
            maxLength={24}
            onChange={(e) => update({ chip: e.target.value })}
            placeholder="Instalaciones"
          />
          <p className="text-xs text-gray-500">
            Aparece después de «Modelo solidario» únicamente si la sección tiene elementos visibles.
          </p>
        </div>

        {/* Fotos visibles en mosaico escritorio */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Fotos visibles en el mosaico (Escritorio)
          </label>
          <Select
            value={String(fotosVisibles)}
            onValueChange={(val) => update({ fotos_visibles: Number(val) })}
            enableClear={false}
          >
            <SelectItem value="5">5 fotos (1 portada grande + 4 laterales)</SelectItem>
            <SelectItem value="9">9 fotos (1 portada grande + 8 cuadrícula)</SelectItem>
          </Select>
          <p className="text-xs text-gray-500">
            En celular el carrusel muestra siempre todas las fotos activas.
          </p>
        </div>

        {/* Mostrar leyendas */}
        <div className="space-y-1.5 md:col-span-2 flex items-center justify-between p-3.5 rounded-lg bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800">
          <div>
            <span className="text-sm font-medium text-gray-800 dark:text-gray-200 block">
              Mostrar leyendas sobre las casillas
            </span>
            <span className="text-xs text-gray-500 block">
              Muestra el texto breve en la parte inferior de cada foto con un degradado oscuro legible.
            </span>
          </div>
          <Switch
            checked={mostrarLeyendas}
            onChange={(checked) => update({ mostrar_leyendas: checked })}
          />
        </div>

        {/* Botón opcional */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Texto del botón de acción (opcional)
            </label>
            <span className="text-xs text-gray-400">{boton.length}/40</span>
          </div>
          <TextInput
            value={boton}
            maxLength={40}
            onChange={(e) => update({ boton: e.target.value })}
            placeholder="Ej: Inscribirse en matrícula"
          />
          <p className="text-xs text-gray-500">
            Dejar vacío si no se desea mostrar botón junto al encabezado.
          </p>
        </div>

        {/* Enlace del botón */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Enlace del botón
            </label>
            <LinkIcon size={13} className="text-gray-400" />
          </div>
          <TextInput
            value={enlace}
            error={!isEnlaceValid}
            errorMessage="Debe ser una ruta del sitio (/matricula, /programs) o un ancla (#instalaciones)"
            onChange={(e) => update({ enlace: e.target.value })}
            placeholder="/matricula o #inicio"
          />
          <p className="text-xs text-gray-500">
            Solo rutas internas del sitio web o anclas de la página actual.
          </p>
        </div>
      </div>
    </Card>
  );
}
