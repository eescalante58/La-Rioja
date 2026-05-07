"use client";

import { useState } from "react";
import { Card, Title, Button, Callout } from "@tremor/react";
import {
  LogIn,
  Mail,
  Lock,
  AlertCircle,
  Facebook,
  Twitter,
  Chrome,
  Eye,
  EyeOff,
} from "lucide-react";
import { login, signInWithOAuth } from "../auth/actions";
import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";

/**
 * Login page component with updated UI and strict validations.
 * @returns {JSX.Element} The login page.
 */
export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    // Basic format validation: characters before @, domain, and TLD
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!email) {
      setEmailError(null);
      return true; // Don't show error if empty, 'required' handles it
    }

    if (!re.test(email)) {
      setEmailError("Formato de correo electrónico no válido");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError(null);
      return true; // Don't show error if empty, 'required' handles it
    }
    // 8 characters min
    if (password.length < 8) {
      setPasswordError("La contraseña debe tener al menos 8 caracteres");
      return false;
    }
    // At least one uppercase
    if (!/[A-Z]/.test(password)) {
      setPasswordError("Debe incluir al menos una letra mayúscula");
      return false;
    }
    // Digits 0-9
    if (!/[0-9]/.test(password)) {
      setPasswordError("Debe incluir al menos un dígito (0-9)");
      return false;
    }
    // Special character
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      setPasswordError("Debe incluir al menos un carácter especial");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);

    if (!isEmailValid || !isPasswordValid) return;

    setLoading(true);
    const result = await login(formData);

    if (result?.error) {
      const msg =
        result.error === "Invalid login credentials"
          ? "Credenciales inválidas"
          : result.error;
      setError(msg);
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "facebook" | "twitter") => {
    setError(null);
    const result = await signInWithOAuth(provider);
    if (result?.error) {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-larioja-gradient p-4 transition-colors relative">
      <div className="absolute top-4 right-4 z-50 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20 shadow-lg">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Card className="p-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-2xl border-2 border-white/20 dark:border-gray-800 rounded-3xl">
          {/* Logo & Header */}
          <div className="text-center mb-6">
            <Link
              href="/"
              className="inline-block relative h-16 w-48 mx-auto mb-4 hover:opacity-80 transition-opacity"
            >
              <Image
                src="/logo.png"
                alt="La Rioja Logo"
                fill
                className="object-contain"
                priority
              />
            </Link>
            <Title className="text-xl font-bold text-larioja-azul dark:text-larioja-amarillo">
              Inicio de sesión
            </Title>
          </div>

          {error && (
            <Callout
              className="mb-4 py-2"
              title="Error"
              icon={AlertCircle}
              color="rose"
            >
              <span className="text-xs font-bold text-red-600 uppercase">
                {error}
              </span>
            </Callout>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label
                htmlFor="email"
                className="text-xs font-semibold text-gray-700 dark:text-gray-300 ml-1"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  size={18}
                  aria-hidden="true"
                />
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  required
                  onChange={(e) => {
                    if (emailError) validateEmail(e.target.value);
                  }}
                  onBlur={(e) => validateEmail(e.target.value)}
                  aria-invalid={!!emailError}
                  aria-describedby={emailError ? "email-error" : undefined}
                  className={`w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border ${emailError ? "border-red-600" : "border-gray-300 dark:border-gray-600"} rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-larioja-azul dark:focus:ring-larioja-amarillo outline-none transition-all`}
                />
              </div>
              {emailError && (
                <p
                  id="email-error"
                  className="text-[11px] text-red-700 font-medium ml-2"
                >
                  {emailError}
                </p>
              )}
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center px-1">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-gray-700 dark:text-gray-300"
                >
                  Contraseña
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[11px] text-larioja-azul dark:text-larioja-amarillo hover:underline font-bold"
                >
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
                  size={18}
                  aria-hidden="true"
                />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={(e) => validatePassword(e.target.value)}
                  aria-invalid={!!passwordError}
                  aria-describedby={
                    passwordError ? "password-error" : undefined
                  }
                  className={`w-full pl-10 pr-12 py-2 bg-gray-50 dark:bg-gray-800 border ${passwordError ? "border-red-600" : "border-gray-300 dark:border-gray-600"} rounded-xl text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-larioja-azul dark:focus:ring-larioja-amarillo outline-none transition-all`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors focus:ring-2 focus:ring-larioja-azul rounded-md p-1"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <PasswordRequirements password={password} />
              {passwordError && (
                <p
                  id="password-error"
                  className="text-[11px] text-red-700 font-medium ml-2"
                >
                  {passwordError}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full py-2 bg-larioja-azul hover:bg-blue-800 text-white rounded-xl shadow-lg transition-all focus:ring-2 focus:ring-offset-2 focus:ring-larioja-azul"
              loading={loading}
              icon={LogIn}
            >
              Iniciar Sesión
            </Button>

            <Link href="/" className="block">
              <Button
                type="button"
                variant="light"
                className="w-full text-xs text-gray-600 hover:text-larioja-azul transition-colors font-medium"
              >
                Volver a la página principal
              </Button>
            </Link>
          </form>

          {/* Single line Divider */}
          <div
            className="relative my-6 text-center"
            role="separator"
            aria-label="Opciones de inicio de sesión alternativo"
          >
            <div
              className="absolute inset-0 flex items-center"
              aria-hidden="true"
            >
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <span className="relative px-3 text-[11px] uppercase font-bold text-gray-600 bg-white dark:bg-gray-900">
              O continuar con
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              aria-label="Iniciar sesión con Google"
              className="flex items-center justify-center p-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group focus:ring-2 focus:ring-larioja-azul"
            >
              <Chrome
                className="text-gray-600 group-hover:text-red-600 transition-colors"
                size={20}
              />
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("facebook")}
              aria-label="Iniciar sesión con Facebook"
              className="flex items-center justify-center p-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group focus:ring-2 focus:ring-larioja-azul"
            >
              <Facebook
                className="text-gray-600 group-hover:text-blue-600 transition-colors"
                size={20}
              />
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("twitter")}
              aria-label="Iniciar sesión con X (Twitter)"
              className="flex items-center justify-center p-2 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-all group focus:ring-2 focus:ring-larioja-azul"
            >
              <Twitter
                className="text-gray-600 group-hover:Sky-500 transition-colors"
                size={20}
              />
            </button>
          </div>

          <p className="mt-6 text-center text-[10px] text-gray-400">
            ¿No tienes acceso? Contacta al administrador.
          </p>
        </Card>
      </div>
    </div>
  );
}
