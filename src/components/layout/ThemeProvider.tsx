"use client";

import React from "react";
import {
  ThemeProvider as NextThemesProvider,
  type ThemeProviderProps,
} from "next-themes";

/**
 * Theme Provider component for managing light/dark modes.
 * @param {ThemeProviderProps} props - Provider props.
 * @returns {JSX.Element} The provider wrapper.
 */
export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
