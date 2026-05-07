"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Hook to manage automatic session logout after inactivity.
 * @param {number} timeoutMinutes - Number of minutes of inactivity before logout.
 */
export function useAutoLogout(timeoutMinutes: number = 30) {
  const supabase = createClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(async () => {
    console.log("Sesión expirada por inactividad. Disparando alerta...");

    // Log the auto-logout event before signing out
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase.from("user_activity_log").insert({
        user_id: user.id,
        action: "AUTO_LOGOUT",
        entity: "users",
        metadata: {
          reason: "inactivity",
          timeout_minutes: timeoutMinutes,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Cerrar sesión en Supabase
    await supabase.auth.signOut();

    // Alerta nativa (bloqueante) que asegura que el usuario vea el mensaje
    alert(
      `Su sesión ha expirado por inactividad (${timeoutMinutes} minutos). Por favor inicie sesión de nuevo.`,
    );

    // Redirección forzada usando window.location para evitar problemas de ruteo interno
    window.location.href = "/login";
  }, [supabase.auth, timeoutMinutes]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    const timeoutMs = timeoutMinutes * 60 * 1000;

    timerRef.current = setTimeout(() => {
      logout();
    }, timeoutMs);
  }, [timeoutMinutes, logout]);

  useEffect(() => {
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    const handleActivity = () => {
      resetTimer();
    };

    resetTimer();

    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer]);

  return {};
}
