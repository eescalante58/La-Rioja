import { cookies } from "next/headers";
import { listShop } from "./actions";
import ProductsManagerClient from "./ProductsManagerClient";
import type { ShopAdminData } from "@/lib/validation/products";

export const dynamic = "force-dynamic";

/**
 * Administración de La Rioja Shop (/admin/productos): productos, catálogos y
 * líneas, y pedidos. Carga inicial en el servidor; las mutaciones se hacen
 * desde el cliente vía `/api/actions` (`productos.*`, `pedidos.*`).
 */
export default async function ProductosAdminPage() {
  const cookieStore = await cookies();
  const companyId = Number(cookieStore.get("selected_company_id")?.value);

  const result = (await listShop(companyId)) as
    { success: true; data?: ShopAdminData } | { success: false; error: string };

  if (!result.success || !result.data) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 rounded-xl border border-red-100 dark:border-red-900 text-sm">
        No se pudo cargar la tienda: {result.success ? "respuesta vacía" : result.error}
      </div>
    );
  }

  return <ProductsManagerClient companyId={companyId} initialData={result.data} />;
}
