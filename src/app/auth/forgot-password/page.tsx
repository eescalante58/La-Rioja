"use client";

import { useState } from "react";
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  TextInput,
  Callout
} from "@tremor/react";
import { 
  Mail, 
  AlertCircle,
  ArrowLeft,
  CheckCircle
} from "lucide-react";
import { resetPasswordForEmail } from "../actions";
import Link from "next/link";
import Image from "next/image";

/**
 * Forgot Password page component.
 * @returns {JSX.Element} The forgot password page.
 */
export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    const result = await resetPasswordForEmail(email);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-larioja-gradient p-4 transition-colors">
      <div className="w-full max-w-md">
        <Card className="p-6 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm shadow-2xl border-2 border-white/20 dark:border-gray-800 rounded-3xl">
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
              Recuperar Contraseña
            </Title>
            <Text className="text-xs text-gray-500 mt-2">
              Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
            </Text>
          </div>

          {error && (
            <Callout className="mb-4 py-2" title="Error" icon={AlertCircle} color="rose">
              <span className="text-xs">{error}</span>
            </Callout>
          )}

          {success ? (
            <div className="text-center space-y-4">
              <Callout title="Enlace enviado" icon={CheckCircle} color="emerald">
                Revisa tu bandeja de entrada para continuar con el proceso.
              </Callout>
              <Link href="/login">
                <Button variant="secondary" color="gray" className="w-full mt-4" icon={ArrowLeft}>
                  Volver al Login
                </Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-600 dark:text-gray-400 ml-1">
                  Correo Electrónico
                </label>
                <TextInput
                  name="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  icon={Mail}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full py-2 bg-larioja-azul hover:bg-blue-800 text-white rounded-xl shadow-lg transition-all"
                loading={loading}
              >
                Enviar Enlace
              </Button>

              <Link href="/login" className="block text-center mt-4">
                <span className="text-xs text-larioja-azul dark:text-larioja-amarillo hover:underline flex items-center justify-center gap-2">
                  <ArrowLeft size={14} /> Volver al inicio de sesión
                </span>
              </Link>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
