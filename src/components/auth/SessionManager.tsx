"use client";

import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useEffect, useState } from "react";

/**
 * Client component that provides auto-logout functionality.
 * Renders the timeout dialog if the session expires.
 */
export function SessionManager() {
  const [timeoutMinutes, setTimeoutMinutes] = useState(30);

  useEffect(() => {
    async function getSessionTimeout() {
      try {
        const res = await fetch("/api/auth/session-config");
        const result = await res.json();
        
        if (result.success && result.timeout_minutes) {
          setTimeoutMinutes(result.timeout_minutes);
        }
      } catch (error) {
        console.error("Error fetching session timeout:", error);
      }
    }

    getSessionTimeout();
  }, []);

  const {} = useAutoLogout(timeoutMinutes);

  return null;
}
