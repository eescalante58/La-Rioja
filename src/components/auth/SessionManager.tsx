"use client";

import { useAutoLogout } from "@/hooks/useAutoLogout";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Client component that provides auto-logout functionality.
 * Renders nothing, just runs the hook.
 */
export function SessionManager() {
  const [timeoutMinutes, setTimeoutMinutes] = useState(30);
  const supabase = createClient();

  useEffect(() => {
    async function getSessionTimeout() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch the timeout from the company associated with the user
      // Note: This assumes the user belongs to at least one company
      // and we use the first one's setting.
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

  useAutoLogout(timeoutMinutes);

  return null;
}
