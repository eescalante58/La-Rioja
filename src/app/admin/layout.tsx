import Link from "next/link";
import { Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AdminSidebar } from "./AdminSidebar";
import { cookies } from "next/headers";

/**
 * Administrative Layout component.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to render.
 */
export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const selectedCompanyName =
    cookies().get("selected_company_name")?.value || "Empresa";

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 transition-colors">
      <AdminSidebar companyName={selectedCompanyName} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 transition-colors">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-3 group hover:opacity-80 transition-opacity ml-10 md:ml-0"
            >
              <Building2
                size={22}
                className="text-larioja-azul dark:text-larioja-amarillo group-hover:scale-110 transition-transform"
              />
              <span className="text-lg md:text-xl font-black tracking-tight text-larioja-azul dark:text-larioja-amarillo truncate max-w-[150px] sm:max-w-none">
                {selectedCompanyName}
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <ThemeToggle />
            <div className="h-8 w-8 rounded-full bg-larioja-azul text-white flex items-center justify-center font-bold text-xs">
              AD
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
