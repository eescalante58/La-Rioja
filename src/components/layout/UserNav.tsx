"use client";

import { useState, useEffect, Fragment } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, Transition } from "@headlessui/react";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { createClient } from "@/lib/supabase/client"; // Cliente del lado del cliente
import { signOut } from "@/app/auth/actions";

interface UserProfile {
  full_name: string | null;
  email: string;
  avatar_url: string | null;
}

export default function UserNav() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("users")
          .select("full_name, email, avatar_url")
          .eq("id", user.id)
          .single();
        setUserProfile(profile as UserProfile);
      }
      setLoading(false);
    };

    fetchUserProfile();
  }, []);

  if (loading) {
    return (
      <div className="h-9 w-9 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
    );
  }

  if (!userProfile) {
    return null; // O un botón de login si el usuario no está autenticado
  }

  const initials = userProfile.full_name
    ? userProfile.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "??";

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="flex items-center gap-2 group rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 dark:focus:ring-offset-gray-800 focus:ring-larioja-azul">
          <div className="h-9 w-9 rounded-full bg-larioja-azul dark:bg-slate-800 overflow-hidden flex items-center justify-center text-white dark:text-white font-bold text-xs border-2 border-white dark:border-gray-800 shadow-sm">
            {userProfile.avatar_url ? (
              <Image
                src={userProfile.avatar_url}
                alt={userProfile.full_name || "Avatar"}
                width={36}
                height={36}
                className="object-cover"
              />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <ChevronDown
            size={16}
            className="text-gray-500 transition-transform duration-200 group-hover:text-gray-800 dark:group-hover:text-white"
            aria-hidden="true"
          />
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 focus:outline-none">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="font-bold text-gray-800 dark:text-white truncate">
              {userProfile.full_name || "Usuario"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {userProfile.email}
            </p>
          </div>
          <div className="p-1">
            <Menu.Item>
              {({ active }) => (
                <Link
                  href="/admin/profile"
                  className={`${active ? "bg-gray-100 dark:bg-gray-700" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm text-gray-700 dark:text-gray-300`}
                >
                  <UserIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                  Mi Perfil
                </Link>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <form action={signOut} className="w-full mt-1">
                  <button
                    type="submit"
                    className={`${active ? "bg-red-50 dark:bg-red-900/20" : ""} group flex w-full items-center rounded-md px-3 py-2 text-sm text-red-600`}
                  >
                    <LogOut className="mr-2 h-5 w-5" aria-hidden="true" />
                    Cerrar Sesión
                  </button>
                </form>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
