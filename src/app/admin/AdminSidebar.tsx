"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
import { createClient } from "@/lib/supabase/client";
import { signOut } from "../auth/actions";

interface AdminSidebarProps {
  companyName: string;
}

/**
 * Client component for the Admin Sidebar with mobile support.
 */
export function AdminSidebar({ companyName }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    const fetchProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from("users")
          .select("full_name, avatar_url, email")
          .eq("id", user.id)
          .single();
        setUserProfile(data);
      }
    };
    fetchProfile();
  }, []);

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
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-black border-r border-gray-200 dark:border-gray-800 transition-colors">
        <div className="p-6">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-xl font-bold text-larioja-azul dark:text-white">
              La Rioja Admin
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                pathname === link.href
                  ? "bg-larioja-azul text-white dark:bg-slate-800 dark:text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-900"
              }`}
            >
              <link.icon size={18} />
              <span>{link.label}</span>
            </Link>
          ))}

          <div className="pt-8 border-t border-gray-100 dark:border-gray-800 mt-4">
            <form action={signOut}>
              <button
                type="submit"
                className="flex items-center gap-3 px-4 py-2 w-full text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors font-medium"
              >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
              </button>
            </form>
          </div>
        </nav>
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
        className={`md:hidden fixed inset-y-0 left-0 w-72 bg-white dark:bg-black z-[110] transition-transform duration-300 transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
          <span className="text-xl font-bold text-larioja-azul dark:text-white">
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
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center gap-4 bg-gray-50/50 dark:bg-slate-900/30">
          <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-larioja-azul dark:border-slate-800 flex items-center justify-center bg-larioja-azul text-white font-bold">
            {userProfile?.avatar_url ? (
              <Image
                src={userProfile.avatar_url}
                alt={userProfile.full_name || "Profile"}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{initials}</span>
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

        <div className="p-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="bg-larioja-azul dark:bg-slate-800 p-2 rounded-lg text-white">
              <Building2 size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-gray-400">
                Empresa Actual
              </span>
              <span className="font-bold text-sm text-larioja-azul dark:text-white truncate max-w-[180px]">
                {companyName}
              </span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-2 overflow-y-auto">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-4 px-4 py-4 rounded-xl transition-colors ${
                pathname === link.href
                  ? "bg-larioja-azul text-white dark:bg-slate-800 dark:text-white shadow-lg shadow-larioja-azul/10"
                  : "text-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-900"
              }`}
            >
              <link.icon size={22} />
              <span className="font-medium text-lg">{link.label}</span>
            </Link>
          ))}

          <div className="pt-20 border-t border-gray-100 dark:border-gray-800 mt-10 mb-10">
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
