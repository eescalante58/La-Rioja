"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

/**
 * Hook to manage automatic session logout after inactivity.
 * @param {number} timeoutMinutes - Number of minutes of inactivity before logout.
 */
export function useAutoLogout(timeoutMinutes: number = 30) {
  const router = useRouter();
  const supabase = createClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(async () => {
    console.log("Sesión expirada por inactividad. Cerrando sesión...");
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }, [supabase.auth, router]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    
    // Convert minutes to milliseconds
    const timeoutMs = timeoutMinutes * 60 * 1000;
    
    timerRef.current = setTimeout(() => {
      logout();
    }, timeoutMs);
  }, [timeoutMinutes, logout]);

  useEffect(() => {
    // Events that indicate user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click"
    ];

    const handleActivity = () => {
      resetTimer();
    };

    // Initialize timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Cleanup
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [resetTimer]);
}
