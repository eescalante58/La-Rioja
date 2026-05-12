import Link from "next/link";
import { Building2 } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { AdminSidebar } from "./AdminSidebar";
import { cookies } from "next/headers";
import { UserProvider } from "@/providers/UserProvider";
import UserNav from "@/components/layout/UserNav";

/**
 * Administrative Layout component.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to render.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const selectedCompanyName =
    cookies().get("selected_company_name")?.value || "Empresa";

  return (
    <UserProvider>
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
                  className="text-larioja-azul dark:text-slate-200 group-hover:scale-110 transition-transform"
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
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </UserProvider>
  );
}
