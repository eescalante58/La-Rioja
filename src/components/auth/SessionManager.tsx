"use client";

import { useAutoLogout } from "@/hooks/useAutoLogout";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

/** Respuesta de `GET /api/auth/session-config`. */
interface SessionConfigResponse {
  success: boolean;
  timeout_minutes?: number;
  error?: string;
}

/**
 * Client component that provides auto-logout functionality.
 * Solo se activa cuando hay una sesión de Supabase: en páginas públicas
 * sin sesión no consulta la configuración ni arma el temporizador.
 */
export function SessionManager() {
  const [timeoutMinutes, setTimeoutMinutes] = useState(30);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // getSession lee la sesión local (sin red); onAuthStateChange cubre login/logout.
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(Boolean(data.session));
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasSession) return;

    async function getSessionTimeout() {
      try {
        const res = await fetch("/api/auth/session-config");
        const contentType = res.headers.get("content-type") ?? "";
        if (!res.ok || !contentType.includes("application/json")) return;

        const result = (await res.json()) as SessionConfigResponse;
        if (result.success && result.timeout_minutes) {
          setTimeoutMinutes(result.timeout_minutes);
        }
      } catch (error) {
        console.warn("No se pudo obtener el timeout de sesión:", error);
      }
    }

    getSessionTimeout();
  }, [hasSession]);

  useAutoLogout(timeoutMinutes, hasSession);

  return null;
}
