import React from "react";
import { Loader2 } from "lucide-react";

/**
 * Indicador de carga visual para Gestión CMS.
 * Utiliza un spinner continuo ("ruedita sin fin") centrado y suave,
 * evitando destellos o saltos estructurales de esqueletos complejos.
 */
export default function CMSLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-500 dark:text-slate-400">
      <Loader2 className="h-10 w-10 animate-spin text-larioja-azul dark:text-larioja-amarillo" />
      <span className="text-sm font-medium">Cargando Gestión CMS...</span>
    </div>
  );
}
