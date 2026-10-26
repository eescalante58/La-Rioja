import React from "react";
import { Users } from "lucide-react";
import type { MatriculaCuposConfig } from "@/lib/validation/matricula";

interface MatriculaCuposBadgeProps {
  cuposConfig: MatriculaCuposConfig | null;
  titleTemplate?: string | null;
}

/**
 * Insignia de cupos disponibles, compuesta dentro del Hero de Matrícula.
 */
export function MatriculaCuposBadge({ cuposConfig, titleTemplate }: MatriculaCuposBadgeProps) {
  if (!cuposConfig || !cuposConfig.show_count) {
    return null;
  }

  const count = cuposConfig.count;
  const isAvailable = count > 0;
  const label = isAvailable
    ? (titleTemplate || "{count} cupos disponibles").replace(/\{count\}/g, String(count))
    : cuposConfig.zero_label || "Cupos agotados";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-brand-yellow/40 bg-brand-yellow/15 px-3.5 py-1.5 backdrop-blur-xs font-montserrat">
      <span className="flex h-2 w-2 rounded-full bg-brand-yellow animate-pulse" aria-hidden="true" />
      <span className="text-xs font-bold uppercase tracking-wider text-white">
        {label}
      </span>
      {cuposConfig.updated_label && (
        <span className="hidden sm:inline text-[11px] text-white/70">
          · {cuposConfig.updated_label}
        </span>
      )}
    </div>
  );
}
