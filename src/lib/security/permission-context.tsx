"use client";
// lib/security/permission-context.tsx — proveedor, hook usePermission y componente <Can>

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { canOption, canResource, type Action, type PermissionSnapshot } from "./types";

const PermissionContext = createContext<PermissionSnapshot | null>(null);

interface ProviderProps {
  /** Snapshot resuelto en el servidor (layout raíz): cero peticiones extra en el cliente. */
  snapshot: PermissionSnapshot | null;
  userId: string | null;
  children: ReactNode;
}

export function PermissionProvider({ snapshot, userId, children }: ProviderProps) {
  const router = useRouter();

  // Invalidación en vivo: si cambian mis permisos, refresco el JWT y re-renderizo el servidor
  useEffect(() => {
    if (!userId) return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    );
    const channel = supabase
      .channel(`authz:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "sec_authz_version",
          filter: `user_id=eq.${userId}`,
        },
        async () => {
          await supabase.auth.refreshSession(); // nuevo JWT con app_authz.v actualizado
          router.refresh(); // el layout vuelve a pedir el snapshot con la nueva versión
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, router]);

  return <PermissionContext.Provider value={snapshot}>{children}</PermissionContext.Provider>;
}

export function usePermission(optionCode: string) {
  const snap = useContext(PermissionContext);
  return useMemo(
    () => ({
      /** ¿Puede abrir la pantalla? */
      canView: canOption(snap, optionCode, "READ"),
      /** Sin tabla = nivel opción; con tabla = nivel entidad. */
      can: (action: Action, table?: string) =>
        table ? canResource(snap, optionCode, table, action) : canOption(snap, optionCode, action),
      isSuperAdmin: snap?.sa ?? false,
      /** true cuando el usuario tiene un snapshot del módulo avanzado; false = solo sistema legacy. */
      hasSnapshot: snap !== null,
    }),
    [snap, optionCode],
  );
}

interface CanProps {
  option: string;
  action: Action;
  table?: string;
  /** Qué mostrar si no tiene permiso (por defecto, nada). */
  fallback?: ReactNode;
  children: ReactNode;
}

export function Can({ option, action, table, fallback = null, children }: CanProps) {
  const { can } = usePermission(option);
  return <>{can(action, table) ? children : fallback}</>;
}
