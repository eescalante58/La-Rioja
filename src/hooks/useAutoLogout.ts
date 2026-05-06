"use client";

import { useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Dialog,
  DialogPanel,
  Title,
  Text,
  Button,
} from "@tremor/react";
import { AlertCircle } from "lucide-react";

/**
 * Hook to manage automatic session logout after inactivity.
 * @param {number} timeoutMinutes - Number of minutes of inactivity before logout.
 */
export function useAutoLogout(timeoutMinutes: number = 30) {
  const router = useRouter();
  const supabase = createClient();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [showTimeoutDialog, setShowTimeoutDialog] = useState(false);

  const logout = useCallback(async () => {
    console.log("Sesión expirada por inactividad. Mostrando diálogo...");
    await supabase.auth.signOut();
    setShowTimeoutDialog(true);
  }, [supabase.auth]);

  const handleRedirectToLogin = () => {
    setShowTimeoutDialog(false);
    router.push("/login");
    router.refresh();
  };

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

  return {
    TimeoutDialog: (
      <Dialog
        open={showTimeoutDialog}
        onClose={() => handleRedirectToLogin()}
        static={true}
      >
        <DialogPanel className="max-w-md">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="bg-rose-100 p-3 rounded-full">
              <AlertCircle className="h-8 w-8 text-rose-600" />
            </div>
            <Title className="text-xl font-bold">Sesión Expirada</Title>
            <Text>
              Tu sesión ha finalizado debido a un periodo de inactividad de{" "}
              <strong>{timeoutMinutes} minutos</strong>.
            </Text>
            <Text className="text-sm text-gray-500">
              Por favor, inicia sesión nuevamente para continuar trabajando.
            </Text>
            <Button
              className="w-full bg-larioja-azul hover:bg-blue-800"
              onClick={() => handleRedirectToLogin()}
            >
              Ir al Login
            </Button>
          </div>
        </DialogPanel>
      </Dialog>
    ),
  };
}
