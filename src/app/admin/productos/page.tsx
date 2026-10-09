import { cookies } from "next/headers";
import { listProducts } from "./actions";
import ProductsManagerClient from "./ProductsManagerClient";
import type { Product } from "@/lib/validation/products";

export const dynamic = "force-dynamic";

/**
 * Administración del catálogo de productos (/admin/productos).
 * Carga inicial en el servidor; las mutaciones se hacen desde el cliente
 * vía `/api/actions` (`productos.*`).
 */
export default async function ProductosAdminPage() {
  const cookieStore = await cookies();
  const companyId = Number(cookieStore.get("selected_company_id")?.value);

  const result = (await listProducts(companyId)) as
    { success: true; data?: Product[] } | { success: false; error: string };

  if (!result.success) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-xl border border-red-100 dark:border-red-900 text-sm">
        No se pudieron cargar los productos: {result.error}
      </div>
    );
  }

  return <ProductsManagerClient companyId={companyId} initialProducts={result.data ?? []} />;
}
