"use client";

import { Check, X } from "lucide-react";

interface Requirement {
  label: string;
  met: boolean;
}

interface PasswordRequirementsProps {
  password: string;
}

/**
 * Component to display password validation requirements and their status.
 * @param {PasswordRequirementsProps} props - Component props.
 * @returns {JSX.Element} The rendered requirements list.
 */
export function PasswordRequirements({ password }: PasswordRequirementsProps) {
  const requirements: Requirement[] = [
    {
      label: "Mínimo 8 caracteres",
      met: password.length >= 8,
    },
    {
      label: "Al menos una letra mayúscula",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Al menos un dígito (0-9)",
      met: /[0-9]/.test(password),
    },
    {
      label: "Al menos un carácter especial",
      met: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    },
  ];

  return (
    <div className="mt-2 space-y-1.5 px-1">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">
        Requisitos de seguridad:
      </p>
      <div className="grid grid-cols-1 gap-1">
        {requirements.map((req, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className={`flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors ${
                req.met
                  ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                  : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
              }`}
            >
              {req.met ? (
                <Check size={10} strokeWidth={3} />
              ) : (
                <X size={10} strokeWidth={3} />
              )}
            </div>
            <span
              className={`text-[11px] transition-colors ${
                req.met
                  ? "text-emerald-700 dark:text-emerald-400 font-medium"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              {req.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
