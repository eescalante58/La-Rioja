"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@tremor/react";
import { ClipboardList, ExternalLink, Layers, Package } from "lucide-react";
import type { ShopAdminData } from "@/lib/validation/products";

const tabLoading = () => (
  <div className="h-96 w-full bg-slate-900/5 dark:bg-white/5 animate-pulse rounded-2xl mt-6" />
);

const ProductsTab = dynamic(() => import("@/components/admin/products/ProductsTab"), {
  loading: tabLoading,
});
const CatalogsTab = dynamic(() => import("@/components/admin/products/CatalogsTab"), {
  loading: tabLoading,
});
const OrdersTab = dynamic(() => import("@/components/admin/products/OrdersTab"), {
  loading: tabLoading,
});

interface ProductsManagerClientProps {
  companyId: number;
  initialData: ShopAdminData;
}

/**
 * Administración de La Rioja Shop: pestañas Productos, Catálogos y líneas, y
 * Pedidos (cargadas con `next/dynamic`). El estado de catálogos/líneas/productos
 * vive aquí y se comparte entre pestañas; se actualiza en local sin refrescar
 * el payload RSC.
 */
export default function ProductsManagerClient({
  companyId,
  initialData,
}: ProductsManagerClientProps) {
  const [data, setData] = useState<ShopAdminData>(initialData);
  const [tab, setTab] = useState(0);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">La Rioja Shop</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Productos de los talleres, catálogos y pedidos recibidos en la tienda.
          </p>
        </div>
        <a
          href="/productos"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ExternalLink size={16} />
          Ver tienda
        </a>
      </div>

      <TabGroup index={tab} onIndexChange={setTab}>
        <TabList className="mt-4 overflow-x-auto whitespace-nowrap">
          <Tab icon={Package} className="text-sm sm:text-base whitespace-nowrap">
            Productos ({data.products.length})
          </Tab>
          <Tab icon={Layers} className="text-sm sm:text-base whitespace-nowrap">
            Catálogos y líneas
          </Tab>
          <Tab icon={ClipboardList} className="text-sm sm:text-base whitespace-nowrap">
            Pedidos
          </Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            {tab === 0 && <ProductsTab companyId={companyId} data={data} setData={setData} />}
          </TabPanel>
          <TabPanel>
            {tab === 1 && <CatalogsTab companyId={companyId} data={data} setData={setData} />}
          </TabPanel>
          <TabPanel>{tab === 2 && <OrdersTab companyId={companyId} />}</TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
}
