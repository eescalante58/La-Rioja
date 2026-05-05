import Link from "next/link";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Menu,
  Ticket,
  Building2,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { signOut } from "../auth/actions";
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
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-colors">
        <div className="p-6">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-bold text-larioja-azul dark:text-larioja-amarillo">
              La Rioja Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <Link
            href="/admin"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/admin/cms"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FileText size={20} />
            <span>Gestión CMS</span>
          </Link>
          <Link
            href="/admin/settings"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Settings size={20} />
            <span>Configuración</span>
          </Link>
          <Link
            href="/admin/bingo"
            className="flex items-center gap-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Ticket size={20} />
            <span>Gestión Bingo</span>
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800">
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-3 px-4 py-2 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
            >
              <LogOut size={20} />
              <span>Cerrar Sesión</span>
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 transition-colors">
          <button className="md:hidden text-gray-500">
            <Menu size={24} />
          </button>

          <Link
            href="/"
            className="flex items-center gap-3 group hover:opacity-80 transition-opacity"
          >
            <Building2
              size={22}
              className="text-larioja-azul dark:text-larioja-amarillo group-hover:scale-110 transition-transform"
            />
            <span className="text-xl font-black tracking-tight text-larioja-azul dark:text-larioja-amarillo">
              {selectedCompanyName}
            </span>
          </Link>

          <div className="flex items-center gap-4 ml-auto">
            <ThemeToggle />
            <div className="h-8 w-8 rounded-full bg-larioja-azul text-white flex items-center justify-center font-bold text-xs">
              AD
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
