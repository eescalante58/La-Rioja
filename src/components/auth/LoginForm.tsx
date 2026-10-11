"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Mail, Lock, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { login, signInWithOAuth } from "@/app/auth/actions";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { GoogleLoginButton } from "./GoogleLoginButton";
import { SystemBadge } from "./BrandPanel";

/** Mensajes para los códigos `?error=` que envía /auth/callback. */
const QUERY_ERRORS: Record<string, string> = {
  no_autorizado: "Esta cuenta no tiene acceso al sistema. Escribe al administrador.",
  oauth: "No se pudo iniciar sesión con Google. Intenta de nuevo o usa tu correo.",
};

interface LoginFormProps {
  /** Código de error recibido en la URL (`/login?error=...`). */
  errorCode?: string;
  /** Enlace "Escribe al administrador" (WhatsApp del CMS o mailto). */
  adminHref: string;
}

/**
 * Traduce el error de Supabase Auth a un mensaje claro. Ante credenciales
 * incorrectas no se indica qué campo falló.
 * @param raw - Mensaje original de Supabase.
 */
function friendlyLoginError(raw: string): string {
  if (raw === "Invalid login credentials") return "Correo o contraseña incorrectos.";
  if (/rate|too many/i.test(raw))
    return "Demasiados intentos. Espera un momento e intenta de nuevo.";
  return "No se pudo iniciar sesión. Intenta de nuevo.";
}

const inputClass =
  "h-12 w-full rounded-xl border bg-white pl-11 text-base sm:text-[15px] text-[#012060] placeholder:text-[#8A94A8] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0056b3] motion-reduce:transition-none dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500 dark:focus-visible:ring-larioja-amarillo";

/** Mensaje de error de campo: 13 px, rojo con icono. */
function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-center gap-1.5 text-[13px] text-[#C62828] dark:text-red-400"
    >
      <AlertCircle size={14} aria-hidden="true" className="shrink-0" />
      {children}
    </p>
  );
}

/**
 * Formulario de acceso al Sistema de gestión de Productos y Bingo: correo y contraseña
 * (con validación de formato del correo), login con Google y enlace
 * para pedir acceso al administrador.
 */
export function LoginForm({ errorCode, adminHref }: LoginFormProps) {
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorCode ? (QUERY_ERRORS[errorCode] ?? null) : null,
  );
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  /** Valida el formato del correo (vacío lo cubre `required`). */
  const validateEmail = (email: string) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      setEmailError(null);
      return true;
    }
    if (!re.test(email)) {
      setEmailError("Formato de correo electrónico no válido.");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    // Los requisitos de complejidad solo aplican al crear o cambiar la
    // contraseña (perfil y restablecimiento); aquí solo se verifican credenciales.
    if (!validateEmail(String(formData.get("email") ?? ""))) return;

    setLoading(true);
    // Si es correcto, la Server Action redirige a /auth/select-company.
    const result = await login(formData);
    if (result?.error) {
      setError(friendlyLoginError(result.error));
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setGoogleLoading(true);
    const result = await signInWithOAuth("google");
    if (result?.error) {
      setError(QUERY_ERRORS.oauth);
      setGoogleLoading(false);
    }
  };

  const busy = loading || googleLoading;

  return (
    <div className="relative mx-auto w-full max-w-[400px]">
      <div className="absolute -right-2 -top-2 sm:-right-4 sm:-top-4">
        <ThemeToggle />
      </div>

      {/* En celular el distintivo deja libre la esquina del botón de tema. */}
      <SystemBadge className="mb-3 max-w-[calc(100%-2.75rem)] sm:mb-4 sm:max-w-full lg:hidden" />
      <h1 className="pr-10 text-2xl font-semibold text-[#012060] dark:text-white">Inicia sesión</h1>
      <p className="mt-1 text-sm text-[#5A6782] dark:text-[#AAB3C2]">
        Acceso solo para personal autorizado.
      </p>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-xl border border-[#C62828]/30 sm:mt-5 bg-[#C62828]/5 px-3 py-2.5 text-[13px] text-[#C62828] dark:border-red-400/30 dark:bg-red-400/10 dark:text-red-300"
        >
          <AlertCircle size={16} aria-hidden="true" className="mt-px shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 sm:mt-6 sm:space-y-5">
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-[13px] font-medium text-[#012060] dark:text-gray-200"
          >
            Correo electrónico
          </label>
          <div className="relative">
            <Mail
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6782] dark:text-gray-400"
            />
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="ejemplo@correo.com"
              required
              onChange={(e) => {
                if (emailError) validateEmail(e.target.value);
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "email-error" : undefined}
              className={`${inputClass} pr-4 ${emailError ? "border-[#C62828]" : "border-[#C9D2E0] dark:border-gray-600"}`}
            />
          </div>
          {emailError && <FieldError id="email-error">{emailError}</FieldError>}
        </div>

        <div>
          <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <label
              htmlFor="password"
              className="text-[13px] font-medium text-[#012060] dark:text-gray-200"
            >
              Contraseña
            </label>
            <Link
              href="/auth/forgot-password"
              className="rounded text-[13px] font-medium text-[#0056b3] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0056b3] dark:text-[#6AB0FF] dark:focus-visible:ring-larioja-amarillo"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Lock
              size={18}
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#5A6782] dark:text-gray-400"
            />
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              required
              className={`${inputClass} pr-12 border-[#C9D2E0] dark:border-gray-600`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
              className="absolute right-1 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-lg text-[#5A6782] transition-colors hover:text-[#012060] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0056b3] motion-reduce:transition-none dark:text-gray-400 dark:hover:text-white dark:focus-visible:ring-larioja-amarillo"
            >
              {showPassword ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0056b3] sm:h-[52px] text-base font-medium text-white transition-colors hover:bg-[#004a9a] disabled:cursor-not-allowed disabled:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0056b3] focus-visible:ring-offset-2 motion-reduce:transition-none dark:focus-visible:ring-larioja-amarillo dark:focus-visible:ring-offset-gray-900"
        >
          {loading && <Loader2 size={18} className="animate-spin" aria-hidden="true" />}
          {loading ? "Ingresando…" : "Iniciar sesión"}
        </button>
      </form>

      <div
        className="mb-3 mt-4 flex items-center gap-3 sm:mb-3.5 sm:mt-5"
        role="separator"
        aria-label="o continúa con"
      >
        <span className="h-px flex-1 bg-[#E1E6EE] dark:bg-[#3A3F46]" aria-hidden="true" />
        <span className="text-[13px] text-[#5A6782] dark:text-[#AAB3C2]" aria-hidden="true">
          o continúa con
        </span>
        <span className="h-px flex-1 bg-[#E1E6EE] dark:bg-[#3A3F46]" aria-hidden="true" />
      </div>

      <GoogleLoginButton onSelect={handleGoogle} loading={googleLoading} disabled={busy} />

      <p className="mt-4 text-center text-[13px] text-[#5A6782] sm:mt-6 dark:text-[#AAB3C2]">
        ¿No tienes acceso?{" "}
        <a
          href={adminHref}
          target={adminHref.startsWith("http") ? "_blank" : undefined}
          rel={adminHref.startsWith("http") ? "noopener noreferrer" : undefined}
          className="rounded font-medium text-[#0056b3] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0056b3] dark:text-[#6AB0FF] dark:focus-visible:ring-larioja-amarillo"
        >
          Escribe al administrador
        </a>
      </p>
    </div>
  );
}
