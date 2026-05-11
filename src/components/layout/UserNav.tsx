"use client";

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { LogOut, User as UserIcon, ChevronDown } from 'lucide-react';
import { signOut } from '@/app/auth/actions';

interface UserNavProps {
  userProfile: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

export default function UserNav({ userProfile }: UserNavProps) {
  const [isOpen, setIsOpen] = useState(false);

  const initials = userProfile.full_name
    ? userProfile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="flex items-center gap-2 group">
        <div className="h-9 w-9 rounded-full bg-larioja-azul dark:bg-slate-800 overflow-hidden flex items-center justify-center text-white dark:text-white font-bold text-xs border-2 border-white dark:border-gray-800 shadow-sm">
          {userProfile.avatar_url ? (
            <Image src={userProfile.avatar_url} alt={userProfile.full_name || 'Avatar'} width={36} height={36} className="object-cover" />
          ) : (
            <span>{initials}</span>
          )}
        </div>
        <ChevronDown size={16} className={`text-gray-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50 animate-fade-in-down">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <p className="font-bold text-gray-800 dark:text-white truncate">{userProfile.full_name || 'Usuario'}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{userProfile.email}</p>
          </div>
          <nav className="p-2">
            <Link href="/admin/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
              <UserIcon size={16} />
              <span>Mi Perfil</span>
            </Link>
            <form action={signOut} className="w-full">
              <button type="submit" className="flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md w-full text-left mt-1">
                <LogOut size={16} />
                <span>Cerrar Sesión</span>
              </button>
            </form>
          </nav>
        </div>
      )}
    </div>
  );
}
