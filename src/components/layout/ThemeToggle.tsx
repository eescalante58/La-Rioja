"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Button component to toggle between light and dark themes.
 * @returns {JSX.Element} The theme toggle button.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Avoid hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Exponer el botón interactivo únicamente tras el montaje y cuando resolvedTheme sea light o dark
  if (!mounted || (resolvedTheme !== "light" && resolvedTheme !== "dark")) {
    return <div className="w-9 h-9" aria-hidden="true" />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-larioja-azul dark:focus-visible:outline-larioja-amarillo cursor-pointer"
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {isDark ? (
        <Sun className="h-5 w-5 text-larioja-amarillo" aria-hidden="true" />
      ) : (
        <Moon className="h-5 w-5 text-larioja-azul" aria-hidden="true" />
      )}
    </button>
  );
}
