"use client";

import { useEffect, useState } from "react";

/**
 * Client component to render the current year.
 * Prevents hydration mismatches and caching issues in Server Components.
 */
export default function DynamicYear() {
  const [year, setYear] = useState<number | null>(null);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return <span>{year || "..."}</span>;
}
