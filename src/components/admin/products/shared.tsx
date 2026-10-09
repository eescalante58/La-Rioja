import type { Dispatch, ReactNode, SetStateAction } from "react";
import { AlertCircle } from "lucide-react";
import type { ShopAdminData } from "@/lib/validation/products";

/** Respuesta de las acciones del dispatcher `/api/actions`. */
export type Result<T> = { success: true; data?: T } | { success: false; error: string };

/** Props comunes de las pestañas que editan catálogo/productos. */
export interface ShopTabProps {
  companyId: number;
  data: ShopAdminData;
  setData: Dispatch<SetStateAction<ShopAdminData>>;
}

/** Clase de los inputs del admin de la tienda. */
export const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-larioja-azul/40";

/** Etiqueta de campo de formulario. */
export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {children}
    </span>
  );
}

/** Aviso de error en rojo. */
export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
      <AlertCircle size={16} className="shrink-0" />
      {message}
    </div>
  );
}

/** Ordena por `content_order` y luego por nombre. */
export function byOrder<T extends { content_order: number; name: string }>(list: T[]): T[] {
  return [...list].sort(
    (a, b) => a.content_order - b.content_order || a.name.localeCompare(b.name),
  );
}
