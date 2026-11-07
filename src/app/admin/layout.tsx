import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AdminSidebar } from "./AdminSidebar";
import { cookies } from "next/headers";
import { UserProvider } from "@/providers/UserProvider";
import UserNav from "@/components/layout/UserNav";
import { PermissionProvider } from "@/lib/security/permission-context";
import { getSessionAuthz } from "@/lib/security/server";

export const metadata: Metadata = {
  title: {
    default: "La Rioja - Centro de Formación Laboral",
    template: "%s | La Rioja Admin",
  },
};

/**
 * Administrative Layout component.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to render.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let cookieStore: Awaited<ReturnType<typeof cookies>>;
  try {
    cookieStore = await cookies();
  } catch (e) {
    console.error("[AdminLayout] cookies() error:", e instanceof Error ? e.message : String(e));
    throw e;
  }
  const selectedCompanyName = cookieStore.get("selected_company_name")?.value || "Empresa";

  // Cargar snapshot de permisos para el PermissionProvider del cliente.
  // getSessionAuthz siempre resuelve (nunca rechaza); retorna null si el hook
  // no está activo o el RPC falla — el provider opera sin snapshot.
  let authzSession: Awaited<ReturnType<typeof getSessionAuthz>> = null;
  try {
    authzSession = await getSessionAuthz();
  } catch (e) {
    console.error(
      "[AdminLayout] getSessionAuthz error:",
      e instanceof Error ? e.message : String(e),
    );
  }

  return (
    <UserProvider>
      <PermissionProvider
        snapshot={authzSession?.snapshot ?? null}
        userId={authzSession?.userId ?? null}
      >
        <div className="flex h-screen bg-gray-50 dark:bg-black transition-colors">
          <AdminSidebar companyName={selectedCompanyName} />

          {/* Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <header className="h-16 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 transition-colors">
              <div className="flex items-center gap-3">
                <Link
                  href="/"
                  className="flex items-center gap-3 group hover:opacity-80 transition-opacity ml-10 md:ml-0"
                >
                  <Building2
                    size={22}
                    className="text-larioja-azul dark:text-slate-200 group-hover:scale-105 transition-transform"
                  />
                  <span className="text-lg md:text-xl font-bold tracking-tight text-larioja-azul dark:text-white truncate max-w-[150px] sm:max-w-none">
                    {selectedCompanyName}
                  </span>
                </Link>
              </div>

              <div className="flex items-center gap-4 ml-auto">
                <ThemeToggle />
                <UserNav />
              </div>
            </header>

            {/* Content Area */}
            <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">{children}</main>
          </div>
        </div>
      </PermissionProvider>
    </UserProvider>
  );
}
