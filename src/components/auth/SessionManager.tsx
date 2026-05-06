"use client";

import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Client component that provides auto-logout functionality.
 * Renders the timeout dialog if the session expires.
 */
export function SessionManager() {
  const [timeoutMinutes, setTimeoutMinutes] = useState(30);
  const supabase = createClient();

  useEffect(() => {
    async function getSessionTimeout() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("user_companies")
        .select("companies(session_timeout_minutes)")
        .eq("user_id", user.id)
        .limit(1)
        .single();

      if (!error && data?.companies) {
        const minutes = (data.companies as any).session_timeout_minutes;
        if (minutes) {
          setTimeoutMinutes(minutes);
        }
      }
    }

    getSessionTimeout();
  }, [supabase]);

  const {} = useAutoLogout(timeoutMinutes);

  return null;
}
