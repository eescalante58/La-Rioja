"use client";

import { useState, useEffect } from "react";
import { Card, Title, Text, Button, TextInput, Callout } from "@tremor/react";
import { Lock, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { updatePassword } from "../actions";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

/**
 * Reset Password page component.
 * @returns {JSX.Element} The reset password page.
 */
export default function ResetPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<
    string | null
  >(null);
  const router = useRouter();

  useEffect(() => {
    // Check if we have a session (from recovery link)
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        setError(
          "No se detectó una sesión activa. Asegúrate de usar el enlace enviado a tu correo o solicita uno nuevo.",
        );
      }
    });
  }, []);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) {
      setPasswordError("Mínimo 8 caracteres");
      return false;
    }
    if (!/[A-Z]/.test(pass)) {
      setPasswordError("Falta Mayúscula");
      return false;
    }
    if (!/[0-8]/.test(pass)) {
      setPasswordError("Falta dígito 0-8");
      return false;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pass)) {
      setPasswordError("Falta carácter especial");
      return false;
    }
    setPasswordError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setConfirmPasswordError(null);

    const isPassValid = validatePassword(password);
    if (!isPassValid) return;

    if (password !== confirmPassword) {
      setConfirmPasswordError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    const result = await updatePassword(password);

    if (result?.error) {
      const msg =
        result.error === "Auth session missing!"
          ? "La sesión ha expirado o es inválida. Por favor, solicita un nuevo enlace de recuperación."
          : result.error;
      setError(msg);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-larioja-gradient p-4 transition-colors relative overflow-hidden">
      {/* Soften the background saturation */}
      <div className="absolute inset-0 bg-white/20 dark:bg-black/40 pointer-events-none" />

      <div className="absolute top-4 right-4 z-50 bg-white/10 backdrop-blur-md p-1 rounded-xl border border-white/20 shadow-lg">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">
        <Card className="p-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-xl border-2 border-white/20 dark:border-gray-800 rounded-2xl">
          <div className="text-center mb-6">
            <div className="relative h-16 w-48 mx-auto mb-4">
              <Image
                src="/logo.png"
                alt="La Rioja Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <Title className="text-xl font-bold text-larioja-azul dark:text-larioja-amarillo">
              Nueva Contraseña
            </Title>
            <Text className="text-xs text-gray-500 mt-2">
              Ingresa tu nueva contraseña y confírmala para continuar.
            </Text>
          </div>

          {error && (
            <Callout
              className="mb-4 py-2"
              title="Error"
              icon={AlertCircle}
              color="rose"
            >
              <span className="text-xs font-bold text-red-600">{error}</span>
            </Callout>
          )}

          {success ? (
            <div className="text-center space-y-4">
              <Callout
                title="Contraseña actualizada"
                icon={CheckCircle}
                color="emerald"
              >
                Tu contraseña ha sido cambiada con éxito. Redirigiendo al
                login...
              </Callout>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1">
                  Nueva Contraseña
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      validatePassword(e.target.value);
                    }}
                    placeholder="••••••••"
                    required
                    className={`w-full pl-10 pr-12 py-2 bg-gray-50 dark:bg-gray-800 border ${passwordError ? "border-red-500" : "border-gray-200 dark:border-gray-700"} rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-larioja-azul transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <PasswordRequirements password={password} />
                {passwordError && (
                  <p className="text-[10px] text-red-500 ml-2">
                    {passwordError}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={() => {
                      if (password !== confirmPassword) {
                        setConfirmPasswordError("Las contraseñas no coinciden");
                      } else {
                        setConfirmPasswordError(null);
                      }
                    }}
                    placeholder="••••••••"
                    required
                    className={`w-full pl-10 pr-12 py-2 bg-gray-50 dark:bg-gray-800 border ${confirmPasswordError ? "border-red-500" : "border-gray-200 dark:border-gray-700"} rounded-xl text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-larioja-azul transition-all`}
                  />
                </div>
                {confirmPasswordError && (
                  <p className="text-[10px] text-red-500 ml-2">
                    {confirmPasswordError}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full py-2 bg-larioja-azul hover:bg-blue-800 text-white rounded-xl shadow-lg transition-all"
                loading={loading}
              >
                Actualizar Contraseña
              </Button>

              <Link
                href="/auth/forgot-password"
                title="Solicitar nuevo enlace"
                className="block text-center mt-2"
              >
                <span className="text-[10px] text-gray-400 hover:underline">
                  ¿El enlace no funciona? Solicita uno nuevo aquí.
                </span>
              </Link>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
