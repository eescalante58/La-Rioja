"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Ticket,
  X,
  Menu as MenuIcon,
  Building2,
} from "lucide-react";
import { signOut } from "../auth/actions";

interface AdminSidebarProps {
  companyName: string;
  userProfile: {
    full_name: string | null;
    avatar_url: string | null;
    email: string;
  } | null;
}

/**
 * Client component for the Admin Sidebar with mobile support.
 */
export function AdminSidebar({ companyName, userProfile }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Block scroll when mobile sidebar is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const navLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/cms", label: "Gestión CMS", icon: FileText },
    { href: "/admin/settings", label: "Configuración", icon: Settings },
    { href: "/admin/bingo", label: "Gestión Bingo", icon: Ticket },
  ];

  return (
    <>
      {/* Mobile Header Toggle */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 p-2 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 text-gray-500 shadow-sm"
      >
        <MenuIcon size={24} />
      </button>

      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-colors">
        <div className="p-6">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-bold text-larioja-azul dark:text-larioja-amarillo">
              La Rioja Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                pathname === link.href
                  ? "bg-larioja-azul text-white dark:bg-larioja-amarillo dark:text-larioja-azul"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <link.icon size={20} />
              <span>{link.label}</span>
            </Link>
          ))}
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

      {/* Mobile Sidebar Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Sidebar Content */}
      <aside
        className={`md:hidden fixed inset-y-0 left-0 w-72 bg-white dark:bg-gray-950 z-[110] transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <span className="text-xl font-bold text-larioja-azul dark:text-larioja-amarillo">
            Menú Admin
          </span>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 text-gray-500 hover:text-gray-900 dark:hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        {/* Mobile User Profile Section */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 bg-gray-50/50 dark:bg-gray-900/30">
          <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-larioja-azul dark:border-larioja-amarillo flex items-center justify-center bg-larioja-azul text-white font-bold">
            {userProfile?.avatar_url ? (
              <img
                src={userProfile.avatar_url}
                alt={userProfile.full_name || "Profile"}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>
                {userProfile?.full_name
                  ? userProfile.full_name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "???"}
              </span>
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-gray-900 dark:text-white truncate">
              {userProfile?.full_name || "Usuario"}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {userProfile?.email}
            </span>
          </div>
        </div>

        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-larioja-amarillo p-2 rounded-lg text-larioja-azul">
              <Building2 size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-400">
                Empresa Actual
              </span>
              <span className="font-bold text-sm text-larioja-azul dark:text-larioja-amarillo truncate max-w-[180px]">
                {companyName}
              </span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-colors ${
                pathname === link.href
                  ? "bg-larioja-azul text-white shadow-lg shadow-larioja-azul/20"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              <link.icon size={24} />
              <span className="font-medium text-lg">{link.label}</span>
            </Link>
          ))}

          <div className="pt-12 border-t border-gray-100 dark:border-gray-800 mt-6">
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-4 px-4 py-4 w-full text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-colors"
              >
                <LogOut size={24} />
                <span className="text-lg">Cerrar Sesión</span>
              </button>
            </form>
          </div>
        </nav>
      </aside>
    </>
  );
}
